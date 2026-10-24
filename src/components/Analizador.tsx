"use client";

import { useRef, useState } from "react";
import type { AnalisisFinal } from "@/lib/score";
import EjemplosRapidos from "./EjemplosRapidos";
import DominioResaltado from "./DominioResaltado";
import ProgresoAnalisis from "./ProgresoAnalisis";
import LeerEnVozAlta from "./LeerEnVozAlta";
import GenerarDenuncia from "./GenerarDenuncia";
import PreguntasAfinar from "./PreguntasAfinar";
import AsiSeVeElReal from "./AsiSeVeElReal";
import HistorialLocal from "./HistorialLocal";
import { guardarEnHistorial } from "@/lib/historial";
import type { ContextoUsuario } from "@/lib/preguntas";
import { textoParaLeer } from "@/lib/voz";
import { generarAlerta, infoSemaforo, mensajeError, urlWhatsApp, validarImagenCliente } from "@/lib/ui";

type Resultado = AnalisisFinal & { modelo?: string };

const COLORES = {
  rojo: { fondo: "bg-red-50 border-red-300", luz: "bg-red-600", texto: "text-red-800" },
  amarillo: { fondo: "bg-amber-50 border-amber-300", luz: "bg-amber-400", texto: "text-amber-900" },
  verde: { fondo: "bg-emerald-50 border-emerald-300", luz: "bg-emerald-600", texto: "text-emerald-800" },
} as const;

export default function Analizador() {
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [mensajeAnalizado, setMensajeAnalizado] = useState("");
  const [modoAbuela, setModoAbuela] = useState(false);
  const [contexto, setContexto] = useState<ContextoUsuario>({});
  const [versionHistorial, setVersionHistorial] = useState(0);
  const inputArchivo = useRef<HTMLInputElement>(null);

  function elegirImagen(archivo: File | undefined) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    if (!archivo) {
      setImagen(null);
      setPreview(null);
      return;
    }
    const problema = validarImagenCliente(archivo);
    if (problema) {
      setError(problema);
      setImagen(null);
      setPreview(null);
      if (inputArchivo.current) inputArchivo.current.value = "";
      return;
    }
    setImagen(archivo);
    setPreview(URL.createObjectURL(archivo));
  }

  function quitarImagen() {
    elegirImagen(undefined);
    if (inputArchivo.current) inputArchivo.current.value = "";
  }

  async function analizar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() && !imagen) {
      setError("Pegá el mensaje o subí una captura para analizar.");
      return;
    }
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const datos = new FormData();
      if (texto.trim()) datos.append("texto", texto.trim());
      if (imagen) datos.append("imagen", imagen);
      if (Object.keys(contexto).length > 0) datos.append("contexto", JSON.stringify(contexto));
      const res = await fetch("/api/analyze", { method: "POST", body: datos });
      const cuerpo: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(mensajeError(res.status, cuerpo));
        return;
      }
      const r = cuerpo as Resultado;
      setResultado(r);
      setMensajeAnalizado(texto.trim());
      guardarEnHistorial({ veredicto: r.veredicto, score: r.score, mensaje: texto.trim(), resumen: r.resumen_abuela });
      setVersionHistorial((v) => v + 1);
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  function reiniciar() {
    setResultado(null);
    setTexto("");
    setContexto({});
    quitarImagen();
  }

  return (
    <div className="flex flex-col gap-5">
      <form onSubmit={analizar} className="flex flex-col gap-3">
        <EjemplosRapidos onElegir={(t) => { setTexto(t); setError(null); }} />
        <label htmlFor="mensaje" className="text-sm font-semibold text-zinc-700">
          Pegá el mensaje que te llegó
        </label>
        <textarea
          id="mensaje"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={5000}
          rows={5}
          placeholder={'Ej: "Hola mamá, cambié de número, agendame este. ¿Me podés transferir?"'}
          className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-base text-zinc-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-zinc-700">…o subí una captura (máx. 4 MB)</span>
          {preview ? (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-300 bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- preview local (blob:) */}
              <img src={preview} alt="Captura elegida" className="h-16 w-16 rounded-lg object-cover" />
              <span className="flex-1 truncate text-sm text-zinc-700">{imagen?.name}</span>
              <button type="button" onClick={quitarImagen} className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                Quitar
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-white p-4 text-sm font-medium text-zinc-600 hover:border-sky-400 hover:text-sky-700">
              📷 Elegir captura de WhatsApp
              <input
                ref={inputArchivo}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                className="sr-only"
                onChange={(e) => elegirImagen(e.target.files?.[0])}
              />
            </label>
          )}
        </div>

        <PreguntasAfinar valor={contexto} onCambio={setContexto} />

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        )}

        {cargando && <ProgresoAnalisis texto={texto} />}

        <button
          type="submit"
          disabled={cargando}
          className="h-14 rounded-xl bg-sky-700 text-lg font-bold text-white shadow transition hover:bg-sky-800 disabled:cursor-wait disabled:opacity-70"
        >
          {cargando ? "Analizando…" : "¿Es estafa? Analizar"}
        </button>
      </form>

      <HistorialLocal key={versionHistorial} />

      {resultado && <Veredicto resultado={resultado} mensaje={mensajeAnalizado} modoAbuela={modoAbuela} setModoAbuela={setModoAbuela} onNuevo={reiniciar} />}
    </div>
  );
}

