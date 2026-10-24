import type { Veredicto } from "./gemini.ts";

export type TipoHistorial = "mensaje" | "link" | "qr";

export interface EntradaHistorial {
  id: string;
  fecha: number;
  tipo: TipoHistorial;
  veredicto: Veredicto;
  score: number;
  extracto: string;
}

export interface EntradaNueva {
  tipo: TipoHistorial;
  veredicto: Veredicto;
  score: number;
  texto: string;
}

export const CLAVE_HISTORIAL = "antiestafa:historial:v1";
export const CLAVE_ACTIVO = "antiestafa:historial:activo";
export const MAX_HISTORIAL = 10;

const TIPOS: TipoHistorial[] = ["mensaje", "link", "qr"];
const VEREDICTOS: Veredicto[] = ["seguro", "sospechoso", "estafa"];

/** Junta espacios y recorta: lo único que se guarda del mensaje original. */
export function extractoDe(texto: string, max = 80): string {
  const limpio = texto.replace(/\s+/g, " ").trim();
  return limpio.length > max ? `${limpio.slice(0, max - 1).trimEnd()}…` : limpio;
}

/** Lee lo guardado con tolerancia: si algo está roto o fue editado a mano, lo descarta. */
export function parsearHistorial(crudo: string | null | undefined): EntradaHistorial[] {
  if (!crudo) return [];
  try {
    const datos: unknown = JSON.parse(crudo);
    if (!Array.isArray(datos)) return [];
    return datos
      .filter(
        (e): e is EntradaHistorial =>
          !!e &&
          typeof e.id === "string" &&
          typeof e.fecha === "number" &&
          TIPOS.includes(e.tipo) &&
          VEREDICTOS.includes(e.veredicto) &&
          typeof e.score === "number" &&
          typeof e.extracto === "string",
      )
      .slice(0, MAX_HISTORIAL);
  } catch {
    return [];
  }
}

export function crearEntrada(n: EntradaNueva, ahora = Date.now(), azar = Math.random): EntradaHistorial {
  return {
    id: `${ahora}-${Math.floor(azar() * 1_000_000)}`,
    fecha: ahora,
    tipo: n.tipo,
    veredicto: n.veredicto,
    score: Math.max(0, Math.min(100, Math.round(n.score))),
    extracto: extractoDe(n.texto),
  };
}

/** La más nueva primero, y nunca más de MAX_HISTORIAL. */
export function agregarEntrada(lista: EntradaHistorial[], nueva: EntradaHistorial): EntradaHistorial[] {
  return [nueva, ...lista.filter((e) => e.id !== nueva.id)].slice(0, MAX_HISTORIAL);
}

export function formatoFecha(ms: number, ahora = Date.now()): string {
  const d = new Date(ms);
  const n = new Date(ahora);
  const hora = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (d.toDateString() === n.toDateString()) return `Hoy, ${hora}`;
  const ayer = new Date(n);
  ayer.setDate(n.getDate() - 1);
  if (d.toDateString() === ayer.toDateString()) return `Ayer, ${hora}`;
  return `${d.getDate()}/${d.getMonth() + 1}, ${hora}`;
}