import type { Veredicto } from "./gemini.ts";

export const MAX_IMAGEN_UI = 4 * 1024 * 1024;
const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];

export interface InfoSemaforo {
  luz: "verde" | "amarillo" | "rojo";
  titulo: string;
  bajada: string;
}

export function infoSemaforo(veredicto: Veredicto): InfoSemaforo {
  switch (veredicto) {
    case "estafa":
      return { luz: "rojo", titulo: "Es estafa", bajada: "No respondas, no toques links y no pases datos." };
    case "sospechoso":
      return { luz: "amarillo", titulo: "Sospechoso", bajada: "Hay señales raras. Verificá por otro canal antes de hacer nada." };
    default:
      return { luz: "verde", titulo: "Parece seguro", bajada: "No vimos señales de estafa, pero igual mantené el ojo." };
  }
}

/** Valida en el navegador antes de subir (el servidor vuelve a validar). Devuelve un mensaje de error o null. */
export function validarImagenCliente(archivo: { size: number; type: string }): string | null {
  if (archivo.size === 0) return "La imagen está vacía.";
  if (archivo.size > MAX_IMAGEN_UI) return "La imagen pesa más de 4 MB. Probá con una captura más liviana.";
  if (archivo.type && !TIPOS_IMAGEN.includes(archivo.type)) return "Solo aceptamos imágenes JPG, PNG, WEBP, GIF o HEIC.";
  return null;
}

/** Mensaje amable a partir de la respuesta HTTP de /api/analyze. */
export function mensajeError(status: number, cuerpo: unknown): string {
  const msg = cuerpo && typeof cuerpo === "object" && "error" in cuerpo ? (cuerpo as { error: unknown }).error : null;
  if (typeof msg === "string" && msg.trim()) return msg;
  if (status === 429) return "Hay mucha gente usando el detector. Esperá un minuto y probá de nuevo.";
  if (status === 413) return "El contenido es muy pesado. Probá con algo más liviano.";
  return "Algo salió mal. Probá de nuevo en un rato.";
}
