export type QrInterpretado =
  | { tipo: "url"; url: string }
  | { tipo: "pago"; comercio: string | null; ciudad: string | null; monto: string | null }
  | { tipo: "texto"; texto: string; esquema: string | null };

/** Lee campos TLV (2 dígitos de etiqueta + 2 de largo + valor), el formato de los QR de pago EMV. Devuelve null si el texto no cumple el formato. */
export function leerTlv(texto: string): Map<string, string> | null {
  const campos = new Map<string, string>();
  let i = 0;
  while (i < texto.length) {
    const tag = texto.slice(i, i + 2);
    const largoTxt = texto.slice(i + 2, i + 4);
    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(largoTxt)) return null;
    const largo = Number(largoTxt);
    const valor = texto.slice(i + 4, i + 4 + largo);
    if (valor.length !== largo) return null;
    if (!campos.has(tag)) campos.set(tag, valor);
    i += 4 + largo;
  }
  return campos;
}

const MONEDAS: Record<string, string> = { "032": "ARS", "840": "USD" };

export function formatoMonto(monto: string, codigoMoneda: string | undefined): string {
  const n = Number(monto);
  if (!Number.isFinite(n)) return monto;
  const moneda = MONEDAS[codigoMoneda ?? "032"] ?? "ARS";
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: moneda }).format(n);
}

/** Decide qué es lo que dice un QR: un link, un pago, u otra cosa. */
export function interpretarQr(crudo: string): QrInterpretado {
  const t = crudo.trim();
  if (/^https?:\/\//i.test(t)) return { tipo: "url", url: t };

  if (t.startsWith("000201")) {
    const campos = leerTlv(t);
    if (campos && (campos.has("59") || campos.has("58"))) {
      const monto = campos.get("54");
      return {
        tipo: "pago",
        comercio: campos.get("59") ?? null,
        ciudad: campos.get("60") ?? null,
        monto: monto ? formatoMonto(monto, campos.get("53")) : null,
      };
    }
  }

  if (/^(www\.)?[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)+(\/\S*)?$/i.test(t)) return { tipo: "url", url: `https://${t}` };

  const esquema = t.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase() ?? null;
  return { tipo: "texto", texto: t.slice(0, 500), esquema };
}