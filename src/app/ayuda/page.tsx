import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { manualAHtml } from "@/lib/manual";
import Encabezado from "@/components/Encabezado";
import PiePagina from "@/components/PiePagina";
import AsistentePanda from "@/components/AsistentePanda";
import VideoDemo from "@/components/VideoDemo";

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
      <Encabezado enlazarInicio />

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

        <VideoDemo />

        <article className="manual-ayuda" dangerouslySetInnerHTML={{ __html: html }} />

        <Link href="/" className="btn btn-primary min-h-14 text-lg">
          Ir a revisar un mensaje
        </Link>
      </main>

      <PiePagina />

      <AsistentePanda />
    </>
  );
}
