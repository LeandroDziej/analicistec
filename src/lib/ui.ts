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

export interface DatosAlerta {
  veredicto: Veredicto;
  score: number;
  banderas: string[];
  que_hacer: string[];
  resumen_abuela: string;
  links: { dominio: string }[];
}

/** Desactiva un dominio para que WhatsApp no lo convierta en link clickeable (ej: mercad0pago[.]com). */
export function desactivarDominio(dominio: string): string {
  return dominio.replace(/\./g, "[.]");
}

/** Texto listo para copiar y mandar por WhatsApp al grupo de la familia. */
export function generarAlerta(r: DatosAlerta): string {
  const encabezado = {
    estafa: "🚨 ALERTA DE ESTAFA 🚨",
    sospechoso: "⚠️ OJO: MENSAJE SOSPECHOSO ⚠️",
    seguro: "✅ Revisé este mensaje y parece seguro",
  }[r.veredicto];
  const lineas: string[] = [encabezado, "", r.resumen_abuela.trim(), "", `Riesgo: ${r.score}/100`];

  const banderas = r.banderas.slice(0, 4);
  if (banderas.length) lineas.push("", "Señales:", ...banderas.map((b) => `• ${b}`));

  const dominios = [...new Set(r.links.map((l) => l.dominio))].slice(0, 3);
  if (dominios.length && r.veredicto !== "seguro") {
    lineas.push("", "No entres a:", ...dominios.map((d) => `• ${desactivarDominio(d)}`));
  }

  const acciones = r.que_hacer.slice(0, 3);
  if (acciones.length) lineas.push("", "Qué hacer:", ...acciones.map((q, i) => `${i + 1}. ${q}`));

  if (r.veredicto !== "seguro") {
    lineas.push("", "Si te llega algo parecido, no respondas, no toques links y no pases datos ni códigos.");
  }
  lineas.push("", "Chequeado con AntiEstafa AR");
  return lineas.join("\n");
}
