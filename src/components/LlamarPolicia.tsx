"use client";

import { useState } from "react";
import { generarDenuncia, type DatosDenuncia } from "@/lib/denuncia";
import { NUMERO_POLICIA, TEL_POLICIA, guionLlamada } from "@/lib/policia";

/**
 * Botón rápido al 911. En un solo toque copia la denuncia (si la hay), muestra qué decir
 * y abre el marcador del teléfono con el 911 listo. La llamada no puede llevar el texto,
 * por eso el guion queda en pantalla para leerlo cuando atienden.
 */
export default function LlamarPolicia({ datos }: { datos?: DatosDenuncia }) {
  const [guion, setGuion] = useState<string[] | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function preparar() {
    // El guion se arma al tocar (lleva la fecha y hora de ese momento).
    setGuion(guionLlamada(datos));
    if (!datos) return;
    try {
      await navigator.clipboard.writeText(generarDenuncia(datos));
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <a
        href={TEL_POLICIA}
        onClick={preparar}
        className="btn min-h-16 flex-col gap-0.5 border-danger-600 bg-danger-600 text-white hover:border-danger-800 hover:bg-danger-800"
      >
        <span className="text-lg">📞 Llamar al {NUMERO_POLICIA} · Policía</span>
        <span className="text-sm font-semibold text-white/90">Te dejamos listo lo que tenés que decir</span>
      </a>

      {guion && (
        <div role="region" aria-live="polite" aria-label="Qué decir en la llamada" className="aparecer card flex flex-col gap-3 border-danger-200 p-5">
          <p className="font-bold text-ink">Cuando te atiendan, leé esto:</p>
          <ol className="flex list-decimal flex-col gap-2 pl-5 text-lg text-ink">
            {guion.map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ol>
          {datos && (
            <p className="text-sm text-ink-soft">
              {copiado
                ? "La denuncia completa quedó copiada: si te piden mandarla por WhatsApp o mail, pegala."
                : "Si te piden la denuncia por escrito, generala más arriba y copiala."}
            </p>
          )}
          <p className="text-sm text-ink-soft">
            ¿Estás en la compu? Marcá {NUMERO_POLICIA} desde tu celular. Si perdiste plata, llamá también a tu banco al número que figura atrás de tu tarjeta.
          </p>
          <a href={TEL_POLICIA} className="btn btn-secondary">
            Volver a llamar al {NUMERO_POLICIA}
          </a>
        </div>
      )}
    </div>
  );
}
