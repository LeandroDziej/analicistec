"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { Veredicto } from "@/lib/gemini";
import { MAX_HISTORIAL, formatoFecha, parsearHistorial, type TipoHistorial } from "@/lib/historial";
import { activarHistorial, borrarHistorial, leerActivo, leerCrudo, suscribir } from "./historialStore";
import { Icono, type NombreIcono } from "./Iconos";

const ICONO: Record<TipoHistorial, NombreIcono> = { mensaje: "mensaje", link: "link" };
const ETIQUETA: Record<TipoHistorial, string> = { mensaje: "Mensaje", link: "Link" };
const CHIP: Record<Veredicto, { texto: string; clases: string }> = {
  seguro: { texto: "Sin señales", clases: "border-safe-200 bg-safe-50 text-safe-800" },
  sospechoso: { texto: "Sospechoso", clases: "border-warn-200 bg-warn-50 text-warn-800" },
  estafa: { texto: "Estafa", clases: "border-danger-200 bg-danger-50 text-danger-800" },
};

// "Ahora" se toma una sola vez en el navegador (en el servidor vale 0): así el render no depende del reloj.
let instante = 0;
function ahoraEstable() {
  if (!instante) instante = Date.now();
  return instante;
}
const sinSuscripcion = () => () => {};

export default function Historial() {
  const crudo = useSyncExternalStore(suscribir, leerCrudo, () => "");
  const activo = useSyncExternalStore(suscribir, leerActivo, () => "1") === "1";
  const lista = useMemo(() => parsearHistorial(crudo), [crudo]);
  const ahora = useSyncExternalStore(sinSuscripcion, ahoraEstable, () => 0);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <section aria-labelledby="historial-titulo" className="flex flex-col gap-5">
      <div>
        <h3 id="historial-titulo" className="titulo text-3xl text-ink">
          Lo que revisaste
        </h3>
        <p className="mt-1 text-ink-soft">
          Guardamos solo un resumen de tus últimos {MAX_HISTORIAL} análisis, y únicamente en este navegador. No se manda a ningún servidor ni lo ve nadie más.
        </p>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-5 text-center text-ink-soft">
          {activo ? "Todavía no revisaste nada. Cuando analices un mensaje o un link, aparece acá." : "El guardado está apagado, así que no se muestra nada."}
        </p>
      ) : (
        <ul className="card divide-y divide-line">
          {lista.map((e) => (
            <li key={e.id} className="flex items-start gap-3 p-4">
              <Icono nombre={ICONO[e.tipo]} className="mt-0.5 h-5 w-5 text-brand-700" />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 break-words font-medium text-ink">{e.extracto || "Sin texto"}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-ink-soft">
                  <span>{ETIQUETA[e.tipo]}</span>
                  <span>{formatoFecha(e.fecha, ahora)}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className={`rounded-full border px-2.5 py-0.5 text-sm font-bold ${CHIP[e.veredicto].clases}`}>{CHIP[e.veredicto].texto}</span>
                <span className="text-sm text-ink-soft">riesgo {e.score}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <label className="card flex cursor-pointer items-center gap-3 p-4">
        <span className="flex-1">
          <span className="block font-bold text-ink">Guardar mis análisis en este dispositivo</span>
          <span className="block text-sm text-ink-soft">Si lo apagás, se borra lo que hay guardado.</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          checked={activo}
          onChange={(e) => {
            setConfirmando(false);
            activarHistorial(e.target.checked);
          }}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-7 w-12 shrink-0 rounded-full bg-ink-mute transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-6 after:w-6 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand-700 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-600"
        />
      </label>

      {lista.length > 0 && (
        <button
          type="button"
          onClick={() => {
            if (!confirmando) return setConfirmando(true);
            borrarHistorial();
            setConfirmando(false);
          }}
          onBlur={() => setConfirmando(false)}
          className={`btn ${confirmando ? "border-danger-600 bg-danger-600 text-white hover:bg-danger-800" : "btn-secondary"}`}
        >
          <Icono nombre="basura" className="h-5 w-5" />
          {confirmando ? "Tocá de nuevo para borrar todo" : "Borrar historial"}
        </button>
      )}
    </section>
  );
}