"use client";

import { useEffect, useRef, useState } from "react";
import { CASOS_YA_CAI, PASOS_COMUNES, textoGuia } from "@/lib/yaCai";
import { urlWhatsApp } from "@/lib/ui";
import { Icono } from "./Iconos";

export default function YaCai() {
  const [elegido, setElegido] = useState<string | null>(null);
  const [hechos, setHechos] = useState<Set<string>>(new Set());
  const [copiado, setCopiado] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const caso = CASOS_YA_CAI.find((c) => c.id === elegido) ?? null;

  useEffect(() => {
    if (elegido) titulo.current?.focus();
  }, [elegido]);

  function alternar(clave: string) {
    setHechos((previos) => {
      const nuevos = new Set(previos);
      if (nuevos.has(clave)) nuevos.delete(clave);
      else nuevos.add(clave);
      return nuevos;
    });
  }

  if (!caso) {
    return (
      <section aria-labelledby="ya-cai-titulo" className="flex flex-col gap-4">
        <div>
          <h3 id="ya-cai-titulo" className="titulo text-3xl text-ink">
            Ya caí, ¿qué hago?
          </h3>
          <p className="mt-1 text-ink-soft">Pasa más seguido de lo que pensás, y lo que importa es actuar rápido. Elegí qué fue lo que pasó y te damos los pasos.</p>
        </div>
        <ul className="flex flex-col gap-3">
          {CASOS_YA_CAI.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setElegido(c.id)}
                className="card flex w-full items-center gap-4 p-4 text-left transition-colors hover:border-brand-600 hover:bg-brand-50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <Icono nombre={c.icono} className="h-6 w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink">{c.titulo}</span>
                  <span className="block text-sm text-ink-soft">{c.descripcion}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const todos = [
    ...caso.pasos.map((p, i) => ({ ...p, clave: `${caso.id}:${i}` })),
    ...PASOS_COMUNES.map((p, i) => ({ ...p, clave: `comun:${i}` })),
  ];
  const hechosAhora = todos.filter((p) => hechos.has(p.clave)).length;
  const porcentaje = Math.round((hechosAhora / todos.length) * 100);
  const guia = textoGuia(caso);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(guia);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  const fila = (p: (typeof todos)[number]) => {
    const hecho = hechos.has(p.clave);
    return (
      <li key={p.clave}>
        <label className="flex cursor-pointer gap-3 rounded-xl p-2 hover:bg-brand-50">
          <input type="checkbox" checked={hecho} onChange={() => alternar(p.clave)} className="mt-1 h-5 w-5 shrink-0 accent-brand-700" />
          <span>
            <span className={`block font-bold ${hecho ? "text-ink-mute line-through" : "text-ink"}`}>{p.titulo}</span>
            <span className="block text-sm text-ink-soft">{p.detalle}</span>
          </span>
        </label>
      </li>
    );
  };

  return (
    <section aria-labelledby="ya-cai-guia" className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => setElegido(null)} className="btn btn-ghost -ml-3 min-h-11 px-3 py-2 text-sm">
          Elegir otro caso
        </button>
        <h3 id="ya-cai-guia" ref={titulo} tabIndex={-1} className="titulo mt-1 text-3xl text-ink focus:outline-none">
          {caso.titulo}
        </h3>
      </div>

      <p className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 font-bold text-danger-800">
        <Icono nombre="alerta" className="mt-0.5 h-5 w-5" />
        <span>{caso.urgencia}</span>
      </p>

      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-ink-soft">
          <span>
            {hechosAhora} de {todos.length} pasos hechos
          </span>
          <span>{porcentaje}%</span>
        </div>
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand-700 transition-[width]" style={{ width: `${porcentaje}%` }} />
        </div>
      </div>

      <ul className="flex flex-col gap-1">{todos.slice(0, caso.pasos.length).map(fila)}</ul>

      <div>
        <h4 className="titulo mb-1 text-2xl text-ink">Siempre, en todos los casos</h4>
        <ul className="flex flex-col gap-1">{todos.slice(caso.pasos.length).map(fila)}</ul>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={copiar} className="btn btn-primary flex-1">
          {copiado ? "¡Guía copiada!" : "Copiar guía"}
        </button>
        <a href={urlWhatsApp(guia)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1">
          Mandar por WhatsApp
        </a>
      </div>
    </section>
  );
}