export interface TramoDominio {
  texto: string;
  distinto: boolean;
}

/**
 * Compara el dominio sospechoso con el oficial y marca los caracteres que no coinciden
 * (subsecuencia común más larga sobre el nombre; el sufijo se compara aparte).
 * Ej: "mercadopag0.com" vs "mercadopago.com.ar" → marca el "0".
 */
export function resaltarDominio(sospechoso: string, oficial: string): TramoDominio[] {
  const a = sospechoso.toLowerCase();
  const b = oficial.toLowerCase();
  const corte = b.indexOf(".");
  const nombreOficial = corte === -1 ? b : b.slice(0, corte);
  const sufijoOficial = corte === -1 ? "" : b.slice(corte);

  // Sufijo del sospechoso: el último tramo ".xxx" (o ".xxx.yy" si coincide con el oficial).
  let inicioSufijo = a.lastIndexOf(".");
  if (sufijoOficial && a.endsWith(sufijoOficial)) inicioSufijo = a.length - sufijoOficial.length;
  const nombre = inicioSufijo === -1 ? a : a.slice(0, inicioSufijo);
  const sufijo = inicioSufijo === -1 ? "" : a.slice(inicioSufijo);

  const tramos = diffCaracteres(nombre, nombreOficial);
  if (sufijo) {
    const igual = sufijo === sufijoOficial || sufijoOficial.startsWith(sufijo);
    tramos.push({ texto: sufijo, distinto: !igual });
  }
  return tramos.reduce<TramoDominio[]>((acc, t) => {
    const ult = acc[acc.length - 1];
    if (ult && ult.distinto === t.distinto) ult.texto += t.texto;
    else acc.push({ ...t });
    return acc;
  }, []);
}

function diffCaracteres(a: string, b: string): TramoDominio[] {
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const tramos: TramoDominio[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length) {
    if (j < b.length && a[i] === b[j]) {
      tramos.push({ texto: a[i], distinto: false });
      i++;
      j++;
    } else if (j < b.length && lcs[i][j + 1] >= lcs[i + 1][j]) {
      j++;
    } else {
      tramos.push({ texto: a[i], distinto: true });
      i++;
    }
  }
  return tramos;
}

/** "se creó hace N días" en castellano rioplatense; null si no hay dato. */
export function textoAntiguedad(dias: number | null): string | null {
  if (dias === null) return null;
  if (dias === 0) return "se creó hoy";
  if (dias === 1) return "se creó hace 1 día";
  return `se creó hace ${dias} días`;
}
