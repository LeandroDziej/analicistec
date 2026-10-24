import Link from "next/link";
import Analizador from "@/components/Analizador";
import DetectorComprobante from "@/components/DetectorComprobante";
import ChequeoTransferencia from "@/components/ChequeoTransferencia";
import BotonInstalar from "@/components/BotonInstalar";
import Creditos from "@/components/Creditos";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900">
          🛡️ AntiEstafa <span className="text-sky-700">AR</span>
        </h1>
        <p className="text-zinc-600">
          ¿Te llegó un mensaje raro por WhatsApp, SMS o mail? Pegalo o subí la captura y te decimos si huele a estafa.
        </p>
        <div className="mt-2 grid items-start gap-2 sm:grid-cols-2">
          <Link
            href="/ayuda"
            className="flex h-12 items-center justify-center rounded-xl border border-sky-700 bg-sky-700 font-semibold text-white hover:bg-sky-800"
          >
            📘 ¿Cómo se usa?
          </Link>
          <BotonInstalar />
        </div>
      </header>
      <Analizador />
      <DetectorComprobante />
      <ChequeoTransferencia />
      <footer className="mt-auto flex flex-col gap-2 pt-6 text-center text-xs text-zinc-500">
        <p>
          Gratis y sin registro. No guardamos tus mensajes. Ante la duda, llamá a tu banco por el número que figura en tu tarjeta.
        </p>
        <p>
          <Link href="/ayuda" className="font-semibold text-sky-800 underline">
            Manual de usuario
          </Link>
          {" · "}
          <a href="/docs/AntiEstafa-AR_Documentacion-funcional.pdf" download className="font-semibold text-sky-800 underline">
            Documentación funcional (PDF)
          </a>
        </p>
        <Creditos />
      </footer>
    </main>
  );
}
