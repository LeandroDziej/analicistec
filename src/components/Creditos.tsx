import { listaAutores } from "@/lib/creditos";

/** Línea de créditos para el pie de página. */
export default function Creditos() {
  return (
    <p className="text-xs text-zinc-500">
      Hecho por <span className="font-semibold text-zinc-700">{listaAutores()}</span>
    </p>
  );
}
