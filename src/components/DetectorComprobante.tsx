"use client";

import { useState } from "react";
import { AVISO_VERIFICAR, etiquetaComprobante, type AnalisisComprobante } from "@/lib/comprobanteUi";
import { mensajeError, validarImagenCliente } from "@/lib/ui";

const COLORES = {
  rojo: "bg-red-50 border-red-300 text-red-800",
  amarillo: "bg-amber-50 border-amber-300 text-amber-900",
  verde: "bg-emerald-50 border-emerald-300 text-emerald-800",
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
    <section aria-labelledby="comprobante-titulo" className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 id="comprobante-titulo" className="text-xl font-bold text-zinc-900">
        ¿Te mandaron un comprobante?
      </h2>
      <p className="text-sm text-zinc-600">Subí la captura (PNG, JPG o WebP, hasta 4 MB) y te marcamos qué huele raro.</p>
      <form onSubmit={revisar} className="flex flex-col gap-3">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Subir captura del comprobante"
          onChange={(e) => elegir(e.target.files?.[0])}
          className="block w-full text-sm text-zinc-700 file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-sky-100 file:px-4 file:font-semibold file:text-sky-900"
        />
        <button
          type="submit"
          disabled={cargando || !archivo}
          className="min-h-12 rounded-xl bg-sky-700 px-4 py-3 text-lg font-bold text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
        >
          {cargando ? "Revisando…" : "Revisar comprobante"}
        </button>
      </form>
      {error && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800">
          {error}
        </p>
      )}
      {resultado && etiqueta && (
        <div role="status" className={`flex flex-col gap-2 rounded-xl border p-4 ${COLORES[etiqueta.luz]}`}>
          <strong className="text-lg">{etiqueta.titulo}</strong>
          {resultado.senales.length > 0 && (
            <ul className="list-disc pl-5">
              {resultado.senales.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}
          <p>{resultado.recomendacion}</p>
          <p className="text-sm font-semibold">{AVISO_VERIFICAR}</p>
        </div>
      )}
    </section>
  );
}
