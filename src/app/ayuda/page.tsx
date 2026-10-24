import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { manualAHtml } from "@/lib/manual";
import Creditos from "@/components/Creditos";

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

const boton =
  "flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-center font-semibold";

export default async function Ayuda() {
  const html = await leerManual();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex flex-col gap-3">
        <Link href="/" className="w-fit font-semibold text-sky-800 hover:underline">
          ← Volver al detector
        </Link>
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          📘 ¿Cómo se usa <span className="text-sky-700">AntiEstafa AR</span>?
        </h1>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href="/docs/AntiEstafa-AR_Manual-de-usuario.pdf"
            download
            className={`${boton} bg-sky-700 text-white hover:bg-sky-800`}
          >
            ⬇️ Manual en PDF
          </a>
          <a
            href="/docs/AntiEstafa-AR_Documentacion-funcional.pdf"
            download
            className={`${boton} border border-sky-700 bg-white text-sky-800 hover:bg-sky-50`}
          >
            ⬇️ Documentación funcional
          </a>
        </div>
      </header>

      <article className="manual-ayuda" dangerouslySetInnerHTML={{ __html: html }} />

      <Link
        href="/"
        className={`${boton} bg-sky-700 text-white hover:bg-sky-800`}
      >
        🛡️ Ir a revisar un mensaje
      </Link>
      <footer className="text-center">
        <Creditos />
      </footer>
    </main>
  );
}
