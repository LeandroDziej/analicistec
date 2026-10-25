import type { Metadata } from "next";
import Analizador from "@/components/Analizador";
import { Icono } from "@/components/Iconos";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = {
  title: "¿Es estafa? — AntiEstafa AR",
  robots: { index: false },
};

/** Versión compacta del detector para mostrar dentro de otras páginas (la abre /widget.js). */
export default function Widget() {
  return (
    <main className="flex min-h-full flex-col gap-4 bg-white p-4">
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Icono nombre="escudo" className="h-5 w-5 text-brand-700" />
        <span>
          <span className="font-bold text-ink">AntiEstafa AR</span>
          {MARCA.empresa ? ` · un servicio de ${MARCA.empresa}` : ""}
        </span>
        <a href={MARCA.urlApp} target="_blank" rel="noopener noreferrer" className="ml-auto font-semibold text-brand-800 underline">
          Abrir completa
        </a>
      </p>
      <Analizador />
    </main>
  );
}
