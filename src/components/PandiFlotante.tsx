"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import PandaCuerpo from "./PandaCuerpo";
import { NOMBRE_PANDA } from "@/lib/asistente";
import {
  ALTO_PANDA,
  ANCHO_PANDA,
  ESPERA_VOLVER_MS,
  esArrastre,
  limitarPosicion,
  posicionInicial,
  type Punto,
} from "@/lib/posicionPanda";

const CLAVE_SALUDO = "antiestafa:pandi:saludo";

function leerSesion(clave: string): string | null {
  try {
    return sessionStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardarSesion(clave: string, valor: string) {
  try {
    sessionStorage.setItem(clave, valor);
  } catch {
    // sin almacenamiento (modo privado): no pasa nada
  }
}

type Globito = "saludo" | "wii" | null;

/**
 * Pandi de cuerpo entero, flotando sobre la página. Se asoma desde abajo al cargar y saluda.
 * Se puede arrastrar con el mouse o el dedo (o mover con las flechas): mientras lo movés dice
 * "¡Wiii!", y cuando lo dejás quieto vuelve solo a su lugar. Un toque sin arrastrar abre el chat.
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
  const [volviendo, setVolviendo] = useState(false);
  const [globito, setGlobito] = useState<Globito>(null);
  const inicio = useRef<{ puntero: Punto; pos: Punto } | null>(null);
  const huboArrastre = useRef(false);
  const temporizadorVolver = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la posición depende de la ventana: solo se conoce en el navegador
    setPos(posicionInicial(window.innerWidth, window.innerHeight));

    let temporizadorSaludo: ReturnType<typeof setTimeout> | undefined;
    if (!leerSesion(CLAVE_SALUDO)) {
      setGlobito("saludo");
      guardarSesion(CLAVE_SALUDO, "1");
      temporizadorSaludo = setTimeout(() => setGlobito((g) => (g === "saludo" ? null : g)), 7000);
    }

    const alRedimensionar = () => setPos(posicionInicial(window.innerWidth, window.innerHeight));
    window.addEventListener("resize", alRedimensionar);
    return () => {
      window.removeEventListener("resize", alRedimensionar);
      if (temporizadorSaludo) clearTimeout(temporizadorSaludo);
      if (temporizadorVolver.current) clearTimeout(temporizadorVolver.current);
    };
  }, []);

  if (!pos) return null;

  function cancelarVuelta() {
    if (temporizadorVolver.current) clearTimeout(temporizadorVolver.current);
    setVolviendo(false);
  }

  /** Cuando queda quieto un momento, vuelve a su lugar con una transición suave. */
  function programarVuelta() {
    cancelarVuelta();
    temporizadorVolver.current = setTimeout(() => {
      setGlobito((g) => (g === "wii" ? null : g));
      setVolviendo(true);
      setPos(posicionInicial(window.innerWidth, window.innerHeight));
    }, ESPERA_VOLVER_MS);
  }

  function mover(nueva: Punto) {
    setPos(limitarPosicion(nueva, window.innerWidth, window.innerHeight));
  }

  function alPresionar(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || !pos) return;
    cancelarVuelta();
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
    setGlobito("wii");
    mover({ x: i.pos.x + puntero.x - i.puntero.x, y: i.pos.y + puntero.y - i.puntero.y });
  }

  function alSoltar(e: React.PointerEvent<HTMLButtonElement>) {
    if (!inicio.current) return;
    inicio.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setArrastrando(false);
    if (huboArrastre.current) {
      programarVuelta();
      return;
    }
    // Toque sin arrastre: abrimos acá y no en "click", porque en algunos celulares
    // después de un arrastre el navegador no genera el click del toque siguiente.
    if (e.type === "pointerup") abrir();
  }

  function abrir() {
    setGlobito(null);
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
    cancelarVuelta();
    setGlobito("wii");
    mover({ x: pos.x + delta[0], y: pos.y + delta[1] });
    programarVuelta();
  }

  const aLaDerecha = pos.x + ANCHO_PANDA / 2 > window.innerWidth / 2;

  return (
    <div
      hidden={oculto}
      onTransitionEnd={() => setVolviendo(false)}
      className={`fixed z-40 ${volviendo ? "transition-[left,top] duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]" : ""}`}
      style={{ left: pos.x, top: pos.y, width: ANCHO_PANDA, height: ALTO_PANDA }}
    >
      {globito && (
        <div
          role="status"
          className={`aparecer absolute bottom-full mb-1 rounded-2xl border border-line bg-white px-3 py-2 text-sm text-ink shadow-lg ${
            globito === "saludo" ? "w-52" : "w-max max-w-52 font-bold"
          } ${aLaDerecha ? "right-0 rounded-br-md" : "left-0 rounded-bl-md"}`}
        >
          {globito === "saludo" ? (
            <>
              <span className="font-bold">¡Hola! Soy {NOMBRE_PANDA}.</span> Tocame si tenés dudas. Podés arrastrarme, ¡me encanta!
            </>
          ) : (
            "¡Wiii! ¡Me estás arrastrando! 🐼"
          )}
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
        <span
          className={`block h-full w-full transition-transform duration-150 ${
            arrastrando ? "scale-110 -rotate-6" : volviendo ? "panda-salto" : "hover:-translate-y-1"
          }`}
        >
          <PandaCuerpo className="h-full w-full" saludando={globito !== null && !arrastrando} />
        </span>
      </button>
    </div>
  );
}
