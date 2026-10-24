"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { elegirVoz } from "@/lib/voz";
import { Icono } from "./Iconos";

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
      className="btn btn-primary min-h-14 px-6 text-xl"
    >
      <Icono nombre={leyendo ? "detener" : "parlante"} className="h-6 w-6" />
      {leyendo ? "Detener" : "Escuchar"}
    </button>
  );
}