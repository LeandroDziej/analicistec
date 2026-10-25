/**
 * Lectura y escritura de WAV (PCM), sin dependencias. Se usa de los dos lados:
 * el navegador convierte el audio a WAV de 16 kHz y el servidor lo lee para transcribirlo sin IA.
 */

export const FRECUENCIA_VOZ = 16_000;

export interface Onda {
  frecuencia: number;
  muestras: Float32Array;
}

/** Lee un WAV PCM de 16 bits o float de 32 bits, mono o estéreo (lo pasa a mono). Devuelve null si no es un WAV que entendamos. */
export function leerWav(bytes: Uint8Array): Onda | null {
  if (bytes.length < 44) return null;
  const ascii = (i: number) => String.fromCharCode(bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]);
  if (ascii(0) !== "RIFF" || ascii(8) !== "WAVE") return null;
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let formato = 0;
  let canales = 0;
  let frecuencia = 0;
  let bits = 0;
  let pos = 12;
  while (pos + 8 <= bytes.length) {
    const id = ascii(pos);
    const largo = vista.getUint32(pos + 4, true);
    const inicio = pos + 8;
    if (id === "fmt ") {
      formato = vista.getUint16(inicio, true);
      canales = vista.getUint16(inicio + 2, true);
      frecuencia = vista.getUint32(inicio + 4, true);
      bits = vista.getUint16(inicio + 14, true);
    } else if (id === "data") {
      if (!canales || !frecuencia) return null;
      const fin = Math.min(bytes.length, inicio + largo);
      const esPcm16 = formato === 1 && bits === 16;
      const esFloat = formato === 3 && bits === 32;
      if (!esPcm16 && !esFloat) return null;
      const bytesPorMuestra = bits / 8;
      const cuadros = Math.floor((fin - inicio) / (bytesPorMuestra * canales));
      const muestras = new Float32Array(cuadros);
      for (let i = 0; i < cuadros; i++) {
        let suma = 0;
        for (let c = 0; c < canales; c++) {
          const o = inicio + (i * canales + c) * bytesPorMuestra;
          suma += esPcm16 ? vista.getInt16(o, true) / 32768 : vista.getFloat32(o, true);
        }
        muestras[i] = suma / canales;
      }
      return { frecuencia, muestras };
    }
    pos = inicio + largo + (largo % 2);
  }
  return null;
}

/** Cambia la frecuencia de muestreo con interpolación lineal (alcanza para voz). */
export function remuestrear(muestras: Float32Array, desde: number, hasta: number): Float32Array {
  if (desde === hasta) return muestras;
  const largo = Math.max(1, Math.round((muestras.length * hasta) / desde));
  const salida = new Float32Array(largo);
  const paso = desde / hasta;
  for (let i = 0; i < largo; i++) {
    const x = i * paso;
    const a = Math.floor(x);
    const b = Math.min(muestras.length - 1, a + 1);
    const t = x - a;
    salida[i] = (muestras[a] ?? 0) * (1 - t) + (muestras[b] ?? 0) * t;
  }
  return salida;
}

/** Arma un WAV PCM de 16 bits mono. */
export function escribirWav(muestras: Float32Array, frecuencia: number): Uint8Array {
  const datos = muestras.length * 2;
  const bytes = new Uint8Array(44 + datos);
  const v = new DataView(bytes.buffer);
  const texto = (o: number, s: string) => [...s].forEach((c, i) => (bytes[o + i] = c.charCodeAt(0)));
  texto(0, "RIFF");
  v.setUint32(4, 36 + datos, true);
  texto(8, "WAVE");
  texto(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, frecuencia, true);
  v.setUint32(28, frecuencia * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  texto(36, "data");
  v.setUint32(40, datos, true);
  for (let i = 0; i < muestras.length; i++) {
    const s = Math.max(-1, Math.min(1, muestras[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 32768 : s * 32767, true);
  }
  return bytes;
}

/**
 * Corta el audio en tramos de hasta `maxSeg` segundos (Whisper escucha de a 30 s).
 * Busca cortar en el momento más silencioso de los últimos `margenSeg` segundos de cada tramo
 * para no partir una palabra al medio.
 */
export function cortarEnTramos(muestras: Float32Array, frecuencia: number, maxSeg = 25, margenSeg = 4): Float32Array[] {
  const max = Math.floor(maxSeg * frecuencia);
  if (muestras.length <= max) return [muestras];
  const ventana = Math.floor(0.1 * frecuencia);
  const tramos: Float32Array[] = [];
  let inicio = 0;
  while (muestras.length - inicio > max) {
    const desde = inicio + max - Math.floor(margenSeg * frecuencia);
    let corte = inicio + max;
    let menor = Infinity;
    for (let p = desde; p + ventana <= inicio + max; p += Math.floor(ventana / 2)) {
      let energia = 0;
      for (let i = p; i < p + ventana; i++) energia += muestras[i] * muestras[i];
      if (energia < menor) {
        menor = energia;
        corte = p + Math.floor(ventana / 2);
      }
    }
    tramos.push(muestras.subarray(inicio, corte));
    inicio = corte;
  }
  tramos.push(muestras.subarray(inicio));
  return tramos;
}
