import type { ResultadoLink } from "@/lib/links";
import { marcasImitadas } from "@/lib/marcaReal";

export default function AsiSeVeElReal({ links }: { links: Pick<ResultadoLink, "marcaImitada">[] }) {
  const marcas = marcasImitadas(links);
  if (marcas.length === 0) return null;
  return (
    <>
      {marcas.map((m) => (
        <section key={m.marca} aria-label={`Así se comunica ${m.marca} de verdad`} className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <h3 className="mb-2 text-lg font-bold text-brand-900">🔍 Así se ve el real: {m.marca}</h3>
          <ul className="flex flex-col gap-2 text-brand-900">
            {m.reglas.map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden>✔</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
