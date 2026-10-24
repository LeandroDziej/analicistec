"use client";

import { EJEMPLOS } from "@/lib/ejemplos";

export default function EjemplosRapidos({ onElegir }: { onElegir: (texto: string) => void }) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <span id="ejemplos-titulo" className="text-sm text-ink-soft">
        ¿Querés ver cómo funciona? Probá con un ejemplo:
      </span>
      <div role="group" aria-labelledby="ejemplos-titulo" className="flex flex-wrap gap-2">
        {EJEMPLOS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => onElegir(e.texto)}
            aria-label={`Cargar ejemplo: ${e.etiqueta}`}
            className="min-h-11 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-bold text-brand-800 transition-colors hover:border-brand-600 hover:bg-brand-100"
          >
            {e.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}