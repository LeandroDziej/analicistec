"use client";

import { useState } from "react";
import {
  AVISO_TRANSFERIR,
  MAX_MENSAJE_TRANSFERENCIA,
  etiquetaTransferencia,
  validarDestino,
  type AnalisisTransferencia,
} from "@/lib/transferenciaUi";
import { mensajeError } from "@/lib/ui";

const COLORES = {
  rojo: "bg-red-50 border-red-300 text-red-800",
  amarillo: "bg-amber-50 border-amber-300 text-amber-900",
  verde: "bg-emerald-50 border-emerald-300 text-emerald-800",
} as const;

export default function ChequeoTransferencia() {
  const [destino, setDestino] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<AnalisisTransferencia | null>(null);

  async function revisar(e: React.FormEvent) {
    e.preventDefault();
    setResultado(null);
    const v = validarDestino(destino);
    if (!v.valido) return setError(v.error ?? "El destino no es válido.");
    setCargando(true);
    setError(null);
    try {
      const resp = await fetch("/api/transferencia", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ destino, mensaje }),
      });
      const cuerpo = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(mensajeError(resp.status, cuerpo));
      setResultado(cuerpo as AnalisisTransferencia);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal. Probá de nuevo en un rato.");
    } finally {
      setCargando(false);
    }
  }

  const etiqueta = resultado ? etiquetaTransferencia(resultado.riesgo) : null;

  return (
    <section aria-labelledby="transferencia-titulo" className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 id="transferencia-titulo" className="text-xl font-bold text-zinc-900">
        ¿Te pidieron que transfieras?
      </h2>
      <p className="text-sm text-zinc-600">Pegá el alias, CBU o CVU y el mensaje que te mandaron. Revisamos el formato y el contexto.</p>
      <form onSubmit={revisar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-zinc-800">
          Alias, CBU o CVU
          <input
            type="text"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            autoComplete="off"
            aria-label="Alias, CBU o CVU de destino"
            className="min-h-12 rounded-xl border border-zinc-300 px-3 py-2 text-base font-normal text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-zinc-800">
          Mensaje que lo acompaña
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={MAX_MENSAJE_TRANSFERENCIA}
            rows={4}
            aria-label="Mensaje que acompaña el pedido de transferencia"
            className="rounded-xl border border-zinc-300 px-3 py-2 text-base font-normal text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </label>
        <button
          type="submit"
          disabled={cargando || !destino.trim()}
          className="min-h-12 rounded-xl bg-sky-700 px-4 py-3 text-lg font-bold text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-50"
        >
          {cargando ? "Revisando…" : "Revisar antes de transferir"}
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
          <p className="text-sm font-semibold">{AVISO_TRANSFERIR}</p>
        </div>
      )}
    </section>
  );
}
