import type { Veredicto } from "@/lib/gemini";

export const CLAVE_HISTORIAL = "antiestafa:historial";
export const MAX_HISTORIAL = 10;

export interface EntradaHistorial {
  fecha: string;
  veredicto: Veredicto;
  score: number;
  mensaje: string;
  resumen: string;
}

export type Almacen = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const VEREDICTOS: Veredicto[] = ["estafa", "sospechoso", "seguro"];

function esEntrada(x: unknown): x is EntradaHistorial {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.fecha === "string" &&
    typeof e.mensaje === "string" &&
    typeof e.resumen === "string" &&
    typeof e.score === "number" &&
    VEREDICTOS.includes(e.veredicto as Veredicto)
  );
}

/** Devuelve el almacenamiento del navegador, o null si no está disponible (modo privado, SSR, etc.). */
export function almacenLocal(): Almacen | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function leerHistorial(almacen: Almacen | null = almacenLocal()): EntradaHistorial[] {
  if (!almacen) return [];
  try {
    const crudo = almacen.getItem(CLAVE_HISTORIAL);
    if (!crudo) return [];
    const datos: unknown = JSON.parse(crudo);
    return Array.isArray(datos) ? datos.filter(esEntrada).slice(0, MAX_HISTORIAL) : [];
  } catch {
    return [];
  }
}

/** Agrega un análisis al principio y se queda con los últimos 10. Nunca tira error. */
export function guardarEnHistorial(
  entrada: { veredicto: Veredicto; score: number; mensaje: string; resumen: string },
  almacen: Almacen | null = almacenLocal(),
  ahora: Date = new Date(),
): EntradaHistorial[] {
  const nueva: EntradaHistorial = {
    fecha: ahora.toISOString(),
    veredicto: entrada.veredicto,
    score: entrada.score,
    mensaje: entrada.mensaje.slice(0, 200),
    resumen: entrada.resumen.slice(0, 300),
  };
  const lista = [nueva, ...leerHistorial(almacen)].slice(0, MAX_HISTORIAL);
  try {
    almacen?.setItem(CLAVE_HISTORIAL, JSON.stringify(lista));
  } catch {
    // Almacenamiento lleno o bloqueado: seguimos sin historial.
  }
  return lista;
}

export function borrarHistorial(almacen: Almacen | null = almacenLocal()): void {
  try {
    almacen?.removeItem(CLAVE_HISTORIAL);
  } catch {
    // Nada que borrar si no hay almacenamiento.
  }
}
