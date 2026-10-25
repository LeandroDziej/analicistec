import { escribirWav, FRECUENCIA_VOZ } from "./wav";

/** Lo que mandamos al servidor como máximo: 2 minutos de WAV a 16 kHz son 3,8 MB (entra en el límite de 4 MB). */
export const MAX_SEG_ENVIO = 120;

/**
 * Pasa cualquier audio que entienda el navegador (nota de voz de WhatsApp, mp3, m4a, grabación)
 * a WAV mono de 16 kHz. Así el servidor lo puede transcribir aunque la IA no esté disponible.
 * Si el navegador no puede leer el formato, devuelve null y se manda el archivo original.
 */
export async function convertirAWav(archivo: Blob): Promise<{ wav: File; recortado: boolean; segundos: number } | null> {
  const Contexto =
    typeof window !== "undefined"
      ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!Contexto || typeof OfflineAudioContext === "undefined") return null;
  const ctx = new Contexto();
  try {
    const audio = await ctx.decodeAudioData(await archivo.arrayBuffer());
    const segundos = Math.min(audio.duration, MAX_SEG_ENVIO);
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(segundos * FRECUENCIA_VOZ)), FRECUENCIA_VOZ);
    const fuente = offline.createBufferSource();
    fuente.buffer = audio;
    fuente.connect(offline.destination);
    fuente.start(0);
    const resultado = await offline.startRendering();
    const bytes = escribirWav(resultado.getChannelData(0), FRECUENCIA_VOZ);
    return {
      wav: new File([bytes.slice().buffer as ArrayBuffer], "audio.wav", { type: "audio/wav" }),
      recortado: audio.duration > MAX_SEG_ENVIO + 0.5,
      segundos: audio.duration,
    };
  } catch {
    return null;
  } finally {
    ctx.close().catch(() => {});
  }
}
