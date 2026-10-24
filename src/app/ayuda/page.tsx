import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { manualAHtml } from "@/lib/manual";
import Creditos from "@/components/Creditos";
import { Icono } from "@/components/Iconos";
import AsistentePanda from "@/components/AsistentePanda";

export const metadata: Metadata = {
  title: "Cómo se usa — AntiEstafa AR",
  description: "Manual de usuario de AntiEstafa AR: cómo revisar un mensaje, entender el resultado, avisar a tu familia y hacer la denuncia.",
};

async function leerManual(): Promise<string> {
  "use cache";
  cacheLife("max");
  const md = await readFile(path.join(process.cwd(), "docs", "MANUAL_DE_USUARIO.md"), "utf8");
  return manualAHtml(md);
}

export default async function Ayuda() {
  const html = await leerManual();

  return (
    <>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver al detector">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
              <Icono nombre="escudo" className="h-6 w-6" />
            </span>
            <span className="titulo text-2xl text-ink">
              AntiEstafa <span className="text-brand-700">AR</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
        <section className="flex flex-col gap-4">
          <Link href="/" className="w-fit font-semibold text-brand-800 hover:underline">
            ← Volver al detector
          </Link>
          <h1 className="titulo text-4xl text-ink sm:text-5xl">¿Cómo se usa?</h1>
          <p className="text-lg text-ink-soft">
            Todo lo que podés hacer con AntiEstafa AR, paso a paso. También lo podés descargar en PDF.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <a href="/docs/AntiEstafa-AR_Manual-de-usuario.pdf" download className="btn btn-primary">
              ⬇️ Manual en PDF
            </a>
            <a href="/docs/AntiEstafa-AR_Documentacion-funcional.pdf" download className="btn btn-secondary">
              ⬇️ Documentación funcional
            </a>
          </div>
        </section>

        <article className="manual-ayuda" dangerouslySetInnerHTML={{ __html: html }} />

        <Link href="/" className="btn btn-primary min-h-14 text-lg">
          Ir a revisar un mensaje
        </Link>
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
          <Creditos />
        </div>
      </footer>

      <AsistentePanda />
    </>
  );
}
