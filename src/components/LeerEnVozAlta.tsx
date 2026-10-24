"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { elegirVoz } from "@/lib/voz";

export default function LeerEnVozAlta({ texto }: { texto: string }) {
  const soportado = useSyncExternalStore(
    () => () => {},
    () => "speechSynthesis" in window,
    () => false,
  );
  const [leyendo, setLeyendo] = useState(false);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  if (!soportado || !texto.trim()) return null;

  function alternar() {
    const synth = window.speechSynthesis;
    if (leyendo) {
      synth.cancel();
      setLeyendo(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(texto);
    const voz = elegirVoz(synth.getVoices());
    u.lang = voz?.lang ?? "es-AR";
    if (voz) u.voice = voz;
    u.onend = () => setLeyendo(false);
    u.onerror = () => setLeyendo(false);
    synth.cancel();
    synth.speak(u);
    setLeyendo(true);
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={leyendo ? "Detener la lectura en voz alta" : "Escuchar el resumen en voz alta"}
      className="min-h-14 rounded-xl bg-sky-700 px-5 py-3 text-xl font-bold text-white hover:bg-sky-800"
    >
      {leyendo ? "⏹ Detener" : "🔊 Escuchar"}
    </button>
  );
}
