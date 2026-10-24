"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Icono, type NombreIcono } from "./Iconos";

export interface Pestana {
  id: string;
  etiqueta: string;
  icono: NombreIcono;
  contenido: ReactNode;
}

export default function Pestanas({ pestanas, etiquetaAria, encabezado }: { pestanas: Pestana[]; etiquetaAria: string; encabezado?: ReactNode }) {
  const base = useId();
  const [activa, setActiva] = useState(0);
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  function irA(indice: number) {
    const n = (indice + pestanas.length) % pestanas.length;
    setActiva(n);
    botones.current[n]?.focus();
  }

  function alTeclear(e: React.KeyboardEvent, indice: number) {
    const destino = { ArrowRight: indice + 1, ArrowLeft: indice - 1, Home: 0, End: pestanas.length - 1 }[e.key];
    if (destino === undefined) return;
    e.preventDefault();
    irA(destino);
  }

  return (
    <div className="card overflow-hidden" style={{ boxShadow: "0 1px 2px rgb(18 48 58 / 0.05), 0 12px 32px -12px rgb(18 48 58 / 0.18)" }}>
      {encabezado}
      <div role="tablist" aria-label={etiquetaAria} className={`flex overflow-x-auto border-b border-line bg-brand-50 ${encabezado ? "mt-4 border-t" : ""}`}>
        {pestanas.map((p, i) => {
          const seleccionada = i === activa;
          return (
            <button
              key={p.id}
              ref={(el) => {
                botones.current[i] = el;
              }}
              id={`${base}-tab-${p.id}`}
              role="tab"
              type="button"
              aria-selected={seleccionada}
              aria-controls={`${base}-panel-${p.id}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => setActiva(i)}
              onKeyDown={(e) => alTeclear(e, i)}
              className={`flex min-h-16 min-w-[6.5rem] flex-1 shrink-0 flex-col items-center justify-center gap-1 px-3 py-2 text-sm font-bold transition-colors ${
                seleccionada
                  ? "border-b-4 border-brand-700 bg-white text-brand-800"
                  : "border-b-4 border-transparent text-ink-soft hover:bg-brand-100 hover:text-brand-800"
              }`}
            >
              <Icono nombre={p.icono} className="h-5 w-5" />
              {p.etiqueta}
            </button>
          );
        })}
      </div>

      <div className="p-5 sm:p-7">
        {/* Todos los paneles quedan montados para no perder lo que ya escribiste o analizaste al cambiar de pestaña. */}
        {pestanas.map((p, i) => (
          <div key={p.id} id={`${base}-panel-${p.id}`} role="tabpanel" aria-labelledby={`${base}-tab-${p.id}`} hidden={i !== activa}>
            {p.contenido}
          </div>
        ))}
      </div>
    </div>
  );
}