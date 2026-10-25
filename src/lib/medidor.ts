/**
 * Medidor de uso por cliente y por mes, para cobrar la clave paga y aplicar topes.
 * Usa Upstash Redis por su API REST (tiene plan gratuito) si están las variables
 * UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN. Sin ellas, cuenta en memoria
 * (sirve para probar, pero se reinicia con cada despliegue).
 */

export function claveMes(cliente: string, fecha = new Date()): string {
  const mes = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
  return `uso:${cliente}:${mes}`;
}

const enMemoria = new Map<string, number>();

type Fetch = typeof fetch;

/** Suma un análisis y devuelve el total del mes. Nunca tira error: si el medidor falla, el servicio sigue. */
export async function registrarUso(
  cliente: string,
  opts: { url?: string; token?: string; fetch?: Fetch; fecha?: Date } = {},
): Promise<number> {
  const clave = claveMes(cliente, opts.fecha);
  const url = (opts.url ?? process.env.UPSTASH_REDIS_REST_URL ?? "").replace(/\/$/, "");
  const token = opts.token ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  if (url && token) {
    try {
      const res = await (opts.fetch ?? fetch)(`${url}/incr/${encodeURIComponent(clave)}`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(2_000),
      });
      const cuerpo = (await res.json()) as { result?: unknown };
      if (res.ok && typeof cuerpo.result === "number") return cuerpo.result;
    } catch (err) {
      console.warn("[medidor] Upstash no respondió, cuento en memoria:", err);
    }
  }
  const total = (enMemoria.get(clave) ?? 0) + 1;
  enMemoria.set(clave, total);
  return total;
}

export const _resetMedidor = () => enMemoria.clear();
