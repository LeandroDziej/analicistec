export type RiesgoTransferencia = "bajo" | "medio" | "alto";
export type TipoDestino = "cbu" | "cvu" | "alias";

export interface AnalisisTransferencia {
  riesgo: RiesgoTransferencia;
  senales: string[];
  recomendacion: string;
}

export interface ValidacionDestino {
  valido: boolean;
  tipo?: TipoDestino;
  /** Destino normalizado (sin espacios ni guiones en CBU/CVU, alias en minúsculas). */
  normalizado?: string;
  error?: string;
}

export const MAX_MENSAJE_TRANSFERENCIA = 2000;

export const AVISO_TRANSFERIR =
  "Ningún chequeo puede asegurarte que una cuenta sea segura: antes de transferir confirmá con la persona por otro canal (llamala a su número de siempre) y revisá en tu app el nombre del titular que aparece.";

const PESOS_BLOQUE_1 = [7, 1, 3, 9, 7, 1, 3];
const PESOS_BLOQUE_2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3];

function digitoVerificador(digitos: number[], pesos: number[]): number {
  const suma = digitos.reduce((acc, d, i) => acc + d * pesos[i], 0);
  return (10 - (suma % 10)) % 10;
}

/** CBU/CVU: 22 dígitos; el dígito 8 verifica los primeros 7 y el 22 verifica los 13 anteriores del bloque de cuenta. */
export function cbuValido(valor: string): boolean {
  if (!/^\d{22}$/.test(valor)) return false;
  const d = [...valor].map(Number);
  return digitoVerificador(d.slice(0, 7), PESOS_BLOQUE_1) === d[7] && digitoVerificador(d.slice(8, 21), PESOS_BLOQUE_2) === d[21];
}

/** Alias: 6 a 20 caracteres, letras, números, punto y guion; debe tener al menos una letra. */
export function aliasValido(valor: string): boolean {
  return /^[a-z0-9.-]{6,20}$/i.test(valor) && /[a-z]/i.test(valor);
}

/** CVU: las billeteras virtuales usan entidades que arrancan con 000 (el 4.º dígito es 0 y el bloque 2 empieza con 000). */
export function esCvu(valor: string): boolean {
  return /^\d{22}$/.test(valor) && valor.slice(8, 11) === "000";
}

export function validarDestino(raw: string): ValidacionDestino {
  const limpio = raw.trim();
  if (!limpio) return { valido: false, error: "Pegá el alias, CBU o CVU al que te piden transferir." };
  const sinSeparadores = limpio.replace(/[\s-]/g, "");
  if (/^\d+$/.test(sinSeparadores)) {
    if (sinSeparadores.length !== 22) {
      return { valido: false, error: `El CBU/CVU tiene 22 dígitos y este tiene ${sinSeparadores.length}. Revisá que esté completo.` };
    }
    if (!cbuValido(sinSeparadores)) {
      return { valido: false, error: "Ese CBU/CVU no es válido (los dígitos verificadores no coinciden). Puede estar mal copiado o inventado." };
    }
    return { valido: true, tipo: esCvu(sinSeparadores) ? "cvu" : "cbu", normalizado: sinSeparadores };
  }
  if (!aliasValido(limpio)) {
    return {
      valido: false,
      error: "El alias debe tener entre 6 y 20 caracteres, con letras, números, puntos o guiones, sin espacios.",
    };
  }
  return { valido: true, tipo: "alias", normalizado: limpio.toLowerCase() };
}

export function etiquetaTransferencia(r: RiesgoTransferencia): { titulo: string; luz: "verde" | "amarillo" | "rojo" } {
  if (r === "alto") return { titulo: "Riesgo alto: no transfieras", luz: "rojo" };
  if (r === "medio") return { titulo: "Riesgo medio: verificá antes", luz: "amarillo" };
  return { titulo: "Riesgo bajo (igual verificá)", luz: "verde" };
}
