"use client";

import { useRef, useState } from "react";
import { generarDenuncia, htmlImprimible, type DatosDenuncia } from "@/lib/denuncia";
import { Icono } from "./Iconos";

export default function GenerarDenuncia({ datos }: { datos: DatosDenuncia }) {
  const [texto, setTexto] = useState<string | null>(null);
  const [estado, setEstado] = useState<"idle" | "copiado" | "error">("idle");
  const area = useRef<HTMLTextAreaElement>(null);

  async function copiar() {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setEstado("copiado");
    } catch {
      area.current?.select();
      setEstado("error");
    }
  }

  function descargar() {
    if (!texto) return;
    const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "denuncia-estafa.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  function imprimir() {
    if (!texto) return;
    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(htmlImprimible(texto));
    ventana.document.close();
    ventana.focus();
    ventana.print();
  }

  if (!texto) {
    return (
      <button type="button" onClick={() => setTexto(generarDenuncia(datos))} className="btn btn-secondary min-h-14 text-lg">
        <Icono nombre="documento" className="h-5 w-5" />
        Generar denuncia
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-3 p-5">
      <h3 className="titulo text-2xl text-ink">Denuncia</h3>
      <textarea
        ref={area}
        readOnly
        value={texto}
        rows={14}
        aria-label="Texto de la denuncia"
        onFocus={(e) => e.currentTarget.select()}
        className="field text-sm"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" onClick={copiar} className="btn btn-primary flex-1">
          {estado === "copiado" ? "¡Copiado!" : "Copiar"}
        </button>
        <button type="button" onClick={descargar} className="btn btn-secondary flex-1">
          Descargar .txt
        </button>
        <button type="button" onClick={imprimir} className="btn btn-secondary flex-1">
          Imprimir / PDF
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-ink-soft">
        {estado === "error" && "No pudimos copiar solo: mantené apretado el texto y elegí Copiar."}
      </p>
    </div>
  );
}