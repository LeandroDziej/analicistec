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
import { Icono } from "./Iconos";

const TONOS = {
  rojo: "border-danger-200 bg-danger-50 text-danger-800",
  amarillo: "border-warn-200 bg-warn-50 text-warn-800",
  verde: "border-safe-200 bg-safe-50 text-safe-800",
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
    <section aria-labelledby="transferencia-titulo" className="flex flex-col gap-4">
      <div>
        <h2 id="transferencia-titulo" className="titulo text-3xl text-ink">
          ¿Te pidieron que transfieras?
        </h2>
        <p className="mt-1 text-ink-soft">Pegá el alias, CBU o CVU y el mensaje que te mandaron. Revisamos el formato y el contexto.</p>
      </div>
      <form onSubmit={revisar} className="flex flex-col gap-4" aria-busy={cargando}>
        <label className="flex flex-col gap-1.5 text-base font-bold text-ink">
          Alias, CBU o CVU
          <input
            type="text"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            autoComplete="off"
            aria-label="Alias, CBU o CVU de destino"
            className="field min-h-12 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-base font-bold text-ink">
          Mensaje que lo acompaña
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={MAX_MENSAJE_TRANSFERENCIA}
            rows={4}
            aria-label="Mensaje que acompaña el pedido de transferencia"
            className="field font-normal"
          />
        </label>
        <button type="submit" disabled={cargando || !destino.trim()} className="btn btn-primary min-h-14 text-lg">
          {cargando ? (
            <>
              <Icono nombre="cargando" className="h-5 w-5" />
              Revisando…
            </>
          ) : (
            "Revisar antes de transferir"
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
          <p className="text-sm font-bold">{AVISO_TRANSFERIR}</p>
        </div>
      )}
    </section>
  );
}