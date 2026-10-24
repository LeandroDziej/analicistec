"use client";

import { useEffect, useState } from "react";

type EventoInstalar = Event & { prompt: () => Promise<void> };

/** Botón "Agregar a la pantalla de inicio": solo aparece si el navegador permite instalar la app. */
export default function BotonInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);

  useEffect(() => {
    const alPreguntar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    const alInstalar = () => setEvento(null);
    window.addEventListener("beforeinstallprompt", alPreguntar);
    window.addEventListener("appinstalled", alInstalar);
    return () => {
      window.removeEventListener("beforeinstallprompt", alPreguntar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (!evento) return null;

  async function instalar() {
    try {
      await evento?.prompt();
    } catch {
      // si el navegador la rechaza, no pasa nada
    }
    setEvento(null);
  }

  return (
    <button
      type="button"
      onClick={instalar}
      aria-label="Agregar AntiEstafa AR a la pantalla de inicio"
      className="h-12 rounded-xl border border-sky-700 bg-white font-semibold text-sky-800 hover:bg-sky-50"
    >
      📲 Agregar a la pantalla de inicio
    </button>
  );
}
