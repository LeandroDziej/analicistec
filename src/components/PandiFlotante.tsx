"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import PandaCuerpo from "./PandaCuerpo";
import { NOMBRE_PANDA } from "@/lib/asistente";
import {
  ALTO_PANDA,
  ANCHO_PANDA,
  CLAVE_POSICION_PANDA,
  esArrastre,
  leerPosicionGuardada,
  limitarPosicion,
  posicionInicial,
  type Punto,
} from "@/lib/posicionPanda";

const CLAVE_SALUDO = "antiestafa:pandi:saludo";

function guardar(clave: string, valor: string, almacen: "local" | "session" = "local") {
  try {
    (almacen === "local" ? localStorage : sessionStorage).setItem(clave, valor);
  } catch {
    // sin almacenamiento (modo privado): no pasa nada
  }
}

function leer(clave: string, almacen: "local" | "session" = "local"): string | null {
  try {
    return (almacen === "local" ? localStorage : sessionStorage).getItem(clave);
  } catch {
    return null;
  }
}

/**
 * Pandi de cuerpo entero, flotando sobre la página. Se asoma desde abajo al cargar,
 * se puede arrastrar con el mouse o el dedo (y mover con las flechas del teclado),
 * recuerda dónde lo dejaste, y un toque sin arrastrar abre el chat.
 */
export default function PandiFlotante({
  onAbrir,
  oculto = false,
  ref,
}: {
  onAbrir: () => void;
  oculto?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  const [pos, setPos] = useState<Punto | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [saludo, setSaludo] = useState(false);
  const inicio = useRef<{ puntero: Punto; pos: Punto } | null>(null);
  const huboArrastre = useRef(false);

  useEffect(() => {
    const guardada = leerPosicionGuardada(leer(CLAVE_POSICION_PANDA));
    const ancho = window.innerWidth;
    const alto = window.innerHeight;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la posición depende de la ventana: solo se conoce en el navegador
    setPos(guardada ? limitarPosicion(guardada, ancho, alto) : posicionInicial(ancho, alto));

    let temporizador: ReturnType<typeof setTimeout> | undefined;
    if (!leer(CLAVE_SALUDO, "session")) {
      setSaludo(true);
      guardar(CLAVE_SALUDO, "1", "session");
      temporizador = setTimeout(() => setSaludo(false), 7000);
    }

    const alRedimensionar = () => setPos((p) => (p ? limitarPosicion(p, window.innerWidth, window.innerHeight) : p));
    window.addEventListener("resize", alRedimensionar);
    return () => {
      window.removeEventListener("resize", alRedimensionar);
      if (temporizador) clearTimeout(temporizador);
    };
  }, []);

  if (!pos) return null;

  function mover(nueva: Punto) {
    const limitada = limitarPosicion(nueva, window.innerWidth, window.innerHeight);
    setPos(limitada);
    return limitada;
  }

  function alPresionar(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || !pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    inicio.current = { puntero: { x: e.clientX, y: e.clientY }, pos };
    huboArrastre.current = false;
  }

  function alMover(e: React.PointerEvent<HTMLButtonElement>) {
    const i = inicio.current;
    if (!i) return;
    const puntero = { x: e.clientX, y: e.clientY };
    if (!huboArrastre.current && !esArrastre(i.puntero, puntero)) return;
    huboArrastre.current = true;
    setArrastrando(true);
    setSaludo(false);
    mover({ x: i.pos.x + puntero.x - i.puntero.x, y: i.pos.y + puntero.y - i.puntero.y });
  }

  function alSoltar(e: React.PointerEvent<HTMLButtonElement>) {
    if (!inicio.current) return;
    inicio.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setArrastrando(false);
    if (huboArrastre.current) {
      if (pos) guardar(CLAVE_POSICION_PANDA, JSON.stringify(pos));
      return;
    }
    // Toque sin arrastre: abrimos acá y no en "click", porque en algunos celulares
    // después de un arrastre el navegador no genera el click del toque siguiente.
    if (e.type === "pointerup") abrir();
  }

  function abrir() {
    setSaludo(false);
    onAbrir();
  }

  function alTocar(e: React.MouseEvent<HTMLButtonElement>) {
    // Los clicks del mouse o del dedo ya se atendieron en pointerup; acá solo llegan
    // los del teclado (Enter o Espacio), que tienen detail = 0.
    if (e.detail === 0) abrir();
  }

  function alTeclear(e: React.KeyboardEvent<HTMLButtonElement>) {
    const paso = e.shiftKey ? 72 : 24;
    const delta = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[e.key];
    if (!delta || !pos) return;
    e.preventDefault();
    const nueva = mover({ x: pos.x + delta[0], y: pos.y + delta[1] });
    guardar(CLAVE_POSICION_PANDA, JSON.stringify(nueva));
  }

  const aLaDerecha = pos.x + ANCHO_PANDA / 2 > window.innerWidth / 2;

  return (
    <div hidden={oculto} className="fixed z-40" style={{ left: pos.x, top: pos.y, width: ANCHO_PANDA, height: ALTO_PANDA }}>
      {saludo && (
        <div
          role="status"
          className={`aparecer absolute bottom-full mb-1 w-52 rounded-2xl border border-line bg-white px-3 py-2 text-sm text-ink shadow-lg ${
            aLaDerecha ? "right-0 rounded-br-md" : "left-0 rounded-bl-md"
          }`}
        >
          <span className="font-bold">¡Hola! Soy {NOMBRE_PANDA}.</span> Tocame si tenés dudas. Podés arrastrarme a donde quieras.
        </div>
      )}
      <button
        ref={ref}
        type="button"
        onPointerDown={alPresionar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
        onClick={alTocar}
        onKeyDown={alTeclear}
        aria-label={`${NOMBRE_PANDA}, el asistente. Tocá para preguntarle. Con las flechas lo podés mover.`}
        className={`panda-asoma block h-full w-full touch-none select-none rounded-3xl focus-visible:outline-offset-4 ${
          arrastrando ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ filter: "drop-shadow(0 10px 14px rgb(18 48 58 / 0.28))" }}
      >
        <span className={`block h-full w-full transition-transform duration-150 ${arrastrando ? "scale-110 -rotate-6" : "hover:-translate-y-1"}`}>
          <PandaCuerpo className="h-full w-full" saludando={saludo && !arrastrando} />
        </span>
      </button>
    </div>
  );
}
