import { formatoFechaHora, type DatosDenuncia } from "./denuncia.ts";

export const NUMERO_POLICIA = "911";
export const TEL_POLICIA = `tel:${NUMERO_POLICIA}`;

function dominioDe(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}

function recortar(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}

/**
 * Lo que la persona puede leer en voz alta cuando la atienden en el 911.
 * Corto y en primera persona: una llamada no transmite el texto, así que se lo damos listo para decir.
 */
export function guionLlamada(datos?: DatosDenuncia, fecha?: Date): string[] {
  if (!datos) {
    return [
      "Hola, quiero denunciar una estafa virtual.",
      "Me pasó el día … a las … (decí cuándo fue).",
      "Me contactaron por … (WhatsApp, SMS, llamada, redes) haciéndose pasar por … .",
      "Lo que pasó: … (por ejemplo: transferí plata, di un código, pasé datos de la tarjeta).",
      "Tengo capturas y los datos de la cuenta o el número que usaron.",
    ];
  }
  const lineas = ["Hola, quiero denunciar un intento de estafa virtual."];
  lineas.push(`Hoy, ${formatoFechaHora(fecha ?? new Date())}, revisé un mensaje que me llegó.`);
  if (datos.mensaje?.trim()) lineas.push(`Decía: «${recortar(datos.mensaje, 160)}».`);
  const dominios = [...new Set(datos.links.map((l) => dominioDe(l.url)).filter(Boolean))].slice(0, 2);
  if (dominios.length) lineas.push(`Tenía ${dominios.length > 1 ? "estos links" : "este link"}: ${dominios.join(" y ")}.`);
  const banderas = datos.banderas.filter((b) => b.trim()).slice(0, 2);
  if (banderas.length) lineas.push(`Lo que me hizo sospechar: ${banderas.map((b) => recortar(b, 80).replace(/\.$/, "")).join("; ")}.`);
  lineas.push("Tengo la denuncia completa por escrito, con capturas, para enviarla o llevarla a la comisaría.");
  return lineas;
}
