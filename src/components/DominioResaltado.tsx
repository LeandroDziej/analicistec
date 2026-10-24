import type { ResultadoLink } from "@/lib/links";
import { resaltarDominio, textoAntiguedad } from "@/lib/dominio";

export default function DominioResaltado({ link }: { link: Pick<ResultadoLink, "dominio" | "dominioOficial" | "antiguedadDias" | "marcaImitada"> }) {
  const tramos = link.dominioOficial ? resaltarDominio(link.dominio, link.dominioOficial) : [{ texto: link.dominio, distinto: false }];
  const antiguedad = textoAntiguedad(link.antiguedadDias);
  return (
    <div>
      <div className="font-mono font-semibold text-zinc-900">
        {tramos.map((t, i) =>
          t.distinto ? (
            <mark key={i} className="rounded bg-red-200 px-0.5 font-extrabold text-red-900">
              {t.texto}
            </mark>
          ) : (
            <span key={i}>{t.texto}</span>
          ),
        )}
      </div>
      {link.dominioOficial && link.marcaImitada && (
        <div className="text-xs text-red-800">
          Se parece a {link.marcaImitada.marca}, pero el oficial es <span className="font-mono font-semibold">{link.dominioOficial}</span>
        </div>
      )}
      {antiguedad && <div className="text-xs font-medium text-zinc-700">{antiguedad}</div>}
    </div>
  );
}
