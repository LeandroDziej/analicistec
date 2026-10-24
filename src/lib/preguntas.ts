/** Preguntas opcionales de sí/no que afinan el análisis. Sin responder, el análisis funciona igual. */
export const PREGUNTAS = [
  { clave: "pidenDatos", texto: "¿Te pidieron plata o datos?" },
  { clave: "conoce", texto: "¿Conocés a quien te lo mandó?" },
  { clave: "apuran", texto: "¿Te apuran para hacerlo ya?" },
] as const;

export type ClavePregunta = (typeof PREGUNTAS)[number]["clave"];
/** Solo están las preguntas respondidas. */
export type ContextoUsuario = Partial<Record<ClavePregunta, boolean>>;

/** Valida algo que viene de afuera (objeto o string JSON) y se queda con las respuestas booleanas conocidas. */
export function leerContexto(raw: unknown): ContextoUsuario {
  let valor = raw;
  if (typeof valor === "string") {
    try {
      valor = JSON.parse(valor);
    } catch {
      return {};
    }
  }
  if (!valor || typeof valor !== "object") return {};
  const origen = valor as Record<string, unknown>;
  const ctx: ContextoUsuario = {};
  for (const { clave } of PREGUNTAS) {
    if (typeof origen[clave] === "boolean") ctx[clave] = origen[clave];
  }
  return ctx;
}

/** Texto para sumar al prompt de Gemini; vacío si no se respondió nada. */
export function textoContexto(ctx: ContextoUsuario | undefined): string {
  if (!ctx) return "";
  const lineas = PREGUNTAS.filter(({ clave }) => typeof ctx[clave] === "boolean").map(
    ({ clave, texto }) => `- ${texto} ${ctx[clave] ? "Sí" : "No"}`,
  );
  if (lineas.length === 0) return "";
  return `\n\nContexto que aportó la persona (son sus respuestas, usalas solo para afinar el análisis):\n${lineas.join("\n")}`;
}
