import type { ResultadoLink } from "@/lib/links";
import { resaltarDominio, textoAntiguedad } from "@/lib/dominio";

export default function DominioResaltado({ link }: { link: Pick<ResultadoLink, "dominio" | "dominioOficial" | "antiguedadDias" | "marcaImitada"> }) {
  const tramos = link.dominioOficial ? resaltarDominio(link.dominio, link.dominioOficial) : [{ texto: link.dominio, distinto: false }];
  const antiguedad = textoAntiguedad(link.antiguedadDias);
  return (
    <div>
      <div className="font-mono text-base font-semibold text-ink">
        {tramos.map((t, i) =>
          t.distinto ? (
            <mark key={i} className="rounded bg-danger-200 px-0.5 font-extrabold text-danger-800">
              {t.texto}
            </mark>
          ) : (
            <span key={i}>{t.texto}</span>
          ),
        )}
      </div>
      {link.dominioOficial && link.marcaImitada && (
        <div className="mt-1 text-sm text-danger-800">
          Se parece a {link.marcaImitada.marca}, pero el oficial es <span className="font-mono font-semibold">{link.dominioOficial}</span>
        </div>
      )}
      {antiguedad && <div className="mt-1 text-sm font-medium text-ink-soft">{antiguedad}</div>}
    </div>
  );
}