function Veredicto({
  resultado,
  mensaje,
  modoAbuela,
  setModoAbuela,
  onNuevo,
}: {
  resultado: Resultado;
  mensaje: string;
  modoAbuela: boolean;
  setModoAbuela: (v: boolean) => void;
  onNuevo: () => void;
}) {
  const info = infoSemaforo(resultado.veredicto);
  const c = COLORES[info.luz];
  const luces = ["rojo", "amarillo", "verde"] as const;

  return (
    <section aria-live="polite" className="flex flex-col gap-4">
      <div className={`flex items-center gap-4 rounded-2xl border-2 p-4 ${c.fondo}`}>
        <div className="flex flex-col gap-1.5 rounded-full bg-zinc-800 p-2" aria-hidden>
          {luces.map((l) => (
            <span key={l} className={`h-6 w-6 rounded-full ${l === info.luz ? COLORES[l].luz + " shadow-[0_0_10px_currentColor]" : "bg-zinc-600"}`} />
          ))}
        </div>
        <div className="flex-1">
          <h2 className={`font-extrabold ${c.texto} ${modoAbuela ? "text-4xl" : "text-2xl"}`}>{info.titulo}</h2>
          <p className={`${c.texto} ${modoAbuela ? "text-xl" : "text-sm"}`}>{info.bajada}</p>
        </div>
        <div className="text-center">
          <div className={`font-black ${c.texto} ${modoAbuela ? "text-5xl" : "text-4xl"}`}>{resultado.score}</div>
          <div className="text-xs font-medium text-zinc-600">riesgo / 100</div>
        </div>
      </div>

      <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3">
        <span className="font-semibold text-zinc-800">👵 Modo abuela (letra grande y simple)</span>
        <input
          type="checkbox"
          checked={modoAbuela}
          onChange={(e) => setModoAbuela(e.target.checked)}
          className="h-6 w-6 accent-sky-700"
        />
      </label>

      {modoAbuela ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-2xl leading-relaxed text-zinc-900">{resultado.resumen_abuela}</p>
          {resultado.que_hacer[0] && (
            <p className="rounded-xl bg-sky-50 p-4 text-2xl font-bold leading-relaxed text-sky-900">👉 {resultado.que_hacer[0]}</p>
          )}
          <LeerEnVozAlta texto={textoParaLeer([resultado.resumen_abuela, resultado.que_hacer[0]])} />
        </div>
      ) : (
        <>
          {resultado.banderas.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4">
              <h3 className="mb-2 text-lg font-bold text-zinc-900">🚩 Banderas rojas</h3>
              <ul className="flex flex-col gap-2">
                {resultado.banderas.map((b) => (
                  <li key={b} className="flex gap-2 text-zinc-800">
                    <span aria-hidden>•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resultado.que_hacer.length > 0 && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <h3 className="mb-2 text-lg font-bold text-sky-900">✅ Qué hacer ahora</h3>
              <ol className="flex list-decimal flex-col gap-2 pl-5 text-sky-950">
                {resultado.que_hacer.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <h3 className="mb-1 text-lg font-bold text-zinc-900">En dos líneas</h3>
            <p className="text-zinc-800">{resultado.resumen_abuela}</p>
          </div>

          {resultado.links.length > 0 && (
            <details className="rounded-2xl border border-zinc-200 bg-white p-4">
              <summary className="cursor-pointer font-bold text-zinc-900">🔗 Links revisados ({resultado.links.length})</summary>
              <ul className="mt-3 flex flex-col gap-3 text-sm">
                {resultado.links.map((l) => (
                  <li key={l.url} className="break-all rounded-lg bg-zinc-50 p-3">
                    <DominioResaltado link={l} />
                    <div className="mt-1 text-zinc-600">
                      {l.antiguedadDias !== null ? `Dominio de hace ${l.antiguedadDias} días` : "Antigüedad desconocida"}
                      {" · "}
                      {l.ssl === true ? "Con candado (SSL)" : l.ssl === false ? "Sin SSL" : "SSL sin verificar"}
                      {l.redirecciones.length > 0 && ` · ${l.redirecciones.length} redirección(es)`}
                    </div>
                    {l.senales.length > 0 && <div className="mt-1 text-red-700">{l.senales.join(" · ")}</div>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}

      <AsiSeVeElReal links={resultado.links} />

      <CompartirAlerta resultado={resultado} />

      <GenerarDenuncia datos={{ ...resultado, mensaje }} />

      <button type="button" onClick={onNuevo} className="h-12 rounded-xl border border-zinc-300 bg-white font-semibold text-zinc-800 hover:bg-zinc-50">
        Analizar otro mensaje
      </button>
    </section>
  );
}

function CompartirAlerta({ resultado }: { resultado: Resultado }) {
  const [alerta, setAlerta] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "copiado" | "error">("idle");
  const area = useRef<HTMLTextAreaElement>(null);

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
    } catch {
      // Sin permiso de portapapeles (o http): dejamos el texto seleccionado para copiar a mano.
      area.current?.select();
      setEstado("error");
    }
  }

  function generar() {
    const texto = generarAlerta(resultado);
    setAlerta(texto);
    void copiar(texto);
  }

  if (!alerta) {
    return (
      <button
        type="button"
        onClick={generar}
        className="h-14 rounded-xl bg-emerald-700 text-lg font-bold text-white shadow transition hover:bg-emerald-800"
      >
        📢 Generar alerta para compartir
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <h3 className="text-lg font-bold text-emerald-900">📢 Alerta para compartir</h3>
      <textarea
        ref={area}
        readOnly
        value={alerta}
        rows={10}
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-xl border border-emerald-200 bg-white p-3 text-sm text-zinc-900"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => copiar(alerta)}
          className="h-12 flex-1 rounded-xl bg-emerald-700 font-bold text-white hover:bg-emerald-800"
        >
          {estado === "copiado" ? "¡Copiado! ✔" : "Copiar texto"}
        </button>
        <a
          href={urlWhatsApp(alerta)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-emerald-700 bg-white font-bold text-emerald-800 hover:bg-emerald-100"
        >
          Mandar por WhatsApp
        </a>
      </div>
      <p aria-live="polite" className="text-sm text-emerald-900">
        {estado === "copiado" && "Listo, pegalo en el grupo de la familia."}
        {estado === "error" && "No pudimos copiar solo: mantené apretado el texto y elegí Copiar."}
      </p>
    </div>
  );
}
