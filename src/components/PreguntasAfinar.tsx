"use client";

import { PREGUNTAS, type ClavePregunta, type ContextoUsuario } from "@/lib/preguntas";

export default function PreguntasAfinar({
  valor,
  onCambio,
}: {
  valor: ContextoUsuario;
  onCambio: (v: ContextoUsuario) => void;
}) {
  function elegir(clave: ClavePregunta, respuesta: boolean) {
    const nuevo = { ...valor };
    // Tocar la opción ya elegida la deja sin responder.
    if (nuevo[clave] === respuesta) delete nuevo[clave];
    else nuevo[clave] = respuesta;
    onCambio(nuevo);
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3">
      <legend className="px-1 text-sm font-semibold text-zinc-700">Para afinar el análisis (opcional)</legend>
      {PREGUNTAS.map(({ clave, texto }) => (
        <div key={clave} role="group" aria-label={texto} className="flex items-center justify-between gap-3">
          <span className="flex-1 text-sm text-zinc-800">{texto}</span>
          {([true, false] as const).map((r) => (
            <button
              key={String(r)}
              type="button"
              aria-pressed={valor[clave] === r}
              aria-label={`${texto} ${r ? "Sí" : "No"}`}
              onClick={() => elegir(clave, r)}
              className={`h-11 min-w-14 rounded-lg border px-3 text-sm font-semibold ${
                valor[clave] === r
                  ? "border-sky-700 bg-sky-700 text-white"
                  : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
              }`}
            >
              {r ? "Sí" : "No"}
            </button>
          ))}
        </div>
      ))}
    </fieldset>
  );
}
