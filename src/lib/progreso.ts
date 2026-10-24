export interface PasoProgreso {
  texto: string;
  /** Milisegundos desde el inicio a partir de los cuales se muestra este paso. */
  desdeMs: number;
}

const LINKS: PasoProgreso = { texto: "Revisando links...", desdeMs: 0 };
const MENSAJE: PasoProgreso = { texto: "Analizando el mensaje...", desdeMs: 0 };
const RIESGO: PasoProgreso = { texto: "Calculando el riesgo...", desdeMs: 0 };

/** Pasos que se muestran mientras se analiza. Sin links no hay paso de links. */
export function pasosAnalisis(texto: string): PasoProgreso[] {
  const hayLinks = /https?:\/\/|www\.|\b[a-z0-9-]+\.(com|ar|net|org|info|link|xyz|top|click)\b/i.test(texto);
  const pasos = hayLinks ? [LINKS, MENSAJE, RIESGO] : [MENSAJE, RIESGO];
  const tramos = hayLinks ? [0, 2000, 5000] : [0, 4000];
  return pasos.map((p, i) => ({ ...p, desdeMs: tramos[i] }));
}

/** Índice del paso a mostrar según el tiempo transcurrido (siempre el último alcanzado). */
export function indicePaso(pasos: PasoProgreso[], transcurridoMs: number): number {
  let actual = 0;
  pasos.forEach((p, i) => {
    if (transcurridoMs >= p.desdeMs) actual = i;
  });
  return actual;
}
