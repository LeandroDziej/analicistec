"use client";

import { useEffect, useRef, useState } from "react";
import { Veredicto, type Resultado } from "./Analizador";
import { Icono } from "./Iconos";
import { guardarEntrada } from "./historialStore";
import { formatoDuracion, formatoGrabacion, MAX_GRABACION_SEG, validarAudioCliente } from "@/lib/audio";
import { mensajeError } from "@/lib/ui";

/**
 * Pestaña "Audio": revisa una nota de voz o una llamada grabada.
 * Se puede subir el archivo (la nota de voz de WhatsApp) o grabar con el micrófono
 * mientras suena el audio en el otro celular.
 */
export default function AnalizarAudio() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [urlEscucha, setUrlEscucha] = useState<string | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [puedeGrabar, setPuedeGrabar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [modoAbuela, setModoAbuela] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const grabadora = useRef<MediaRecorder | null>(null);
  const reloj = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende del navegador
    setPuedeGrabar(typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia));
    return () => {
      if (reloj.current) clearInterval(reloj.current);
      grabadora.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (urlEscucha) URL.revokeObjectURL(urlEscucha);
    };
  }, [urlEscucha]);

  function elegir(f: File | null | undefined) {
    setError(null);
    setResultado(null);
    if (!f) {
      setArchivo(null);
      setUrlEscucha(null);
      if (input.current) input.current.value = "";
      return;
    }
    const problema = validarAudioCliente(f);
    if (problema) {
      setError(problema);
      if (input.current) input.current.value = "";
      return;
    }
    setArchivo(f);
    setUrlEscucha(URL.createObjectURL(f));
  }

  async function empezarGrabacion() {
    setError(null);
    setResultado(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const tipo = formatoGrabacion((t) => MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, tipo ? { mimeType: tipo } : undefined);
      const partes: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && partes.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (reloj.current) clearInterval(reloj.current);
        setGrabando(false);
        const mime = (rec.mimeType || tipo || "audio/webm").split(";")[0];
        const ext = mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";
        elegir(new File(partes, `grabacion.${ext}`, { type: mime }));
      };
      grabadora.current = rec;
      rec.start();
      setGrabando(true);
      setSegundos(0);
      const inicio = Date.now();
      reloj.current = setInterval(() => {
        const s = Math.floor((Date.now() - inicio) / 1000);
        setSegundos(s);
        if (s >= MAX_GRABACION_SEG) rec.stop();
      }, 250);
    } catch {
      setError("No pudimos usar el micrófono. Revisá que le hayas dado permiso al navegador, o subí el audio.");
    }
  }

  function detenerGrabacion() {
    if (grabadora.current?.state === "recording") grabadora.current.stop();
  }

  async function analizar() {
    if (!archivo) {
      setError("Elegí o grabá un audio para revisar.");
      return;
    }
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const datos = new FormData();
      datos.append("audio", archivo);
      const res = await fetch("/api/analyze", { method: "POST", body: datos });
      const cuerpo: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(mensajeError(res.status, cuerpo));
        return;
      }
      const r = cuerpo as Resultado;
      setResultado(r);
      guardarEntrada({ tipo: "mensaje", veredicto: r.veredicto, score: r.score, texto: r.transcripcion ? `🎙️ ${r.transcripcion}` : "🎙️ Audio" });
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-bold text-ink">¿Te mandaron un audio raro?</h3>
          <p className="text-base text-ink-soft">
            Notas de voz de un “familiar” que pide plata, del “banco” o de un supuesto organismo. Hoy las voces se pueden imitar con
            inteligencia artificial: escuchamos el audio y te decimos si es estafa.
          </p>
        </div>

        {archivo && urlEscucha ? (
          <div className="card flex flex-col gap-3 p-4">
            <p className="flex items-center gap-2 text-sm text-ink-soft">
              <Icono nombre="microfono" className="h-5 w-5 text-brand-700" />
              <span className="truncate">{archivo.name}</span>
            </p>
            <audio controls src={urlEscucha} className="w-full" aria-label="Escuchar el audio elegido" />
            <button type="button" onClick={() => elegir(null)} className="btn btn-ghost w-fit min-h-11 px-3 text-sm">
              Quitar y elegir otro
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-4 transition-colors hover:border-brand-600 hover:bg-brand-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-brand-700">
                <Icono nombre="documento" className="h-6 w-6" />
              </span>
              <span className="flex flex-col">
                <span className="font-bold text-brand-800">Subir el audio</span>
                <span className="text-sm text-ink-soft">Nota de voz de WhatsApp, MP3 o M4A. Hasta 4 MB.</span>
              </span>
              <input
                ref={input}
                type="file"
                accept="audio/*,.opus,.ogg,.m4a,.mp3,.wav,.webm,.amr"
                className="sr-only"
                onChange={(e) => elegir(e.target.files?.[0])}
              />
            </label>
            {puedeGrabar &&
              (grabando ? (
                <button type="button" onClick={detenerGrabacion} className="btn min-h-20 border-danger-600 bg-danger-600 text-white hover:bg-danger-800">
                  <Icono nombre="detener" className="h-6 w-6" />
                  <span className="flex flex-col items-start">
                    <span>Detener grabación</span>
                    <span className="text-sm font-semibold text-white/90" aria-live="polite">
                      Grabando… {formatoDuracion(segundos)} / {formatoDuracion(MAX_GRABACION_SEG)}
                    </span>
                  </span>
                </button>
              ) : (
                <button type="button" onClick={empezarGrabacion} className="btn btn-secondary min-h-20 justify-start gap-4 px-4 text-left">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Icono nombre="microfono" className="h-6 w-6" />
                  </span>
                  <span className="flex flex-col">
                    <span>Grabar con el micrófono</span>
                    <span className="text-sm font-normal text-ink-soft">Poné el audio en altavoz en el otro celular.</span>
                  </span>
                </button>
              ))}
          </div>
        )}

        <details className="text-base text-ink-soft">
          <summary className="cursor-pointer font-semibold text-brand-800">¿Cómo saco el audio de WhatsApp?</summary>
          <ol className="mt-2 flex list-decimal flex-col gap-1 pl-6">
            <li>
              <strong>Android:</strong> mantené apretado el audio → Compartir (o ⋮ → Compartir) → elegí guardarlo en Archivos o mandátelo a vos.
            </li>
            <li>
              <strong>iPhone:</strong> mantené apretado el audio → Reenviar → el botón de compartir → Guardar en Archivos.
            </li>
            <li>Después tocá “Subir el audio” y elegilo. Si no podés, usá “Grabar con el micrófono”.</li>
          </ol>
        </details>

        {error && (
          <p role="alert" className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-base text-danger-800">
            <Icono nombre="alerta" className="mt-0.5 h-5 w-5" />
            <span>{error}</span>
          </p>
        )}

        <button type="button" onClick={analizar} disabled={cargando || grabando} className="btn btn-primary min-h-14 text-lg">
          {cargando ? (
            <>
              <Icono nombre="cargando" className="h-5 w-5" />
              Escuchando el audio…
            </>
          ) : (
            "¿Es estafa? Analizar audio"
          )}
        </button>
      </div>

      {resultado?.transcripcion && (
        <div className="card flex flex-col gap-2 p-4">
          <p className="font-bold text-ink">Lo que dice el audio</p>
          <p className="whitespace-pre-line text-base italic text-ink-soft">“{resultado.transcripcion}”</p>
        </div>
      )}
      {resultado && (
        <Veredicto
          resultado={resultado}
          mensaje={resultado.transcripcion ? `[Audio] ${resultado.transcripcion}` : "[Audio]"}
          modoAbuela={modoAbuela}
          setModoAbuela={setModoAbuela}
          onNuevo={() => {
            setResultado(null);
            elegir(null);
          }}
        />
      )}
    </div>
  );
}
