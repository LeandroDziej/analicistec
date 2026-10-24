"use client";

import { useRef, useState } from "react";
import { generarDenuncia, htmlImprimible, type DatosDenuncia } from "@/lib/denuncia";

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
      <button
        type="button"
        onClick={() => setTexto(generarDenuncia(datos))}
        className="h-14 rounded-xl bg-zinc-800 text-lg font-bold text-white shadow transition hover:bg-zinc-900"
      >
        📄 Generar denuncia
      </button>
    );
  }

  const boton = "h-12 flex-1 rounded-xl border border-zinc-700 bg-white px-3 font-bold text-zinc-800 hover:bg-zinc-100";
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-zinc-300 bg-zinc-50 p-4">
      <h3 className="text-lg font-bold text-zinc-900">📄 Denuncia</h3>
      <textarea
        ref={area}
        readOnly
        value={texto}
        rows={14}
        aria-label="Texto de la denuncia"
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-xl border border-zinc-300 bg-white p-3 text-sm text-zinc-900"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copiar} className={boton}>
          {estado === "copiado" ? "¡Copiado! ✔" : "Copiar"}
        </button>
        <button type="button" onClick={descargar} className={boton}>
          Descargar .txt
        </button>
        <button type="button" onClick={imprimir} className={boton}>
          Imprimir / PDF
        </button>
      </div>
      <p aria-live="polite" className="text-sm text-zinc-700">
        {estado === "error" && "No pudimos copiar solo: mantené apretado el texto y elegí Copiar."}
      </p>
    </div>
  );
}
