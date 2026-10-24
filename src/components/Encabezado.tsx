import Link from "next/link";
import { Icono } from "./Iconos";
import { MARCA } from "@/lib/marca";

/**
 * Encabezado común. En la versión de marca blanca muestra a la empresa que ofrece el servicio
 * ("Un servicio de …") con su logo y su contacto.
 */
export default function Encabezado({ enlazarInicio = false }: { enlazarInicio?: boolean }) {
  const logo = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
        <Icono nombre="escudo" className="h-6 w-6" />
      </span>
      <span className="titulo text-2xl text-ink">
        AntiEstafa <span className="text-brand-700">AR</span>
      </span>
    </>
  );

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
        {enlazarInicio ? (
          <Link href="/" className="flex items-center gap-3" aria-label="Volver al detector">
            {logo}
          </Link>
        ) : (
          <span className="flex items-center gap-3">{logo}</span>
        )}
        {MARCA.empresa && (
          <span className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
            Un servicio de
            {MARCA.logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo externo de la empresa cliente
              <img src={MARCA.logo} alt={MARCA.empresa} className="h-8 w-auto max-w-40 object-contain" />
            ) : (
              <span className="font-bold text-ink">{MARCA.empresa}</span>
            )}
          </span>
        )}
      </div>
    </header>
  );
}
