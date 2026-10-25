export const AUTORES = ["Manuel A.", "María Sofía Genta"] as const;

/** "Manuel A. y María Sofía Genta" */
export function listaAutores(autores: readonly string[] = AUTORES): string {
  if (autores.length <= 1) return autores.join("");
  return `${autores.slice(0, -1).join(", ")} y ${autores[autores.length - 1]}`;
}
