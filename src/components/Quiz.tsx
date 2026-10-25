"use client";

import { useEffect, useRef, useState } from "react";
import { PREGUNTAS_QUIZ, nivelQuiz, textoCompartirQuiz } from "@/lib/quiz";
import { urlWhatsApp } from "@/lib/ui";
import { Icono } from "./Iconos";

export default function Quiz() {
  const [indice, setIndice] = useState(0);
  const [eleccion, setEleccion] = useState<boolean | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [fin, setFin] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const siguiente = useRef<HTMLButtonElement>(null);
  const total = PREGUNTAS_QUIZ.length;
  const pregunta = PREGUNTAS_QUIZ[indice];

  useEffect(() => {
    if (eleccion !== null) siguiente.current?.focus();
  }, [eleccion]);

  function responder(diceEstafa: boolean) {
    if (eleccion !== null) return;
    setEleccion(diceEstafa);
    if (diceEstafa === pregunta.esEstafa) setAciertos((a) => a + 1);
  }

  function avanzar() {
    if (indice + 1 < total) {
      setIndice(indice + 1);
      setEleccion(null);
    } else {
      setFin(true);
    }
  }

  function reiniciar() {
    setIndice(0);
    setEleccion(null);
    setAciertos(0);
    setFin(false);
    setCopiado(false);
  }

  const textoResultado = () => textoCompartirQuiz(aciertos, total, window.location.origin);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoResultado());
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  const encabezado = (
    <div>
      <h3 className="titulo text-3xl text-ink">¿Podés detectar la estafa?</h3>
      <p className="mt-1 text-ink-soft">{total} mensajes: algunos son reales y otros son estafas. Decidí cuál es cuál.</p>
    </div>
  );

  if (fin) {
    const nivel = nivelQuiz(aciertos, total);
    return (
      <section className="flex flex-col gap-5" aria-live="polite">
        {encabezado}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center">
          <p className="titulo text-6xl text-brand-800">
            {aciertos}
            <span className="text-3xl text-ink-soft"> de {total}</span>
          </p>
          <h4 className="titulo text-2xl text-ink">{nivel.titulo}</h4>
          <p className="max-w-prose text-ink-soft">{nivel.texto}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={copiar} className="btn btn-primary flex-1">
            {copiado ? "¡Copiado!" : "Copiar resultado"}
          </button>
          <button type="button" onClick={() => window.open(urlWhatsApp(textoResultado()), "_blank", "noopener,noreferrer")} className="btn btn-secondary flex-1">
            Mandar por WhatsApp
          </button>
        </div>
        <button type="button" onClick={reiniciar} className="btn btn-ghost">
          Jugar de nuevo
        </button>
      </section>
    );
  }

  const acierto = eleccion !== null && eleccion === pregunta.esEstafa;

  return (
    <section className="flex flex-col gap-5">
      {encabezado}

      <div>
        <div className="mb-2 flex items-center justify-between text-sm font-bold text-ink-soft">
          <span>
            Mensaje {indice + 1} de {total}
          </span>
          <span>
            {aciertos} {aciertos === 1 ? "acierto" : "aciertos"}
          </span>
        </div>
        <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-brand-700 transition-[width]" style={{ width: `${(indice / total) * 100}%` }} />
        </div>
      </div>

      <blockquote className="whitespace-pre-line break-words rounded-2xl rounded-tl-sm border border-line bg-paper p-4 text-lg text-ink">{pregunta.mensaje}</blockquote>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => responder(true)} disabled={eleccion !== null} aria-pressed={eleccion === true} className={`btn btn-secondary min-h-14 text-lg ${eleccion === true ? "border-brand-700 bg-brand-50 disabled:opacity-100" : ""}`}>
          <Icono nombre="alerta" className="h-5 w-5" />
          Es una estafa
        </button>
        <button type="button" onClick={() => responder(false)} disabled={eleccion !== null} aria-pressed={eleccion === false} className={`btn btn-secondary min-h-14 text-lg ${eleccion === false ? "border-brand-700 bg-brand-50 disabled:opacity-100" : ""}`}>
          <Icono nombre="check" className="h-5 w-5" />
          Parece real
        </button>
      </div>

      {eleccion !== null && (
        <div role="status" className={`flex flex-col gap-3 rounded-2xl border-2 p-5 ${acierto ? "border-safe-200 bg-safe-50 text-safe-800" : "border-warn-200 bg-warn-50 text-warn-800"}`}>
          <h4 className="titulo text-2xl">{acierto ? "¡Bien!" : "No era esa"}</h4>
          <p>
            <strong>{pregunta.esEstafa ? "Era una estafa." : "Era un mensaje real."}</strong> {pregunta.explicacion}
          </p>
          <div>
            <p className="font-bold">Qué mirar:</p>
            <ul className="list-disc pl-5">
              {pregunta.pistas.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
          <button ref={siguiente} type="button" onClick={avanzar} className="btn btn-primary self-start">
            {indice + 1 < total ? "Siguiente mensaje" : "Ver mi resultado"}
          </button>
        </div>
      )}
    </section>
  );
}