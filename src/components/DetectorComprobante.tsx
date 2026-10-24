"use client";

import { useState } from "react";
import { AVISO_VERIFICAR, etiquetaComprobante, type AnalisisComprobante } from "@/lib/comprobanteUi";
import { mensajeError, validarImagenCliente } from "@/lib/ui";
import { Icono } from "./Iconos";

const TONOS = {
  rojo: "border-danger-200 bg-danger-50 text-danger-800",
  amarillo: "border-warn-200 bg-warn-50 text-warn-800",
  verde: "border-safe-200 bg-safe-50 text-safe-800",
} as const;

export default function DetectorComprobante() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<AnalisisComprobante | null>(null);

  function elegir(f: File | undefined) {
    setError(null);
    setResultado(null);
    if (!f) return setArchivo(null);
    const problema = validarImagenCliente(f);
    if (problema) {
      setError(problema);
      return setArchivo(null);
    }
    setArchivo(f);
  }

  async function revisar(e: React.FormEvent) {
    e.preventDefault();
    if (!archivo) return setError("Subí la captura del comprobante.");
    setCargando(true);
    setError(null);
    setResultado(null);
    try {
      const form = new FormData();
      form.append("imagen", archivo);
      const resp = await fetch("/api/comprobante", { method: "POST", body: form });
      const cuerpo = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(mensajeError(resp.status, cuerpo));
      setResultado(cuerpo as AnalisisComprobante);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo en un rato.");
    } finally {
      setCargando(false);
    }
  }

  const etiqueta = resultado ? etiquetaComprobante(resultado.veredicto) : null;

  return (
    <section aria-labelledby="comprobante-titulo" className="flex flex-col gap-4">
      <div>
        <h2 id="comprobante-titulo" className="titulo text-3xl text-ink">
          ¿Te mandaron un comprobante?
        </h2>
        <p className="mt-1 text-ink-soft">Subí la captura (PNG, JPG o WebP, hasta 4 MB) y te marcamos qué huele raro.</p>
      </div>
      <form onSubmit={revisar} className="flex flex-col gap-4" aria-busy={cargando}>
        <label className="flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/60 p-4 transition-colors hover:border-brand-600 hover:bg-brand-50 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-700">
            <Icono nombre="camara" className="h-6 w-6" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-bold text-brand-800">{archivo ? archivo.name : "Elegir la captura del comprobante"}</span>
            <span className="text-sm text-ink-soft">{archivo ? "Tocá para cambiarla." : "Hasta 4 MB."}</span>
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Subir captura del comprobante"
            onChange={(e) => elegir(e.target.files?.[0])}
            className="sr-only"
          />
        </label>
        <button type="submit" disabled={cargando || !archivo} className="btn btn-primary min-h-14 text-lg">
          {cargando ? (
            <>
              <Icono nombre="cargando" className="h-5 w-5" />
              Revisando…
            </>
          ) : (
            "Revisar comprobante"
          )}
        </button>
      </form>
      {error && (
        <p role="alert" className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-800">
          <Icono nombre="alerta" className="mt-0.5 h-5 w-5" />
          <span>{error}</span>
        </p>
      )}
      {resultado && etiqueta && (
        <div role="status" className={`flex flex-col gap-3 rounded-2xl border-2 p-5 ${TONOS[etiqueta.luz]}`}>
          <strong className="titulo text-2xl">{etiqueta.titulo}</strong>
          {resultado.senales.length > 0 && (
            <ul className="list-disc pl-5">
              {resultado.senales.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
          <p>{resultado.recomendacion}</p>
          <p className="text-sm font-bold">{AVISO_VERIFICAR}</p>
        </div>
      )}
    </section>
  );
}