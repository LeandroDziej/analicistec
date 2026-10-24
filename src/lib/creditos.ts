export const AUTORES = ["Manuel A.", "María Sofía Genta", "Leandro Dizej"] as const;

/** "Manuel A., María Sofía Genta y Leandro Dizej" */
export function listaAutores(autores: readonly string[] = AUTORES): string {
  if (autores.length <= 1) return autores.join("");
  return `${autores.slice(0, -1).join(", ")} y ${autores[autores.length - 1]}`;
}
