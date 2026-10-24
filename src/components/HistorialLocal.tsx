"use client";

import { useState } from "react";
import { borrarHistorial, leerHistorial, type EntradaHistorial } from "@/lib/historial";
import { infoSemaforo } from "@/lib/ui";

const ETIQUETAS = { rojo: "🔴", amarillo: "🟡", verde: "🟢" } as const;

/** Historial de los últimos análisis: vive solo en este dispositivo (localStorage), nunca se envía al servidor. */
export default function HistorialLocal() {
  const [abierto, setAbierto] = useState(false);
  const [lista, setLista] = useState<EntradaHistorial[]>([]);

  function alternar() {
    if (!abierto) setLista(leerHistorial());
    setAbierto(!abierto);
  }

  function borrar() {
    borrarHistorial();
    setLista([]);
  }

  return (
    <section aria-label="Historial de análisis" className="flex flex-col gap-3">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierto}
        className="h-12 rounded-xl border border-zinc-300 bg-white font-semibold text-zinc-800 hover:bg-zinc-50"
      >
        {abierto ? "Ocultar historial" : "🕘 Ver mis últimos análisis"}
      </button>
      {abierto && (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
          {lista.length === 0 ? (
            <p className="text-zinc-700">Todavía no hay análisis guardados en este dispositivo.</p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {lista.map((e) => {
                  const info = infoSemaforo(e.veredicto);
                  return (
                    <li key={e.fecha} className="rounded-lg bg-zinc-50 p-3 text-sm">
                      <div className="font-bold text-zinc-900">
                        <span aria-hidden>{ETIQUETAS[info.luz]}</span> {info.titulo} · {e.score}/100
                      </div>
                      <div className="text-xs text-zinc-600">{new Date(e.fecha).toLocaleString("es-AR")}</div>
                      {e.mensaje && <p className="mt-1 break-words text-zinc-700">“{e.mensaje}”</p>}
                      <p className="mt-1 text-zinc-800">{e.resumen}</p>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={borrar}
                className="h-12 rounded-xl border border-red-300 bg-white font-semibold text-red-700 hover:bg-red-50"
              >
                Borrar historial
              </button>
            </>
          )}
          <p className="text-xs text-zinc-600">Se guarda solo en tu dispositivo. No se envía a ningún servidor.</p>
        </div>
      )}
    </section>
  );
}
