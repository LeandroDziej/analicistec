import { GoogleGenAI, Type } from "@google/genai";

export type Veredicto = "seguro" | "sospechoso" | "estafa";

export interface AnalisisLLM {
  veredicto: Veredicto;
  score: number;
  banderas: string[];
  que_hacer: string[];
  resumen_abuela: string;
}

export interface EntradaAnalisis {
  texto?: string;
  imagen?: { mimeType: string; base64: string };
}

export const MODELO_PREFERIDO = "gemini-3.8-flash";
const TIMEOUT_MS = 20_000;
const MAX_MODELOS = 3;

export const SYSTEM_PROMPT = `Sos "AntiEstafa AR", un experto en fraudes digitales en Argentina.
Analizás mensajes (WhatsApp, SMS, mail, redes) y decidís si son una estafa.

Modalidades frecuentes en Argentina:
- Falso ARCA/AFIP: deudas, embargos o devoluciones con link para "regularizar" o pagar.
- Falso Mercado Pago / Mercado Libre: cuenta bloqueada, pago retenido, link para "validar" datos o pedir el código de verificación.
- Falso Correo Argentino / Andreani / OCA: paquete retenido, pagar un "arancel" chico con tarjeta.
- "Hola mamá/papá, cambié de número": un supuesto hijo/familiar pide plata urgente por transferencia.
- Marketplace / compraventa: comprador que "ya pagó" y manda comprobante falso, o pide datos para "liberar" el dinero; vendedores con precios irreales que piden seña.
- Soporte bancario falso: "te llamamos del banco", piden token, clave, código SMS, o que vayas al cajero / homebanking a "desbloquear".
- Inversiones y cripto falsas: ganancias garantizadas, "duplicá tu plata", grupos de trading, esquemas Ponzi, famosos que recomiendan.
- Otros: premios y sorteos falsos, ofertas de empleo con pago previo, robo de cuenta de WhatsApp pidiendo el código de 6 dígitos, alquileres falsos.

Señales de alerta: urgencia o amenazas, pedido de códigos/claves/token, links acortados o dominios raros que imitan marcas (ej. mercadopago-validar.com, afip-gob.net), errores de ortografía, transferencias a CVU/alias de terceros, números desconocidos.
Recordá: los organismos y bancos reales NUNCA piden claves, tokens ni códigos por mensaje.

Respondé SOLO con el JSON pedido, en español rioplatense, claro y sin tecnicismos:
- veredicto: "seguro", "sospechoso" o "estafa".
- score: 0 a 100 = probabilidad de estafa (0 = seguro, 100 = estafa segura).
- banderas: señales concretas que encontraste (vacío si no hay).
- que_hacer: 2 a 4 pasos concretos para la persona ahora mismo.
- resumen_abuela: exactamente 2 líneas cortas, para alguien mayor, sin palabras técnicas.
Si el contenido no tiene nada sospechoso, decilo y usá score bajo. No inventes datos que no estén en el mensaje.`;

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    veredicto: { type: Type.STRING, enum: ["seguro", "sospechoso", "estafa"] },
    score: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    banderas: { type: Type.ARRAY, items: { type: Type.STRING } },
    que_hacer: { type: Type.ARRAY, items: { type: Type.STRING } },
    resumen_abuela: { type: Type.STRING },
  },
  required: ["veredicto", "score", "banderas", "que_hacer", "resumen_abuela"],
  propertyOrdering: ["veredicto", "score", "banderas", "que_hacer", "resumen_abuela"],
};

export class GeminiError extends Error {
  status: number;
  mensajeUsuario: string;

  constructor(message: string, status: number, mensajeUsuario: string) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
    this.mensajeUsuario = mensajeUsuario;
  }
}

/** Limpia espacios, saltos y el BOM (U+FEFF) que agrega PowerShell 5.1. */
export function limpiarApiKey(raw: string | undefined): string {
  return (raw ?? "").replace(/^﻿/, "").replace(/[﻿\s]/g, "");
}

/** Valida y normaliza la respuesta del modelo. Lanza si no es usable. */
export function parsearRespuesta(texto: string | undefined): AnalisisLLM {
  let data: unknown;
  try {
    data = JSON.parse((texto ?? "").trim());
  } catch {
    throw new GeminiError("JSON inválido del modelo", 502, "No pudimos interpretar el análisis. Probá de nuevo.");
  }
  const d = data as Record<string, unknown>;
  const veredictos: Veredicto[] = ["seguro", "sospechoso", "estafa"];
  if (!d || typeof d !== "object" || !veredictos.includes(d.veredicto as Veredicto)) {
    throw new GeminiError("Respuesta sin veredicto válido", 502, "No pudimos interpretar el análisis. Probá de nuevo.");
  }
  const lista = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];
  const score = Math.round(Number(d.score));
  return {
    veredicto: d.veredicto as Veredicto,
    score: Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : 50,
    banderas: lista(d.banderas),
    que_hacer: lista(d.que_hacer),
    resumen_abuela: typeof d.resumen_abuela === "string" ? d.resumen_abuela.trim() : "",
  };
}

