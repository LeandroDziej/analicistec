import { analizarConGemini, GeminiError, type AnalisisLLM, type EntradaAnalisis } from "./gemini.ts";
import { analizarSinIA, MODELO_MOTOR_PROPIO } from "./motorPropio.ts";

/**
 * IA si se puede; si no hay clave, se agotó la cuota o Gemini no responde, el motor propio (gratis).
 * Una captura sola no se puede leer sin IA: en ese caso sí devolvemos el error.
 */
export async function analizarConRespaldo(
  entrada: EntradaAnalisis,
  analizar: (e: EntradaAnalisis) => Promise<{ analisis: AnalisisLLM; modelo: string }> = analizarConGemini,
): Promise<{ analisis: AnalisisLLM; modelo: string; sinIA: boolean }> {
  try {
    const r = await analizar(entrada);
    return { ...r, sinIA: false };
  } catch (err) {
    if (!(err instanceof GeminiError) || !entrada.texto?.trim()) throw err;
    console.warn(`[analyze] Gemini no disponible (${err.status}): uso el motor propio.`);
    const { veredicto, score, banderas, que_hacer, resumen_abuela } = analizarSinIA(entrada.texto);
    return { analisis: { veredicto, score, banderas, que_hacer, resumen_abuela }, modelo: MODELO_MOTOR_PROPIO, sinIA: true };
  }
}

