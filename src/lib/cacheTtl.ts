/** Caché en memoria con vencimiento, para no repetir consultas lentas (RDAP, SSL) por dominio. */
export function crearCacheTtl<V>(ttlMs: number, max = 500, ahora: () => number = Date.now) {
  const mapa = new Map<string, { valor: V; vence: number }>();
  return {
    get(clave: string): V | undefined {
      const e = mapa.get(clave);
      if (!e) return undefined;
      if (e.vence <= ahora()) {
        mapa.delete(clave);
        return undefined;
      }
      return e.valor;
    },
    set(clave: string, valor: V) {
      if (mapa.size >= max) mapa.delete(mapa.keys().next().value as string);
      mapa.set(clave, { valor, vence: ahora() + ttlMs });
    },
    clear() {
      mapa.clear();
    },
  };
}
