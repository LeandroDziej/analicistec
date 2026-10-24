import { CLAVE_ACTIVO, CLAVE_HISTORIAL, agregarEntrada, crearEntrada, parsearHistorial, type EntradaNueva } from "@/lib/historial";

// El historial vive solo en este navegador (localStorage). Nada de esto se manda a ningún servidor.
const EVENTO = "antiestafa:historial";

function almacen(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function avisar() {
  window.dispatchEvent(new Event(EVENTO));
}

export function suscribir(cb: () => void): () => void {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENTO, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENTO, cb);
  };
}

/** Texto crudo guardado: se devuelve tal cual para que React compare por valor. */
export function leerCrudo(): string {
  return almacen()?.getItem(CLAVE_HISTORIAL) ?? "";
}

/** "1" (guardando) o "0" (apagado). */
export function leerActivo(): string {
  return almacen()?.getItem(CLAVE_ACTIVO) === "0" ? "0" : "1";
}

export function guardarEntrada(entrada: EntradaNueva) {
  const a = almacen();
  if (!a || leerActivo() === "0") return;
  try {
    const lista = agregarEntrada(parsearHistorial(a.getItem(CLAVE_HISTORIAL)), crearEntrada(entrada));
    a.setItem(CLAVE_HISTORIAL, JSON.stringify(lista));
    avisar();
  } catch {
    // Almacenamiento lleno o bloqueado: el historial es opcional, seguimos sin él.
  }
}

export function borrarHistorial() {
  try {
    almacen()?.removeItem(CLAVE_HISTORIAL);
  } finally {
    avisar();
  }
}

export function activarHistorial(activo: boolean) {
  try {
    almacen()?.setItem(CLAVE_ACTIVO, activo ? "1" : "0");
    if (!activo) almacen()?.removeItem(CLAVE_HISTORIAL);
  } finally {
    avisar();
  }
}