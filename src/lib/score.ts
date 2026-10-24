import type { AnalisisLLM, Veredicto } from "./gemini";
import type { ResultadoLink } from "./links";

export interface AnalisisFinal extends AnalisisLLM {
  detalle: {
    score_llm: number;
    veredicto_llm: Veredicto;
    score_tecnico: number;
  };
  links: ResultadoLink[];
}

const UMBRAL_SOSPECHOSO = 35;
const UMBRAL_ESTAFA = 70;
const ORDEN: Record<Veredicto, number> = { seguro: 0, sospechoso: 1, estafa: 2 };

export function veredictoDeScore(score: number): Veredicto {
  if (score >= UMBRAL_ESTAFA) return "estafa";
  if (score >= UMBRAL_SOSPECHOSO) return "sospechoso";
  return "seguro";
}

/** Puntaje técnico (0-100) de un link según sus señales. */
export function scoreLink(l: ResultadoLink): number {
  let pts = 0;
  if (l.bloqueado) pts += 30;
  if (l.marcaImitada) pts += l.marcaImitada.distancia === 0 ? 45 : 40;
  if (l.antiguedadDias !== null) {
    if (l.antiguedadDias < 30) pts += 35;
    else if (l.antiguedadDias < 90) pts += 25;
  }
  if (l.ssl === false) pts += 15;
  if (l.senales.some((s) => s.includes("IP en vez de un dominio"))) pts += 25;
  if (l.redirecciones.length >= 2) pts += 10;
  if (!l.bloqueado && l.error === "El dominio no existe o no responde") pts += 10;
  return Math.min(100, pts);
}

/** Piso mínimo que imponen combinaciones de señales muy fuertes. */
function pisoTecnico(links: ResultadoLink[]): number {
  let piso = 0;
  for (const l of links) {
    const nuevo = l.antiguedadDias !== null && l.antiguedadDias < 90;
    if (l.marcaImitada && nuevo) piso = Math.max(piso, 85);
    else if (l.marcaImitada) piso = Math.max(piso, 70);
    else if (nuevo && l.ssl === false) piso = Math.max(piso, 50);
    if (l.bloqueado) piso = Math.max(piso, 50);
  }
  return piso;
}

/**
 * Combina el análisis del LLM con las señales técnicas de los links.
 * Las señales técnicas solo pueden subir el riesgo, nunca bajarlo
 * (un mensaje de estafa puede incluir links oficiales para dar confianza).
 */
export function combinarScore(llm: AnalisisLLM, links: ResultadoLink[]): AnalisisFinal {
  const scoreTecnico = links.reduce((max, l) => Math.max(max, scoreLink(l)), 0);
  // Combinación tipo "probabilidad": la técnica cubre parte del margen que dejó el LLM.
  let score = Math.round(llm.score + ((100 - llm.score) * scoreTecnico) / 100);
  score = Math.max(score, pisoTecnico(links));

  let veredicto = veredictoDeScore(score);
  if (ORDEN[llm.veredicto] > ORDEN[veredicto]) veredicto = llm.veredicto;
  // Mantener el puntaje coherente con el veredicto final.
  if (veredicto === "estafa") score = Math.max(score, UMBRAL_ESTAFA);
  else if (veredicto === "sospechoso") score = Math.max(score, UMBRAL_SOSPECHOSO);
  score = Math.min(100, Math.max(0, score));

  const banderas: string[] = [];
  const agregar = (b: string) => {
    if (!banderas.some((x) => x.toLowerCase() === b.toLowerCase())) banderas.push(b);
  };
  for (const l of links) for (const s of l.senales) agregar(`${s} (${l.dominio})`);
  for (const b of llm.banderas) agregar(b);

  const queHacer = [...llm.que_hacer];
  if (scoreTecnico > 0 && !queHacer.some((q) => /link|enlace/i.test(q))) {
    queHacer.unshift("No abras el link ni cargues datos ahí.");
  }

  return {
    veredicto,
    score,
    banderas,
    que_hacer: queHacer,
    resumen_abuela: llm.resumen_abuela,
    detalle: { score_llm: llm.score, veredicto_llm: llm.veredicto, score_tecnico: scoreTecnico },
    links,
  };
}
