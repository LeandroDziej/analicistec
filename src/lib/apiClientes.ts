import { timingSafeEqual } from "node:crypto";
import type { AnalisisFinal } from "./score.ts";

/**
 * Clientes de la API para bots (por ejemplo, el bot de WhatsApp de tecnoros).
 * Se configuran en la variable de entorno ANTIESTAFA_API_CLIENTES, uno por coma:
 *   nombre:clave[:tope]
 * "tope" = análisis con IA por mes (opcional). Pasado el tope, sigue andando con el motor propio.
 * Ejemplo: ANTIESTAFA_API_CLIENTES="tecnoros-demo:k_3f9a…:500,seguridad-sur:k_77b1…"
 */
export interface ClienteApi {
  nombre: string;
  clave: string;
  tope: number | null;
}

export function leerClientes(raw: string | undefined): ClienteApi[] {
  return (raw ?? "")
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const [nombre, clave, tope] = parte.split(":").map((x) => x.trim());
      const n = Number(tope);
      return { nombre, clave, tope: tope && Number.isInteger(n) && n > 0 ? n : null };
    })
    // Claves cortas son fáciles de adivinar: las ignoramos.
    .filter((c) => c.nombre && c.clave && c.clave.length >= 16);
}

function iguales(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Acepta "Authorization: Bearer <clave>" o "x-api-key: <clave>". */
export function claveDe(headers: Headers): string {
  const auth = headers.get("authorization") ?? "";
  const bearer = /^Bearer\s+(.+)$/i.exec(auth)?.[1];
  return (bearer ?? headers.get("x-api-key") ?? "").trim();
}

export function autenticar(headers: Headers, clientes: ClienteApi[]): ClienteApi | null {
  const clave = claveDe(headers);
  if (!clave) return null;
  return clientes.find((c) => iguales(c.clave, clave)) ?? null;
}

const SEMAFORO = { estafa: "🔴 *Es una estafa*", sospechoso: "🟡 *Es sospechoso*", seguro: "🟢 *No parece estafa*" } as const;

/**
 * Respuesta lista para mandar por WhatsApp: corta, con el veredicto primero y los pasos a seguir.
 * Usa el formato de WhatsApp (*negrita*).
 */
export function textoParaWhatsApp(r: Pick<AnalisisFinal, "veredicto" | "score" | "resumen_abuela" | "que_hacer">, urlApp?: string): string {
  const lineas = [`${SEMAFORO[r.veredicto]} (riesgo ${r.score}/100)`, "", r.resumen_abuela.replace(/\n+/g, " ").trim()];
  if (r.que_hacer.length) {
    lineas.push("", "*Qué hacer:*");
    for (const q of r.que_hacer.slice(0, 3)) lineas.push(`• ${q}`);
  }
  if (r.veredicto !== "seguro") lineas.push("", "Si ya pagaste o pasaste datos, llamá a tu banco y al 911.");
  if (urlApp) lineas.push("", `Más ayuda: ${urlApp}`);
  return lineas.join("\n");
}
