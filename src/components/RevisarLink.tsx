"use client";

import { useState } from "react";
import type { RespuestaLink } from "@/lib/linkUi";
import { mensajeError } from "@/lib/ui";
import { guardarEntrada } from "./historialStore";
import { Icono } from "./Iconos";
import TarjetaLink from "./TarjetaLink";

export default function RevisarLink() {
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<RespuestaLink | null>(null);

  async function revisar(e: React.FormEvent) {
    e.preventDefault();
    if (!entrada.trim()) {
      setError("Pegá el link que querés revisar.");
      return;
    }
    setCargando(true);
    setError(null);
    setDatos(null);
    try {
      const res = await fetch("/api/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: entrada }),
      });
      const cuerpo: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        setError(mensajeError(res.status, cuerpo));
        return;
      }
      const respuesta = cuerpo as RespuestaLink;
      setDatos(respuesta);
      guardarEntrada({ tipo: "link", veredicto: respuesta.veredicto, score: respuesta.score, texto: respuesta.link.dominio });
    } catch {
      setError("No pudimos conectarnos. Revisá tu internet y probá de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section aria-labelledby="link-titulo" className="flex flex-col gap-4">
      <div>
        <h2 id="link-titulo" className="titulo text-3xl text-ink">
          ¿Dudás de un link?
        </h2>
        <p className="mt-1 text-ink-soft">Pegá la dirección y la revisamos sin abrirla: cuántos días tiene el sitio, si tiene candado y si imita a una marca.</p>
      </div>
      <form onSubmit={revisar} className="flex flex-col gap-4" aria-busy={cargando}>
        <label className="flex flex-col gap-1.5 text-base font-bold text-ink">
          El link
          <input
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Ej: https://mercadopago.com.ar/ayuda"
            className="field min-h-12 font-normal"
          />
        </label>
        {error && (
          <p role="alert" className="flex gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-800">
            <Icono nombre="alerta" className="mt-0.5 h-5 w-5" />
            <span>{error}</span>
          </p>
        )}
        <button type="submit" disabled={cargando} className="btn btn-primary min-h-14 text-lg">
          {cargando ? (
            <>
              <Icono nombre="cargando" className="h-5 w-5" />
              Revisando…
            </>
          ) : (
            <>
              <Icono nombre="lupa" className="h-5 w-5" />
              Revisar link
            </>
          )}
        </button>
        {cargando && (
          <p role="status" className="text-center text-sm text-ink-soft">
            Estamos mirando el sitio. Puede tardar unos segundos.
          </p>
        )}
      </form>
      {datos && <TarjetaLink datos={datos} />}
    </section>
  );
}