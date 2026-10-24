"use client";

import { useEffect, useState } from "react";
import { indicePaso, pasosAnalisis } from "@/lib/progreso";

export default function ProgresoAnalisis({ texto }: { texto: string }) {
  const [pasos] = useState(() => pasosAnalisis(texto));
  const [transcurrido, setTranscurrido] = useState(0);

  useEffect(() => {
    const inicio = Date.now();
    const id = setInterval(() => setTranscurrido(Date.now() - inicio), 500);
    return () => clearInterval(id);
  }, []);

  const actual = indicePaso(pasos, transcurrido);

  return (
    <ol aria-label="Progreso del análisis" className="flex flex-col gap-2 rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm">
      {pasos.map((p, i) => (
        <li
          key={p.texto}
          aria-current={i === actual ? "step" : undefined}
          className={i === actual ? "font-semibold text-brand-900" : i < actual ? "text-ink-mute" : "text-ink-mute"}
        >
          {i < actual ? "✓ " : i === actual ? "⏳ " : "• "}
          {p.texto}
        </li>
      ))}
      <span role="status" aria-live="polite" className="sr-only">
        {pasos[actual].texto}
      </span>
    </ol>
  );
}
