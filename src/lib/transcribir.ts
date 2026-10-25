import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { cortarEnTramos, FRECUENCIA_VOZ, leerWav, remuestrear } from "./wav.ts";

/**
 * Transcripción de voz SIN IA paga: Whisper tiny (OpenAI, licencia MIT) corriendo en nuestro
 * servidor con sherpa-onnx (Apache 2.0). No manda el audio a ningún servicio externo y no cuesta nada.
 * Se usa cuando Gemini no está disponible. Es menos precisa que Gemini, por eso después
 * el motor propio analiza el texto con reglas tolerantes a errores de transcripción.
 */

export const CARPETA_MODELO = path.join(process.cwd(), "modelos", "voz");
/** Tope de audio que transcribimos sin IA (el navegador ya recorta a 2 minutos). */
export const MAX_SEG_SIN_IA = 150;

interface Reconocedor {
  createStream(): { acceptWaveform(o: { sampleRate: number; samples: Float32Array }): void };
  decode(stream: unknown): void;
  getResult(stream: unknown): { text: string };
}

let reconocedor: Reconocedor | null | undefined;

function cargarReconocedor(): Reconocedor | null {
  if (reconocedor !== undefined) return reconocedor;
  try {
    const archivo = (n: string) => path.join(CARPETA_MODELO, n);
    if (!existsSync(archivo("tiny-encoder.int8.onnx"))) throw new Error("No está el modelo de voz en modelos/voz");
    // createRequire: el módulo nativo se carga en tiempo de ejecución, no lo empaqueta Next.
    const sherpa = createRequire(import.meta.url)("sherpa-onnx-node") as { OfflineRecognizer: new (c: unknown) => Reconocedor };
    reconocedor = new sherpa.OfflineRecognizer({
      featConfig: { sampleRate: FRECUENCIA_VOZ, featureDim: 80 },
      modelConfig: {
        whisper: {
          encoder: archivo("tiny-encoder.int8.onnx"),
          decoder: archivo("tiny-decoder.q8e.onnx"),
          language: "es",
          task: "transcribe",
          tailPaddings: -1,
        },
        tokens: archivo("tiny-tokens.txt"),
        numThreads: 2,
        provider: "cpu",
        debug: 0,
      },
    });
  } catch (err) {
    console.warn("[voz] No se pudo cargar el transcriptor local:", err);
    reconocedor = null;
  }
  return reconocedor;
}

/** Limpia lo que a veces agrega Whisper sin que nadie lo diga (subtítulos, música, silencios). */
export function limpiarTranscripcion(texto: string): string {
  return texto
    .replace(/\[[^\]]*\]|\([^)]*\)/g, " ")
    .replace(/subt[ií]tulos (realizados )?por .*?(amara\.org|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Transcribe un WAV (el navegador lo manda a 16 kHz). Devuelve null si no es un WAV,
 * si el transcriptor no está disponible o si no se entendió nada.
 */
export async function transcribirSinIA(bytes: Uint8Array): Promise<string | null> {
  const onda = leerWav(bytes);
  if (!onda || onda.muestras.length === 0) return null;
  const rec = cargarReconocedor();
  if (!rec) return null;
  let muestras = remuestrear(onda.muestras, onda.frecuencia, FRECUENCIA_VOZ);
  muestras = muestras.subarray(0, MAX_SEG_SIN_IA * FRECUENCIA_VOZ);
  const partes: string[] = [];
  for (const tramo of cortarEnTramos(muestras, FRECUENCIA_VOZ)) {
    const stream = rec.createStream();
    stream.acceptWaveform({ sampleRate: FRECUENCIA_VOZ, samples: tramo });
    rec.decode(stream);
    partes.push(rec.getResult(stream).text);
  }
  const texto = limpiarTranscripcion(partes.join(" "));
  return texto.length >= 3 ? texto : null;
}
