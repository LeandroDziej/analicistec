export interface Punto {
  x: number;
  y: number;
}

export const ANCHO_PANDA = 96;
export const ALTO_PANDA = 112;
export const MARGEN_PANDA = 12;
export const CLAVE_POSICION_PANDA = "antiestafa:pandi:posicion";
/** Cuánto hay que mover el dedo o el mouse para que cuente como arrastre y no como toque. */
export const UMBRAL_ARRASTRE = 6;

/** Mantiene a Pandi siempre dentro de la pantalla. */
export function limitarPosicion(p: Punto, anchoVentana: number, altoVentana: number): Punto {
  const maxX = Math.max(MARGEN_PANDA, anchoVentana - ANCHO_PANDA - MARGEN_PANDA);
  const maxY = Math.max(MARGEN_PANDA, altoVentana - ALTO_PANDA - MARGEN_PANDA);
  return {
    x: Math.round(Math.min(Math.max(p.x, MARGEN_PANDA), maxX)),
    y: Math.round(Math.min(Math.max(p.y, MARGEN_PANDA), maxY)),
  };
}

/** Lugar inicial: abajo a la derecha. */
export function posicionInicial(anchoVentana: number, altoVentana: number): Punto {
  return limitarPosicion({ x: anchoVentana, y: altoVentana }, anchoVentana, altoVentana);
}

/** Lee la posición guardada; si falta o está rota, devuelve null. */
export function leerPosicionGuardada(crudo: string | null | undefined): Punto | null {
  if (!crudo) return null;
  try {
    const p = JSON.parse(crudo) as Partial<Punto>;
    return typeof p.x === "number" && typeof p.y === "number" && Number.isFinite(p.x) && Number.isFinite(p.y)
      ? { x: p.x, y: p.y }
      : null;
  } catch {
    return null;
  }
}

export function esArrastre(desde: Punto, hasta: Punto): boolean {
  return Math.hypot(hasta.x - desde.x, hasta.y - desde.y) > UMBRAL_ARRASTRE;
}
