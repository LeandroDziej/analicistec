export interface VozInfo {
  lang: string;
  name: string;
}

/** Elige la mejor voz en español: es-AR, luego es-419/es-US/es-MX, luego cualquier es-*. */
export function elegirVoz<T extends VozInfo>(voces: T[]): T | null {
  const norm = (l: string) => l.replace("_", "-").toLowerCase();
  const es = voces.filter((v) => norm(v.lang).startsWith("es"));
  if (es.length === 0) return null;
  return (
    es.find((v) => norm(v.lang) === "es-ar") ??
    es.find((v) => ["es-419", "es-us", "es-mx"].includes(norm(v.lang))) ??
    es[0]
  );
}

/** Junta las frases a leer, sin vacíos. */
export function textoParaLeer(partes: Array<string | undefined>): string {
  return partes
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\.\s*\./g, ".");
}
