import { Type } from "@google/genai";
import { GeminiError, MODELO_PREFERIDO, crearCliente, getModeloRecordado, type ClienteGemini } from "./gemini.ts";
import { AVISO_VERIFICAR, type AnalisisComprobante, type VeredictoComprobante } from "./comprobanteUi.ts";
import { EntradaError, MAX_IMAGEN_BYTES, detectarMimeImagen } from "./entrada.ts";

const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];
const TIMEOUT_MS = 20_000;
const VEREDICTOS: VeredictoComprobante[] = ["parece_real", "sospechoso", "probablemente_falso"];

export const SYSTEM_PROMPT_COMPROBANTE = `Sos "AntiEstafa AR", experto en fraudes de compraventa en Argentina.
Te pasan la imagen de un comprobante de transferencia o pago (Mercado Pago, banco, billetera virtual) que recibió un vendedor.
Buscá señales de falsificación: tipografías o alineaciones inconsistentes, montos o fechas raros, número de operación o CVU/CBU con formato inválido, bordes recortados o pegados, captura de una captura, falta de datos que la app real muestra, estado "pendiente" o "en proceso", pedidos de devolución o de "diferencia" que acompañen al comprobante.
Reglas:
- Nunca afirmes certeza: solo podés decir qué tan verosímil parece.
- Si la imagen no es un comprobante, usá "sospechoso" y explicalo en las señales.
- No inventes datos que no se vean en la imagen.
- La recomendación SIEMPRE debe indicar verificar el ingreso en la app del banco o billetera, no en el comprobante.
Respondé SOLO con el JSON pedido, en español rioplatense, claro y sin tecnicismos:
- veredicto: "parece_real", "sospechoso" o "probablemente_falso".
- senales: señales concretas que viste (vacío si no hay).
- recomendacion: 1 o 2 frases con qué hacer ahora.`;

export const RESPONSE_SCHEMA_COMPROBANTE = {
  type: Type.OBJECT,
  properties: {
    veredicto: { type: Type.STRING, enum: VEREDICTOS },
    senales: { type: Type.ARRAY, items: { type: Type.STRING } },
    recomendacion: { type: Type.STRING },
  },
  required: ["veredicto", "senales", "recomendacion"],
  propertyOrdering: ["veredicto", "senales", "recomendacion"],
};

/** Valida un archivo de comprobante (máx 4 MB, PNG/JPG/WebP según sus bytes reales). */
export function validarComprobante(bytes: Uint8Array): { mimeType: string; base64: string } {
  if (bytes.length === 0) throw new EntradaError("La imagen está vacía.");
  if (bytes.length > MAX_IMAGEN_BYTES) throw new EntradaError("La imagen pesa más de 4 MB. Probá con una captura más liviana.", 413);
  const mimeType = detectarMimeImagen(bytes);
  if (!mimeType || !TIPOS_PERMITIDOS.includes(mimeType)) {
    throw new EntradaError("Solo aceptamos imágenes PNG, JPG o WebP.", 415);
  }
  return { mimeType, base64: Buffer.from(bytes).toString("base64") };
}

/** Lee el multipart de /api/comprobante: campo "imagen". */
export async function leerComprobante(request: Request): Promise<{ mimeType: string; base64: string }> {
  const largo = Number(request.headers.get("content-length") ?? 0);
  if (largo > MAX_IMAGEN_BYTES * 1.4 + 64 * 1024) {
    throw new EntradaError("La imagen pesa más de 4 MB. Probá con una captura más liviana.", 413);
  }
  if (!(request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    throw new EntradaError("Subí la imagen del comprobante.");
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new EntradaError("No pudimos leer lo que mandaste. Probá de nuevo.");
  }
  const archivo = form.get("imagen");
  if (!archivo || typeof archivo === "string") throw new EntradaError("Subí la imagen del comprobante.");
  if (archivo.size > MAX_IMAGEN_BYTES) throw new EntradaError("La imagen pesa más de 4 MB. Probá con una captura más liviana.", 413);
  return validarComprobante(new Uint8Array(await archivo.arrayBuffer()));
}

/** Valida y normaliza la respuesta del modelo. Siempre deja el aviso de verificar en la app. */
export function parsearComprobante(texto: string | undefined): AnalisisComprobante {
  let data: unknown;
  try {
    data = JSON.parse((texto ?? "").trim());
  } catch {
    throw new GeminiError("JSON inválido del modelo", 502, "No pudimos interpretar el análisis. Probá de nuevo.");
  }
  const d = data as Record<string, unknown>;
  if (!d || typeof d !== "object" || !VEREDICTOS.includes(d.veredicto as VeredictoComprobante)) {
    throw new GeminiError("Respuesta sin veredicto válido", 502, "No pudimos interpretar el análisis. Probá de nuevo.");
  }
  const senales = Array.isArray(d.senales)
    ? d.senales.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim())
    : [];
  const rec = typeof d.recomendacion === "string" ? d.recomendacion.trim() : "";
  return {
    veredicto: d.veredicto as VeredictoComprobante,
    senales,
    recomendacion: /app|banco|billetera/i.test(rec) ? rec : `${rec} ${AVISO_VERIFICAR}`.trim(),
  };
}

export async function analizarComprobante(
  imagen: { mimeType: string; base64: string },
  opts: { cliente?: ClienteGemini; timeoutMs?: number } = {},
): Promise<AnalisisComprobante> {
  const cliente = opts.cliente ?? crearCliente();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  try {
    const resp = await cliente.models.generateContent({
      model: getModeloRecordado() ?? MODELO_PREFERIDO,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: imagen.mimeType, data: imagen.base64 } },
            { text: "Analizá este comprobante de pago y decime si parece real." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_COMPROBANTE,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA_COMPROBANTE,
        temperature: 0.2,
        abortSignal: ctrl.signal,
      },
    });
    return parsearComprobante(resp.text);
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    const status = (err as { status?: unknown })?.status;
    if (status === 429) {
      throw new GeminiError("Cuota de Gemini agotada (429)", 429, "Hay mucha gente usando el detector ahora. Esperá un minuto y probá de nuevo.");
    }
    console.error("Gemini (comprobante) falló:", err);
    throw new GeminiError("Gemini no respondió", 503, "El análisis no está disponible en este momento. Probá de nuevo en unos minutos.");
  } finally {
    clearTimeout(timer);
  }
}
