import Analizador from "@/components/Analizador";
import DetectorComprobante from "@/components/DetectorComprobante";
import ChequeoTransferencia from "@/components/ChequeoTransferencia";
import BotonInstalar from "@/components/BotonInstalar";

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
        <div className="mt-2">
          <BotonInstalar />
        </div>
      </header>
      <Analizador />
      <DetectorComprobante />
      <ChequeoTransferencia />
      <footer className="mt-auto pt-6 text-center text-xs text-zinc-500">
        Gratis y sin registro. No guardamos tus mensajes. Ante la duda, llamá a tu banco por el número que figura en tu tarjeta.
      </footer>
    </main>
  );
}
