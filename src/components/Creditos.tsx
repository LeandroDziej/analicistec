import { listaAutores } from "@/lib/creditos";

/** Línea de créditos para el pie de página. */
export default function Creditos() {
  return (
    <p className="text-xs text-ink-mute">
      Hecho por <span className="font-semibold text-ink-soft">{listaAutores()}</span>
    </p>
  );
}
