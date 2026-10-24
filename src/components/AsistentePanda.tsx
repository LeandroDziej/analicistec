"use client";

import { useEffect, useRef, useState } from "react";
import PandaAvatar from "./PandaAvatar";
import PandiFlotante from "./PandiFlotante";
import { Icono } from "./Iconos";
import { MAX_PREGUNTA, NOMBRE_PANDA, SALUDO_PANDA, SUGERENCIAS_PANDA, type MensajePanda } from "@/lib/asistente";

/** Pandi: el asistente que responde preguntas sobre estafas. Flota sobre la página; se puede arrastrar y vuelve solo a su lugar. */
export default function AsistentePanda() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajePanda[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [pensando, setPensando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const lanzador = useRef<HTMLButtonElement>(null);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    campo.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, pensando]);

  function cerrar() {
    setAbierto(false);
    requestAnimationFrame(() => lanzador.current?.focus());
  }

  async function enviar(texto: string) {
    const limpia = texto.trim();
    if (!limpia || pensando) return;
    const historial = mensajes;
    setMensajes([...historial, { rol: "usuario", texto: limpia }]);
    setPregunta("");
    setError(null);
    setPensando(true);
    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pregunta: limpia, historial }),
      });
      const cuerpo = (await res.json().catch(() => null)) as { respuesta?: string; error?: string } | null;
      if (!res.ok || !cuerpo?.respuesta) {
        setError(cuerpo?.error ?? "Pandi no pudo responder ahora. Probá de nuevo en un ratito.");
        return;
      }
      setMensajes((m) => [...m, { rol: "panda", texto: cuerpo.respuesta as string }]);
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y probá de nuevo.");
    } finally {
      setPensando(false);
      campo.current?.focus();
    }
  }

  return (
    <>
      <PandiFlotante ref={lanzador} oculto={abierto} onAbrir={() => setAbierto(true)} />

      {abierto && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="panda-titulo"
          className="aparecer fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl border border-line bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[36rem] sm:w-[24rem] sm:rounded-3xl"
          style={{ boxShadow: "0 24px 60px -20px rgb(18 48 58 / 0.5)" }}
        >
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              <PandaAvatar className="h-11 w-11" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="panda-titulo" className="titulo text-xl text-ink">
                {NOMBRE_PANDA}
              </h2>
              <p className="text-sm text-ink-soft">Te ayuda con estafas. Puede equivocarse.</p>
            </div>
            <button type="button" onClick={cerrar} aria-label={`Cerrar el chat con ${NOMBRE_PANDA}`} className="btn btn-ghost min-h-11 px-3">
              ✕
            </button>
          </header>

          <div aria-live="polite" className="flex flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-4">
            <Burbuja rol="panda" texto={SALUDO_PANDA} />
            {mensajes.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGERENCIAS_PANDA.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    className="rounded-full border border-brand-200 bg-brand-50 px-3 py-2 text-left text-sm font-semibold text-brand-800 transition-colors hover:border-brand-600"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {mensajes.map((m, i) => (
              <Burbuja key={i} rol={m.rol} texto={m.texto} />
            ))}
            {pensando && (
              <div className="flex items-center gap-2 text-sm text-ink-soft" role="status">
                <span className="flex gap-1" aria-hidden="true">
                  <span className="panda-punto h-2 w-2 rounded-full bg-brand-600" />
                  <span className="panda-punto h-2 w-2 rounded-full bg-brand-600 [animation-delay:150ms]" />
                  <span className="panda-punto h-2 w-2 rounded-full bg-brand-600 [animation-delay:300ms]" />
                </span>
                {NOMBRE_PANDA} está pensando…
              </div>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-sm text-danger-800">
                {error}
              </p>
            )}
            <div ref={fin} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(pregunta);
            }}
            className="flex items-end gap-2 border-t border-line p-3"
          >
            <label htmlFor="pregunta-panda" className="sr-only">
              Tu pregunta para {NOMBRE_PANDA}
            </label>
            <textarea
              id="pregunta-panda"
              ref={campo}
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(pregunta);
                }
              }}
              maxLength={MAX_PREGUNTA}
              rows={1}
              placeholder="Escribí tu pregunta…"
              className="field max-h-32 min-h-12 resize-none py-2.5"
            />
            <button type="submit" disabled={pensando || !pregunta.trim()} aria-label="Enviar pregunta" className="btn btn-primary min-h-12 px-4">
              <Icono nombre="enviar" className="h-5 w-5" />
            </button>
          </form>
          <p className="px-4 pb-3 text-xs text-ink-mute">No compartas claves, códigos ni datos de tu tarjeta. Ni con Pandi.</p>
        </div>
      )}
    </>
  );
}

function Burbuja({ rol, texto }: { rol: MensajePanda["rol"]; texto: string }) {
  const esPanda = rol === "panda";
  return (
    <div className={`aparecer flex items-end gap-2 ${esPanda ? "" : "flex-row-reverse"}`}>
      {esPanda && <PandaAvatar className="h-8 w-8 shrink-0" />}
      <p
        className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-base ${
          esPanda ? "rounded-bl-md bg-brand-50 text-ink" : "rounded-br-md bg-brand-700 text-white"
        }`}
      >
        {texto}
      </p>
    </div>
  );
}
