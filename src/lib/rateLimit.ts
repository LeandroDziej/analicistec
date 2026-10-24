/**
 * Rate limit básico por IP, en memoria (ventana deslizante).
 * En Vercel cada instancia tiene su propio mapa: alcanza para frenar abusos simples
 * sin sumar dependencias ni infraestructura.
 */

export const LIMITE_POR_VENTANA = 8;
export const VENTANA_MS = 60_000;
const MAX_IPS = 5_000;

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  /** Segundos hasta que se libere un lugar (0 si está permitido). */
  reintentarEn: number;
}

export function crearLimitador(limite = LIMITE_POR_VENTANA, ventanaMs = VENTANA_MS) {
  const pedidos = new Map<string, number[]>();

  function limpiar(ahora: number) {
    for (const [ip, ts] of pedidos) {
      if (!ts.length || ahora - ts[ts.length - 1] >= ventanaMs) pedidos.delete(ip);
    }
    // Si sigue lleno (ataque con muchas IPs), descartar las más viejas.
    if (pedidos.size > MAX_IPS) {
      for (const ip of pedidos.keys()) {
        pedidos.delete(ip);
        if (pedidos.size <= MAX_IPS / 2) break;
      }
    }
  }

  return function verificar(ip: string, ahora = Date.now()): ResultadoLimite {
    if (pedidos.size > MAX_IPS) limpiar(ahora);
    const recientes = (pedidos.get(ip) ?? []).filter((t) => ahora - t < ventanaMs);
    if (recientes.length >= limite) {
      pedidos.set(ip, recientes);
      return { permitido: false, restantes: 0, reintentarEn: Math.max(1, Math.ceil((recientes[0] + ventanaMs - ahora) / 1000)) };
    }
    recientes.push(ahora);
    pedidos.delete(ip); // reinsertar para mantener orden por uso reciente
    pedidos.set(ip, recientes);
    return { permitido: true, restantes: limite - recientes.length, reintentarEn: 0 };
  };
}

/** IP del cliente según los headers del proxy (Vercel setea x-forwarded-for / x-real-ip). */
export function ipDe(headers: Headers): string {
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xff || headers.get("x-real-ip")?.trim() || "desconocida";
}
