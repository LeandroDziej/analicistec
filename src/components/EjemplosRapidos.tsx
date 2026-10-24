"use client";

import { EJEMPLOS } from "@/lib/ejemplos";

export default function EjemplosRapidos({ onElegir }: { onElegir: (texto: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <span id="ejemplos-titulo" className="text-sm font-semibold text-zinc-700">
        Probá con un ejemplo
      </span>
      <div role="group" aria-labelledby="ejemplos-titulo" className="flex flex-wrap gap-2">
        {EJEMPLOS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onElegir(e.texto)}
            aria-label={`Cargar ejemplo: ${e.etiqueta}`}
            className="min-h-11 rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {e.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}
