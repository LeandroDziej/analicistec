import { Type } from "@google/genai";
import { GeminiError, MODELO_PREFERIDO, crearCliente, getModeloRecordado, type ClienteGemini } from "./gemini.ts";
import {
  AVISO_TRANSFERIR,
  MAX_MENSAJE_TRANSFERENCIA,
  validarDestino,
  type AnalisisTransferencia,
  type RiesgoTransferencia,
  type ValidacionDestino,
} from "./transferenciaUi.ts";
import { EntradaError } from "./entrada.ts";

const TIMEOUT_MS = 20_000;
const RIESGOS: RiesgoTransferencia[] = ["bajo", "medio", "alto"];

export const SYSTEM_PROMPT_TRANSFERENCIA = `Sos "AntiEstafa AR", experto en fraudes de transferencias en Argentina.
Te pasan un alias, CBU o CVU al que alguien debe transferir y el mensaje que lo acompaña.
Evaluá el contexto: urgencia o presión, persona desconocida o que cambió de número, pedido inusual (adelantos, "señas", pagos para liberar algo, devoluciones de "diferencias"), pedido de plata a familiares, alias o cuenta que no parece coincidir con quien dice ser, cambio de cuenta de último momento.
Reglas:
- Nunca afirmes que una cuenta es segura: solo podés estimar el riesgo del contexto.
- No inventes datos que no estén en el mensaje; no sabés a nombre de quién está la cuenta.
- La recomendación SIEMPRE debe indicar verificar por otro canal (llamar a la persona a su número de siempre) y revisar el nombre del titular en la app antes de transferir.
Respondé SOLO con el JSON pedido, en español rioplatense, claro y sin tecnicismos:
- riesgo: "bajo", "medio" o "alto".
- senales: señales concretas del contexto (vacío si no hay).
- recomendacion: 1 o 2 frases con qué hacer ahora.`;

export const RESPONSE_SCHEMA_TRANSFERENCIA = {
  type: Type.OBJECT,
  properties: {
    riesgo: { type: Type.STRING, enum: RIESGOS },
    senales: { type: Type.ARRAY, items: { type: Type.STRING } },
    recomendacion: { type: Type.STRING },
  },
  required: ["riesgo", "senales", "recomendacion"],
  propertyOrdering: ["riesgo", "senales", "recomendacion"],
};

/** Valida el JSON de /api/transferencia: destino con formato correcto y mensaje acotado. */
export function validarEntradaTransferencia(raw: unknown): { destino: ValidacionDestino & { normalizado: string }; mensaje: string } {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const destino = validarDestino(typeof d.destino === "string" ? d.destino : "");
  if (!destino.valido || !destino.normalizado) throw new EntradaError(destino.error ?? "El destino no es válido.");
  const mensaje = typeof d.mensaje === "string" ? d.mensaje.trim() : "";
  if (mensaje.length > MAX_MENSAJE_TRANSFERENCIA) {
    throw new EntradaError(`El mensaje es muy largo (máximo ${MAX_MENSAJE_TRANSFERENCIA} caracteres).`, 413);
  }
  return { destino: destino as ValidacionDestino & { normalizado: string }, mensaje };
}

/** Valida y normaliza la respuesta del modelo. Siempre deja el aviso de verificar por otro canal. */
export function parsearTransferencia(texto: string | undefined): AnalisisTransferencia {
  let data: unknown;
  try {
    data = JSON.parse((texto ?? "").trim());
  } catch {
    throw new GeminiError("JSON inválido del modelo", 502, "No pudimos interpretar el análisis. Probá de nuevo.");
  }
  const d = data as Record<string, unknown>;
  if (!d || typeof d !== "object" || !RIESGOS.includes(d.riesgo as RiesgoTransferencia)) {
    throw new GeminiError("Respuesta sin riesgo válido", 502, "No pudimos interpretar el análisis. Probá de nuevo.");
  }
  const senales = Array.isArray(d.senales)
    ? d.senales.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim())
    : [];
  const rec = typeof d.recomendacion === "string" ? d.recomendacion.trim() : "";
  return {
    riesgo: d.riesgo as RiesgoTransferencia,
    senales,
    recomendacion: /otro canal|llam/i.test(rec) ? rec : `${rec} ${AVISO_TRANSFERIR}`.trim(),
  };
}

export async function analizarTransferencia(
  entrada: { destino: string; tipo: string; mensaje: string },
  opts: { cliente?: ClienteGemini; timeoutMs?: number } = {},
): Promise<AnalisisTransferencia> {
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
            {
              text: `Destino de la transferencia (${entrada.tipo.toUpperCase()}): ${entrada.destino}\n\nMensaje que lo acompaña:\n${entrada.mensaje || "(sin mensaje)"}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_TRANSFERENCIA,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA_TRANSFERENCIA,
        temperature: 0.2,
        abortSignal: ctrl.signal,
      },
    });
    return parsearTransferencia(resp.text);
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    const status = (err as { status?: unknown })?.status;
    if (status === 429) {
      throw new GeminiError("Cuota de Gemini agotada (429)", 429, "Hay mucha gente usando el detector ahora. Esperá un minuto y probá de nuevo.");
    }
    console.error("Gemini (transferencia) falló:", err);
    throw new GeminiError("Gemini no respondió", 503, "El análisis no está disponible en este momento. Probá de nuevo en unos minutos.");
  } finally {
    clearTimeout(timer);
  }
}
