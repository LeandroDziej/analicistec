import type { Veredicto } from "./gemini.ts";

export interface DatosDenuncia {
  veredicto: Veredicto;
  score: number;
  banderas: string[];
  links: { url: string }[];
  /** Mensaje tal cual lo recibió la persona (puede faltar si solo subió una captura). */
  mensaje?: string;
}

const VEREDICTOS: Record<Veredicto, string> = {
  estafa: "Estafa",
  sospechoso: "Sospechoso",
  seguro: "Sin señales claras de estafa",
};

const dos = (n: number) => String(n).padStart(2, "0");

/** Fecha y hora local en formato dd/mm/aaaa hh:mm. */
export function formatoFechaHora(fecha: Date): string {
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}

/** Texto formal de denuncia, listo para copiar, descargar o imprimir. */
export function generarDenuncia(r: DatosDenuncia, fecha: Date = new Date()): string {
  const mensaje = r.mensaje?.trim();
  const links = [...new Set(r.links.map((l) => l.url))];
  const lineas: string[] = [
    "DENUNCIA POR PRESUNTA ESTAFA VIRTUAL",
    "",
    `Fecha y hora: ${formatoFechaHora(fecha)}`,
    "",
    "1. Mensaje recibido",
    mensaje ? mensaje : "(No se cargó el texto; el mensaje se recibió como captura de pantalla, que se adjunta.)",
    "",
    "2. Links incluidos en el mensaje",
    ...(links.length ? links.map((u) => `- ${u}`) : ["- No se detectaron links."]),
    "",
    "3. Señales detectadas",
    ...(r.banderas.length ? r.banderas.map((b) => `- ${b}`) : ["- No se detectaron señales puntuales."]),
    "",
    "4. Resultado del análisis automático",
    `Veredicto: ${VEREDICTOS[r.veredicto]}`,
    `Puntaje de riesgo: ${r.score}/100`,
    "Es un análisis orientativo hecho con AntiEstafa AR; no reemplaza una pericia.",
    "",
    "5. Dónde presentarla",
    "- Fiscalía de cibercrimen de tu provincia (o la fiscalía penal de turno si no hay una específica).",
    "- Comisaría o división de delitos informáticos de tu zona.",
    "- Defensa del Consumidor, si la estafa vino de una compra o un servicio.",
    "- Tu banco o billetera virtual, para frenar o reclamar cualquier movimiento.",
    "",
    "Conservá la captura original, los comprobantes y los datos de la cuenta que te pidieron usar, y llevalos junto con este texto.",
  ];
  return lineas.join("\n");
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** HTML mínimo y seguro (texto escapado) para imprimir o guardar como PDF. */
export function htmlImprimible(texto: string): string {
  const seguro = texto.replace(/[&<>"']/g, (c) => ESCAPES[c]);
  return `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><title>Denuncia</title><style>body{font-family:sans-serif;margin:2rem}pre{white-space:pre-wrap;font:14px/1.5 sans-serif}</style></head><body><pre>${seguro}</pre></body></html>`;
}
