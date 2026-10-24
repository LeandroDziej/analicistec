"use client";

import { useEffect, useState } from "react";
import { detectarPlataforma, instruccionesInstalar, type Plataforma } from "@/lib/pwa";

type EventoInstalar = Event & { prompt: () => Promise<void> };

function yaInstalada(): boolean {
  try {
    const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
    return iosStandalone || window.matchMedia("(display-mode: standalone)").matches;
  } catch {
    return false;
  }
}

/**
 * Botón "Instalar app": se ve siempre (en la compu y en el celular).
 * Si el navegador permite instalar con un clic, instala; si no, muestra
 * instrucciones según el navegador. Se oculta si la app ya está instalada.
 */
export default function BotonInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [plataforma, setPlataforma] = useState<Plataforma>("otro");
  const [instalada, setInstalada] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    // Se calcula en el navegador para no desentonar con el HTML del servidor.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPlataforma(detectarPlataforma(navigator.userAgent, navigator.maxTouchPoints ?? 0));
    setInstalada(yaInstalada());
    /* eslint-enable react-hooks/set-state-in-effect */

    const alPreguntar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    const alInstalar = () => {
      setEvento(null);
      setInstalada(true);
      setAbierto(false);
    };
    window.addEventListener("beforeinstallprompt", alPreguntar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPreguntar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (instalada) return null;

  async function alTocar() {
    if (evento) {
      try {
        await evento.prompt();
      } catch {
        setAbierto(true);
      }
      setEvento(null);
      return;
    }
    setAbierto((a) => !a);
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setCopiado(false);
    }
  }

  const info = instruccionesInstalar(plataforma);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={alTocar}
        aria-expanded={abierto}
        aria-controls="instrucciones-instalar"
        aria-label="Instalar AntiEstafa AR como app"
        className="h-12 rounded-xl border border-sky-700 bg-white font-semibold text-sky-800 hover:bg-sky-50"
      >
        📲 Instalar app
      </button>

      {abierto && (
        <div
          id="instrucciones-instalar"
          role="region"
          aria-live="polite"
          className="relative rounded-xl border border-sky-200 bg-sky-50 p-4 pr-10 text-sm text-zinc-800"
        >
          <button
            type="button"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar instrucciones"
            className="absolute right-2 top-2 h-8 w-8 rounded-full text-lg leading-none text-zinc-500 hover:bg-sky-100"
          >
            ×
          </button>
          <p className="mb-2 font-semibold text-sky-900">{info.titulo}</p>
          <ol className="list-decimal space-y-1 pl-5">
            {info.pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
          {info.copiarLink && (
            <button
              type="button"
              onClick={copiarLink}
              className="mt-3 h-10 rounded-lg bg-sky-700 px-4 font-semibold text-white hover:bg-sky-800"
            >
              {copiado ? "¡Link copiado!" : "Copiar link de la app"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
