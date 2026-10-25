import { analizarConGemini, GeminiError, type AnalisisLLM, type EntradaAnalisis } from "./gemini.ts";
import { analizarSinIA, MODELO_MOTOR_PROPIO } from "./motorPropio.ts";
import { transcribirSinIA } from "./transcribir.ts";

export const MODELO_VOZ_PROPIA = "voz-propia+motor-propio";

type Analizar = (e: EntradaAnalisis) => Promise<{ analisis: AnalisisLLM; modelo: string }>;
type Transcribir = (bytes: Uint8Array) => Promise<string | null>;

/**
 * IA si se puede; si no hay clave, se agotó la cuota o Gemini no responde, lo hacemos nosotros gratis:
 * - texto → motor propio (reglas de estafas argentinas);
 * - audio → lo transcribimos en nuestro servidor (Whisper local) y el motor propio analiza lo que dice,
 *   con reglas pensadas para voz (familiar con otro número, "le hablamos del banco", voces clonadas).
 * Una captura sola no se puede leer sin IA: en ese caso sí devolvemos el error.
 */
export async function analizarConRespaldo(
  entrada: EntradaAnalisis,
  analizar: Analizar = analizarConGemini,
  transcribir: Transcribir = transcribirSinIA,
): Promise<{ analisis: AnalisisLLM; modelo: string; sinIA: boolean }> {
  try {
    const r = await analizar(entrada);
    return { ...r, sinIA: false };
  } catch (err) {
    if (!(err instanceof GeminiError)) throw err;
    console.warn(`[analyze] Gemini no disponible (${err.status}): uso el análisis propio.`);

    if (!entrada.texto?.trim() && entrada.audio) {
      const transcripcion = await transcribir(new Uint8Array(Buffer.from(entrada.audio.base64, "base64"))).catch((e) => {
        console.warn("[analyze] Falló la transcripción local:", e);
        return null;
      });
      if (!transcripcion) {
        throw new GeminiError(
          err.message,
          err.status,
          "No pudimos entender el audio. Probá con un audio más claro o más corto, grabalo con el micrófono acercando el celular, o probá de nuevo en un rato.",
        );
      }
      const { veredicto, score, banderas, que_hacer, resumen_abuela } = analizarSinIA(transcripcion, { audio: true });
      return {
        analisis: { veredicto, score, banderas, que_hacer, resumen_abuela, transcripcion },
        modelo: MODELO_VOZ_PROPIA,
        sinIA: true,
      };
    }

    if (!entrada.texto?.trim()) throw err;
    const { veredicto, score, banderas, que_hacer, resumen_abuela } = analizarSinIA(entrada.texto);
    return { analisis: { veredicto, score, banderas, que_hacer, resumen_abuela }, modelo: MODELO_MOTOR_PROPIO, sinIA: true };
  }
}
