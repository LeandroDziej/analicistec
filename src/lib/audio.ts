/** Utilidades del análisis de audios (lado del navegador, sin dependencias). */

export const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
/** Tope de la grabación con el micrófono: 3 minutos de opus entran holgados en 4 MB. */
export const MAX_GRABACION_SEG = 180;

const EXTENSIONES = /\.(opus|ogg|oga|mp3|m4a|mp4|aac|wav|webm|amr|3gp)$/i;

/** Valida el archivo antes de mandarlo. WhatsApp a veces entrega las notas de voz sin tipo: miramos la extensión. */
export function validarAudioCliente(archivo: { size: number; type: string; name: string }): string | null {
  if (archivo.size === 0) return "El audio está vacío.";
  if (archivo.size > MAX_AUDIO_BYTES) return "El audio pesa más de 4 MB. Probá con uno más corto (hasta 3 o 4 minutos).";
  const esAudio = archivo.type.startsWith("audio/") || archivo.type === "video/mp4" || EXTENSIONES.test(archivo.name);
  if (!esAudio) return "Elegí un audio: la nota de voz de WhatsApp (.opus), MP3, M4A o WAV.";
  return null;
}

/** El primer formato de grabación que soporte el navegador (Chrome/Firefox: webm u ogg; Safari: mp4). */
export function formatoGrabacion(soporta: (tipo: string) => boolean): string | undefined {
  return ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/webm", "audio/mp4"].find((t) => soporta(t));
}

/** 75 → "1:15" */
export function formatoDuracion(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