function statusDe(err: unknown): number | undefined {
  const e = err as { status?: unknown; name?: string; message?: string };
  if (typeof e?.status === "number") return e.status;
  if (e?.name === "AbortError" || /timeout|timed out|aborted/i.test(e?.message ?? "")) return 504;
  const m = /\b(404|429|500|503|504)\b/.exec(e?.message ?? "");
  return m ? Number(m[1]) : undefined;
}

/** Errores que justifican probar con otro modelo. */
const esReintentableConOtroModelo = (s: number | undefined) => s === 404 || s === 503 || s === 504 || s === 500;

/** Interfaz mínima del cliente, para poder simularlo en tests. */
export interface ClienteGemini {
  models: {
    generateContent(params: {
      model: string;
      contents: unknown;
      config?: Record<string, unknown>;
    }): Promise<{ text?: string }>;
    list(): Promise<AsyncIterable<{ name?: string; supportedActions?: string[] }>>;
  };
}

/** Elige los flash más recientes a partir del listado de modelos. */
export function elegirFlashRecientes(nombres: string[], max = MAX_MODELOS): string[] {
  const version = (n: string) => {
    const m = /gemini-(\d+(?:\.\d+)?)/.exec(n);
    return m ? Number(m[1]) : 0;
  };
  return [...new Set(nombres.map((n) => n.replace(/^models\//, "")))]
    .filter((n) => /^gemini-[\d.]+-flash(-latest|-preview[\w-]*)?$/.test(n) && !/lite|image|tts|live|audio/.test(n))
    .sort((a, b) => version(b) - version(a) || Number(a.includes("preview")) - Number(b.includes("preview")))
    .slice(0, max);
}

let modeloRecordado: string | null = null;
export const _resetModeloRecordado = () => {
  modeloRecordado = null;
};
export const getModeloRecordado = () => modeloRecordado;

async function listarFlash(cliente: ClienteGemini): Promise<string[]> {
  try {
    const pager = await cliente.models.list();
    const nombres: string[] = [];
    for await (const m of pager) {
      if (m.name && (!m.supportedActions || m.supportedActions.includes("generateContent"))) nombres.push(m.name);
      if (nombres.length > 300) break;
    }
    return elegirFlashRecientes(nombres);
  } catch {
    return [];
  }
}

function construirContenido(entrada: EntradaAnalisis) {
  const parts: Record<string, unknown>[] = [];
  if (entrada.imagen) parts.push({ inlineData: { mimeType: entrada.imagen.mimeType, data: entrada.imagen.base64 } });
  const texto = entrada.texto?.trim();
  parts.push({
    text: texto
      ? `Analizá este mensaje recibido:\n"""\n${texto}\n"""`
      : "Analizá la captura de pantalla adjunta (leé todo el texto visible).",
  });
  return [{ role: "user", parts }];
}

async function conTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, rej) => {
    timer = setTimeout(() => {
      ctrl.abort();
      rej(Object.assign(new Error("timeout"), { status: 504 }));
    }, ms);
  });
  try {
    return await Promise.race([fn(ctrl.signal), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

export function crearCliente(): ClienteGemini {
  const apiKey = limpiarApiKey(process.env.GEMINI_API_KEY);
  if (!apiKey) throw new GeminiError("Falta GEMINI_API_KEY", 500, "El servicio no está configurado. Avisanos y lo arreglamos.");
  return new GoogleGenAI({ apiKey }) as unknown as ClienteGemini;
}

/**
 * Analiza el contenido con Gemini. Prueba hasta 3 modelos flash ante 404/503/504/timeout
 * y recuerda el que respondió.
 */
export async function analizarConGemini(
  entrada: EntradaAnalisis,
  opts: { cliente?: ClienteGemini; timeoutMs?: number } = {},
): Promise<{ analisis: AnalisisLLM; modelo: string }> {
  const cliente = opts.cliente ?? crearCliente();
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const contents = construirContenido(entrada);

  const candidatos: string[] = [modeloRecordado ?? MODELO_PREFERIDO];
  let listado = false;
  let ultimoError: unknown;

  for (let i = 0; i < candidatos.length && i < MAX_MODELOS; i++) {
    const model = candidatos[i];
    try {
      const resp = await conTimeout(
        (abortSignal) =>
          cliente.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
              temperature: 0.2,
              abortSignal,
            },
          }),
        timeoutMs,
      );
      const analisis = parsearRespuesta(resp.text);
      modeloRecordado = model;
      return { analisis, modelo: model };
    } catch (err) {
      if (err instanceof GeminiError) throw err;
      ultimoError = err;
      const status = statusDe(err);
      if (status === 429) {
        throw new GeminiError("Cuota de Gemini agotada (429)", 429, "Hay mucha gente usando el detector ahora. Esperá un minuto y probá de nuevo.");
      }
      console.warn(`Gemini ${model} falló (status ${status ?? "?"})`);
      if (!esReintentableConOtroModelo(status)) break;
      if (modeloRecordado === model) modeloRecordado = null;
      if (!listado) {
        listado = true;
        for (const m of await listarFlash(cliente)) if (!candidatos.includes(m)) candidatos.push(m);
      }
    }
  }
  console.error("Gemini falló:", ultimoError);
  throw new GeminiError("Gemini no respondió", 503, "El análisis no está disponible en este momento. Probá de nuevo en unos minutos.");
}
