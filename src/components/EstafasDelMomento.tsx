import { Icono } from "./Iconos";
import { MARCA } from "@/lib/marca";
import { fechaLegible, tendenciasOrdenadas, textoAvisoFamilia } from "@/lib/tendencias";
import { urlWhatsApp } from "@/lib/ui";

/** Pestaña "Del momento": las estafas que están circulando ahora, con su fuente y un botón para avisar a la familia. */
export default function EstafasDelMomento() {
  const lista = tendenciasOrdenadas();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-base text-ink-soft">Las estafas cambian todo el tiempo. Estas son las que están circulando ahora en Argentina.</p>
      <ul className="flex flex-col gap-4">
        {lista.map((t) => (
          <li key={t.id} className="card flex flex-col gap-3 p-5">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold uppercase tracking-wide text-warn-800">{fechaLegible(t.fecha)}</p>
              <h3 className="titulo text-xl text-ink">{t.titulo}</h3>
            </div>
            <p className="text-base text-ink-soft">{t.resumen}</p>
            <ul className="flex flex-wrap gap-2" aria-label="Señales de alerta">
              {t.senales.map((s) => (
                <li key={s} className="rounded-full border border-warn-200 bg-warn-50 px-3 py-1 text-sm font-semibold text-warn-800">
                  {s}
                </li>
              ))}
            </ul>
            <p className="flex gap-2 text-base text-ink">
              <Icono nombre="check" className="mt-0.5 h-5 w-5 text-safe-600" />
              <span>{t.consejo}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a href={urlWhatsApp(textoAvisoFamilia(t, MARCA.urlApp))} target="_blank" rel="noopener noreferrer" className="btn btn-secondary min-h-11 px-4 text-sm">
                <Icono nombre="enviar" className="h-4 w-4" />
                Avisar a mi familia
              </a>
              <a href={t.fuente.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-800 underline">
                Fuente: {t.fuente.nombre}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
