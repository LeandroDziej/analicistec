import type { EntradaAnalisis } from "./gemini.ts";

export const MAX_TEXTO = 5000;
export const MAX_IMAGEN_BYTES = 4 * 1024 * 1024;

export class EntradaError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "EntradaError";
    this.status = status;
  }
}

/** Detecta el tipo real de imagen por sus primeros bytes (no confiamos en el mimeType del cliente). */
export function detectarMimeImagen(bytes: Uint8Array): string | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 12 && String.fromCharCode(...b.subarray(0, 4)) === "RIFF" && String.fromCharCode(...b.subarray(8, 12)) === "WEBP")
    return "image/webp";
  if (b.length >= 6 && String.fromCharCode(...b.subarray(0, 4)) === "GIF8") return "image/gif";
  if (b.length >= 12 && String.fromCharCode(...b.subarray(4, 8)) === "ftyp") {
    const marca = String.fromCharCode(...b.subarray(8, 12));
    if (/^(heic|heix|hevc|hevx|mif1|msf1)$/.test(marca)) return "image/heic";
  }
  return null;
}

function validarImagen(bytes: Uint8Array): { mimeType: string; base64: string } {
  if (bytes.length === 0) throw new EntradaError("La imagen está vacía.");
  if (bytes.length > MAX_IMAGEN_BYTES) throw new EntradaError("La imagen pesa más de 4 MB. Probá con una captura más liviana.", 413);
  const mimeType = detectarMimeImagen(bytes);
  if (!mimeType) throw new EntradaError("Solo aceptamos imágenes JPG, PNG, WEBP, GIF o HEIC.", 415);
  return { mimeType, base64: Buffer.from(bytes).toString("base64") };
}

function validarTexto(raw: unknown): string {
  const texto = typeof raw === "string" ? raw.trim() : "";
  if (texto.length > MAX_TEXTO) throw new EntradaError(`El mensaje es muy largo (máximo ${MAX_TEXTO} caracteres).`, 413);
  return texto;
}

/** Decodifica base64 (acepta data URL) a bytes, cortando antes si excede el límite. */
function decodificarBase64(raw: string): Uint8Array {
  const limpio = raw.replace(/^data:[^;,]*;base64,/, "").replace(/\s/g, "");
  if (limpio.length > Math.ceil((MAX_IMAGEN_BYTES * 4) / 3) + 4) {
    throw new EntradaError("La imagen pesa más de 4 MB. Probá con una captura más liviana.", 413);
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(limpio)) throw new EntradaError("La imagen no es válida.");
  return new Uint8Array(Buffer.from(limpio, "base64"));
}

/**
 * Lee el body de /api/analyze. Acepta:
 * - multipart/form-data con campos "texto" y/o "imagen" (archivo)
 * - JSON { texto?: string, imagen?: string (base64 o data URL) }
 */
export async function leerEntrada(request: Request): Promise<EntradaAnalisis> {
  const tipo = request.headers.get("content-type") ?? "";
  const largo = Number(request.headers.get("content-length") ?? 0);
  if (largo > MAX_IMAGEN_BYTES * 1.4 + 64 * 1024) {
    throw new EntradaError("La imagen pesa más de 4 MB. Probá con una captura más liviana.", 413);
  }

  let texto = "";
  let imagen: EntradaAnalisis["imagen"];

  if (tipo.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new EntradaError("No pudimos leer lo que mandaste. Probá de nuevo.");
    }
    texto = validarTexto(form.get("texto"));
    const archivo = form.get("imagen");
    if (archivo && typeof archivo !== "string" && archivo.size > 0) {
      if (archivo.size > MAX_IMAGEN_BYTES) throw new EntradaError("La imagen pesa más de 4 MB. Probá con una captura más liviana.", 413);
      imagen = validarImagen(new Uint8Array(await archivo.arrayBuffer()));
    }
  } else {
    let body: { texto?: unknown; imagen?: unknown };
    try {
      body = await request.json();
    } catch {
      throw new EntradaError("Mandanos el mensaje en formato JSON.");
    }
    texto = validarTexto(body?.texto);
    if (typeof body?.imagen === "string" && body.imagen.trim()) {
      imagen = validarImagen(decodificarBase64(body.imagen));
    }
  }

  if (!texto && !imagen) throw new EntradaError("Pegá el mensaje o subí una captura para revisar.");
  return { ...(texto ? { texto } : {}), ...(imagen ? { imagen } : {}) };
}
