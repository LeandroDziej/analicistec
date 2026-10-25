import { GoogleGenAI, Type } from "@google/genai";
import { textoContexto, type ContextoUsuario } from "./preguntas.ts";

export type Veredicto = "seguro" | "sospechoso" | "estafa";

export interface AnalisisLLM {
  veredicto: Veredicto;
  score: number;
  banderas: string[];
  que_hacer: string[];
  resumen_abuela: string;
  /** Solo para audios: lo que dice el audio, escrito. */
  transcripcion?: string;
}

export interface EntradaAnalisis {
  texto?: string;
  imagen?: { mimeType: string; base64: string };
  /** Audio (nota de voz de WhatsApp, mp3, m4a…). */
  audio?: { mimeType: string; base64: string };
  contexto?: ContextoUsuario;
}

export const MODELO_PREFERIDO = "gemini-3.8-flash";
const TIMEOUT_MS = 12_000;
/** Tope para toda la cadena de modelos, pasadas y reintentos (la ruta tiene maxDuration = 60). */
const LIMITE_TOTAL_MS = 45_000;
const MAX_MODELOS = 3;
const MAX_LITE = 2;
const PASADAS = 2;
const REINTENTOS_429 = 2;
const ESPERA_429_MS = 1_500;
const ESPERA_429_MAX_MS = 5_000;

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
Si el contenido no tiene nada sospechoso, decilo y usá score bajo. No inventes datos que no estén en el mensaje.
Si recibís un AUDIO (nota de voz o llamada grabada): escribí en "transcripcion" lo que se dice (máximo 600 caracteres, sin inventar lo que no se entiende) y analizalo igual. Ojo con voces que dicen ser un familiar, el banco o un organismo y piden plata, códigos o datos: hoy las voces se pueden clonar con IA. Si no es un audio, dejá "transcripcion" vacío.`;

export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    veredicto: { type: Type.STRING, enum: ["seguro", "sospechoso", "estafa"] },
    score: { type: Type.INTEGER, minimum: 0, maximum: 100 },
    banderas: { type: Type.ARRAY, items: { type: Type.STRING } },
    que_hacer: { type: Type.ARRAY, items: { type: Type.STRING } },
    resumen_abuela: { type: Type.STRING },
    transcripcion: { type: Type.STRING },
  },
  required: ["veredicto", "score", "banderas", "que_hacer", "resumen_abuela"],
  propertyOrdering: ["veredicto", "score", "banderas", "que_hacer", "resumen_abuela", "transcripcion"],
};

/** Pensar lo mínimo que acepta el modelo: "thinkingLevel" LOW (MINIMAL da 400 en gemini-3.8-flash) en Gemini 3+, "thinkingBudget" 0 en versiones anteriores. */
export function configThinking(model: string): Record<string, unknown> {
  const version = Number(/gemini-(\d+(?:\.\d+)?)/.exec(model)?.[1] ?? 0);
  return { thinkingConfig: version >= 3 ? { thinkingLevel: "LOW" } : { thinkingBudget: 0 } };
}

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
    ...(typeof d.transcripcion === "string" && d.transcripcion.trim() ? { transcripcion: d.transcripcion.trim().slice(0, 800) } : {}),
  };
}

function statusDe(err: unknown): number | undefined {
  const e = err as { status?: unknown; name?: string; message?: string };
  if (typeof e?.status === "number") return e.status;
  if (e?.name === "AbortError" || /timeout|timed out|aborted/i.test(e?.message ?? "")) return 504;
  const m = /\b(404|429|500|503|504)\b/.exec(e?.message ?? "");
  return m ? Number(m[1]) : undefined;
}

/**
 * Espera antes de reintentar un 429: usa el retryDelay que sugiere la API (ej. "retryDelay":"3s"
 * o "retry in 2.5s") si viene, si no backoff exponencial. Siempre acotado a ESPERA_429_MAX_MS.
 */
export function esperaPara429(err: unknown, intento: number): number {
  const msg = String((err as { message?: unknown })?.message ?? "");
  const m = /retry(?:Delay"?\s*:\s*"?| in )(\d+(?:\.\d+)?)s/i.exec(msg);
  const sugerida = m ? Math.ceil(Number(m[1]) * 1000) : ESPERA_429_MS * 2 ** intento;
  return Math.min(ESPERA_429_MAX_MS, Math.max(250, sugerida));
}

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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

/** Filtra los nombres por patrón y los ordena del más reciente al más viejo (estables antes que preview). */
function masRecientes(nombres: string[], patron: RegExp, max: number): string[] {
  const version = (n: string) => {
    const m = /gemini-(\d+(?:\.\d+)?)/.exec(n);
    return m ? Number(m[1]) : 0;
  };
  return [...new Set(nombres.map((n) => n.replace(/^models\//, "")))]
    .filter((n) => patron.test(n) && !/image|tts|live|audio/.test(n))
    .sort((a, b) => version(b) - version(a) || Number(a.includes("preview")) - Number(b.includes("preview")))
    .slice(0, max);
}

/** Elige los flash más recientes a partir del listado de modelos. */
export function elegirFlashRecientes(nombres: string[], max = MAX_MODELOS): string[] {
  return masRecientes(nombres, /^gemini-[\d.]+-flash(-latest|-preview[\w-]*)?$/, max);
}

/** Elige los flash-lite más recientes (último recurso, después de los flash). */
export function elegirFlashLiteRecientes(nombres: string[], max = MAX_LITE): string[] {
  return masRecientes(nombres, /^gemini-[\d.]+-flash-lite(-latest|-preview[\w-]*)?$/, max);
}

let modeloRecordado: string | null = null;
export const _resetModeloRecordado = () => {
  modeloRecordado = null;
};
export const getModeloRecordado = () => modeloRecordado;

async function listarModelos(cliente: ClienteGemini): Promise<{ flash: string[]; lite: string[] }> {
  try {
    const pager = await cliente.models.list();
    const nombres: string[] = [];
    for await (const m of pager) {
      if (m.name && (!m.supportedActions || m.supportedActions.includes("generateContent"))) nombres.push(m.name);
      if (nombres.length > 300) break;
    }
    return { flash: elegirFlashRecientes(nombres), lite: elegirFlashLiteRecientes(nombres) };
  } catch {
    return { flash: [], lite: [] };
  }
}

function construirContenido(entrada: EntradaAnalisis) {
  const parts: Record<string, unknown>[] = [];
  if (entrada.imagen) parts.push({ inlineData: { mimeType: entrada.imagen.mimeType, data: entrada.imagen.base64 } });
  if (entrada.audio) parts.push({ inlineData: { mimeType: entrada.audio.mimeType, data: entrada.audio.base64 } });
  const texto = entrada.texto?.trim();
  const pedido = texto
    ? `Analizá este mensaje recibido:\n"""\n${texto}\n"""`
    : entrada.audio
      ? "Escuchá el audio adjunto (una nota de voz o llamada que recibió la persona), transcribilo y analizalo."
      : "Analizá la captura de pantalla adjunta (leé todo el texto visible).";
  parts.push({ text: pedido + textoContexto(entrada.contexto) });
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
 * Analiza el contenido con Gemini. Ante 404/500/503/504/timeout prueba hasta 3 modelos flash y
 * después hasta 2 flash-lite, y recuerda el que respondió. Si todos los que fallaron dieron 503/504
 * (sobrecarga), reintenta la cadena completa una vez. Ante 429 reintenta con espera (hasta 2 veces).
 * Todo eso está acotado a LIMITE_TOTAL_MS: si se pasa, corta con el mensaje amable de error.
 */
export async function analizarConGemini(
  entrada: EntradaAnalisis,
  opts: { cliente?: ClienteGemini; timeoutMs?: number; totalMs?: number; esperar?: (ms: number) => Promise<void> } = {},
): Promise<{ analisis: AnalisisLLM; modelo: string }> {
  const cliente = opts.cliente ?? crearCliente();
  const timeoutMs = opts.timeoutMs ?? TIMEOUT_MS;
  const limite = Date.now() + (opts.totalMs ?? LIMITE_TOTAL_MS);
  const restante = () => limite - Date.now();
  const esperar = opts.esperar ?? dormir;
  let reintentos429 = 0;
  const contents = construirContenido(entrada);

  let cadena: string[] = [modeloRecordado ?? MODELO_PREFERIDO];
  let listado = false;
  let ultimoError: unknown;

  for (let pasada = 0; pasada < PASADAS; pasada++) {
    // Modelos que dieron 503/504; los 404 no cuentan (no existen) y cualquier otro error evita la segunda pasada.
    const sobrecargados: string[] = [];
    let soloSobrecarga = true;

    for (let i = 0; i < cadena.length; i++) {
      const model = cadena[i];
      // Reintenta el mismo modelo solo ante 429; cualquier otro error pasa al siguiente o corta.
      while (true) {
        if (restante() <= 0) return fallarPorLimite(ultimoError);
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
                  ...configThinking(model),
                  abortSignal,
                },
              }),
            Math.min(timeoutMs, restante()),
          );
          const analisis = parsearRespuesta(resp.text);
          modeloRecordado = model;
          return { analisis, modelo: model };
        } catch (err) {
          if (err instanceof GeminiError) throw err;
          ultimoError = err;
          const status = statusDe(err);
          if (status === 429) {
            if (reintentos429 < REINTENTOS_429) {
              const ms = esperaPara429(err, reintentos429++);
              if (ms >= restante()) return fallarPorLimite(err);
              console.warn(`Gemini ${model} 429, reintento en ${ms} ms`);
              await esperar(ms);
              continue;
            }
            throw new GeminiError("Cuota de Gemini agotada (429)", 429, "Hay mucha gente usando el detector ahora. Esperá un minuto y probá de nuevo.");
          }
          console.warn(`Gemini ${model} falló (status ${status ?? "?"}, pasada ${pasada + 1})`);
          if (!esReintentableConOtroModelo(status)) return fallar(ultimoError);
          if (status === 503 || status === 504) sobrecargados.push(model);
          else if (status !== 404) soloSobrecarga = false;
          if (modeloRecordado === model) modeloRecordado = null;
          if (!listado) {
            listado = true;
            const { flash, lite } = await conTimeout(() => listarModelos(cliente), Math.max(0, restante())).catch(() => ({
              flash: [] as string[],
              lite: [] as string[],
            }));
            const flashes = [...new Set([...cadena, ...flash])].slice(0, MAX_MODELOS);
            cadena = [...flashes, ...lite.filter((m) => !flashes.includes(m))];
          }
          break;
        }
      }
    }
    if (!soloSobrecarga || sobrecargados.length === 0) break;
    cadena = sobrecargados;
  }
  return fallar(ultimoError);
}

function fallarPorLimite(err: unknown): never {
  console.warn(`Gemini superó el límite total de ${LIMITE_TOTAL_MS} ms`);
  return fallar(err);
}

function fallar(err: unknown): never {
  console.error("Gemini falló:", err);
  throw new GeminiError("Gemini no respondió", 503, "El análisis no está disponible en este momento. Probá de nuevo en unos minutos.");
}
