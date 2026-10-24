export interface Punto {
  x: number;
  y: number;
}

export const ANCHO_PANDA = 96;
export const ALTO_PANDA = 112;
export const MARGEN_PANDA = 12;
/** Cuánto espera quieto después de que lo soltás antes de volver a su lugar. */
export const ESPERA_VOLVER_MS = 900;
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

export function esArrastre(desde: Punto, hasta: Punto): boolean {
  return Math.hypot(hasta.x - desde.x, hasta.y - desde.y) > UMBRAL_ARRASTRE;
}
