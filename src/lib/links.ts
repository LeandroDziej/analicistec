import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import tls from "node:tls";
import { crearCacheTtl } from "./cacheTtl.ts";

export interface Marca {
  nombre: string;
  claves: string[];
  dominios: string[];
}

export const MARCAS: Marca[] = [
  { nombre: "Mercado Libre", claves: ["mercadolibre"], dominios: ["mercadolibre.com.ar", "mercadolibre.com"] },
  { nombre: "Mercado Pago", claves: ["mercadopago"], dominios: ["mercadopago.com.ar", "mercadopago.com"] },
  { nombre: "ARCA", claves: ["arca"], dominios: ["arca.gob.ar"] },
  { nombre: "AFIP", claves: ["afip"], dominios: ["afip.gob.ar", "arca.gob.ar"] },
  { nombre: "Correo Argentino", claves: ["correoargentino"], dominios: ["correoargentino.com.ar"] },
  { nombre: "Banco Nación", claves: ["bna", "banconacion"], dominios: ["bna.com.ar"] },
  { nombre: "Banco Provincia", claves: ["bancoprovincia"], dominios: ["bancoprovincia.com.ar"] },
  { nombre: "Banco Galicia", claves: ["bancogalicia"], dominios: ["bancogalicia.com", "galicia.ar"] },
  { nombre: "Santander", claves: ["santander"], dominios: ["santander.com.ar"] },
  { nombre: "BBVA", claves: ["bbva"], dominios: ["bbva.com.ar"] },
  { nombre: "Banco Macro", claves: ["bancomacro"], dominios: ["macro.com.ar"] },
  { nombre: "Banco Ciudad", claves: ["bancociudad"], dominios: ["bancociudad.com.ar"] },
  { nombre: "HSBC", claves: ["hsbc"], dominios: ["hsbc.com.ar"] },
  { nombre: "ICBC", claves: ["icbc"], dominios: ["icbc.com.ar"] },
  { nombre: "Brubank", claves: ["brubank"], dominios: ["brubank.com"] },
  { nombre: "Naranja X", claves: ["naranjax"], dominios: ["naranjax.com"] },
  { nombre: "Ualá", claves: ["uala"], dominios: ["uala.com.ar"] },
];

export interface ResultadoLink {
  url: string;
  dominio: string;
  bloqueado: boolean;
  antiguedadDias: number | null;
  fechaRegistro: string | null;
  ssl: boolean | null;
  redirecciones: string[];
  urlFinal: string | null;
  marcaImitada: { marca: string; distancia: number } | null;
  /** Dominio oficial de la marca imitada (para resaltar la diferencia en la UI). */
  dominioOficial?: string;
  senales: string[];
  error?: string;
}

export interface DepsLinks {
  fetch: typeof fetch;
  lookup: (host: string) => Promise<string[]>;
  chequearTls: (ip: string, host: string, timeoutMs: number) => Promise<boolean>;
  ahora: () => number;
}

const MAX_LINKS = 3;
const MAX_REDIRECCIONES = 5;
const TIMEOUT_FETCH_MS = 4_000;
const TIMEOUT_RDAP_MS = 4_000;
const CACHE_MS = 60 * 60 * 1000;

// RDAP y SSL por dominio: solo con las dependencias reales y solo se guardan datos obtenidos (no fallos).
const cacheRdap = crearCacheTtl<string>(CACHE_MS);
const cacheSsl = crearCacheTtl<boolean>(CACHE_MS);
export const _vaciarCachesLinks = () => {
  cacheRdap.clear();
  cacheSsl.clear();
};
const DOMINIO_NUEVO_DIAS = 90;
const USER_AGENT = "AntiEstafaAR/1.0 (+https://antiestafa-ar-2.vercel.app)";

// Segundo nivel compartidos (com.ar, gob.ar, etc.): el dominio registrable tiene 3 etiquetas.
const SLD_COMPARTIDOS = new Set(["com", "gob", "org", "net", "edu", "mil", "int", "tur", "gov", "co"]);

const TLDS_COMUNES =
  "com|ar|net|org|info|xyz|top|online|site|shop|store|app|io|co|me|link|click|live|vip|club|pro|biz|lat|tk|ml|ga|cf|gq|ly|us|cc|ws|es";
const RE_URL = new RegExp(
  `\\bhttps?:\\/\\/[^\\s<>"'()]+|\\b(?:www\\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+(?:${TLDS_COMUNES})\\b(?:\\/[^\\s<>"'()]*)?`,
  "gi",
);

export function extraerLinks(texto: string): string[] {
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const m of texto.matchAll(RE_URL)) {
    // Saltear mails (usuario@dominio): el match viene pegado a una arroba.
    if (texto[m.index - 1] === "@" || texto[m.index + m[0].length] === "@") continue;
    const crudo = m[0].replace(/[.,;:!?)\]]+$/, "");
    const conEsquema = /^https?:\/\//i.test(crudo) ? crudo : `http://${crudo}`;
    let url: URL;
    try {
      url = new URL(conEsquema);
    } catch {
      continue;
    }
    if (!url.hostname.includes(".") && isIP(url.hostname) === 0 && url.hostname !== "localhost") continue;
    const clave = url.href;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    salida.push(clave);
    if (salida.length >= MAX_LINKS) break;
  }
  return salida;
}

export function dominioRegistrable(hostname: string): string {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isIP(host.replace(/^\[|\]$/g, ""))) return host;
  const partes = host.split(".");
  if (partes.length <= 2) return host;
  const n = partes.length;
  const usarTres = SLD_COMPARTIDOS.has(partes[n - 2]) && partes[n - 1].length === 2;
  return partes.slice(usarTres ? -3 : -2).join(".");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + costo);
    }
    prev = cur;
  }
  return prev[b.length];
}

const HOMOGLIFOS: Record<string, string> = { "0": "o", "1": "l", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a" };

function desofuscar(s: string): string {
  return s.replace(/[0134578@]/g, (c) => HOMOGLIFOS[c] ?? c).replace(/rn/g, "m").replace(/vv/g, "w");
}

/** Detecta si el host imita una marca conocida sin ser su dominio oficial. */
export function detectarMarcaImitada(hostname: string): { marca: string; distancia: number } | null {
  const host = hostname.toLowerCase();
  const registrable = dominioRegistrable(host);
  const oficial = (m: Marca) => m.dominios.some((d) => registrable === d || host.endsWith(`.${d}`));
  if (MARCAS.some((m) => m.dominios.some((d) => registrable === d))) return null;

  const etiquetas = host.split(".").slice(0, -1).filter((e) => e !== "www" && e.length > 1);
  const candidatos = new Set<string>();
  for (const e of etiquetas) {
    candidatos.add(e);
    candidatos.add(e.replace(/-/g, ""));
    for (const t of e.split("-")) candidatos.add(t);
  }

  let mejor: { marca: string; distancia: number } | null = null;
  for (const marca of MARCAS) {
    if (oficial(marca)) continue;
    for (const clave of marca.claves) {
      for (const c of candidatos) {
        const limpio = desofuscar(c);
        let dist: number;
        if (c.includes(clave) || limpio.includes(clave)) {
          // Claves cortas (bna, arca, uala...) solo cuentan como etiqueta o token exacto.
          if (clave.length < 6 && c !== clave && limpio !== clave) continue;
          dist = c.includes(clave) ? 0 : 1;
        } else {
          if (clave.length < 6) continue;
          dist = Math.min(levenshtein(c, clave), levenshtein(limpio, clave));
          const tope = clave.length >= 10 ? 2 : 1;
          if (dist > tope) continue;
        }
        if (!mejor || dist < mejor.distancia) mejor = { marca: marca.nombre, distancia: dist };
      }
    }
  }
  return mejor;
}

export function esIpPrivada(ip: string): boolean {
  const limpia = ip.replace(/^\[|\]$/g, "").toLowerCase();
  const tipo = isIP(limpia);
  if (tipo === 4) {
    const [a, b] = limpia.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (tipo === 6) {
    if (limpia === "::" || limpia === "::1") return true;
    const mapeada = limpia.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapeada) return esIpPrivada(mapeada[1]);
    if (/^::ffff:[0-9a-f]{1,4}:[0-9a-f]{1,4}$/.test(limpia)) return true;
    return /^(fc|fd|fe[89ab]|ff)/.test(limpia) || limpia.startsWith("64:ff9b:") || limpia.startsWith("2001:db8");
  }
  return true;
}

function hostBloqueado(hostname: string): boolean {
  const h = hostname.toLowerCase().replace(/\.$/, "");
  return (
    h === "localhost" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    h.endsWith(".lan") ||
    h === "metadata.google.internal"
  );
}

/** Resuelve el host y devuelve una IP pública, o null si apunta a algo interno (anti-SSRF). */
export async function resolverSeguro(hostname: string, deps: Pick<DepsLinks, "lookup">): Promise<string | null> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (hostBloqueado(host)) return null;
  if (isIP(host)) return esIpPrivada(host) ? null : host;
  let ips: string[];
  try {
    ips = await deps.lookup(host);
  } catch {
    return null;
  }
  if (!ips.length || ips.some(esIpPrivada)) return null;
  return ips[0];
}

async function conTimeout<T>(ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fn(ctrl.signal);
  } finally {
    clearTimeout(timer);
  }
}

export async function consultarRdap(
  dominio: string,
  deps: Pick<DepsLinks, "fetch">,
): Promise<string | null> {
  try {
    return await conTimeout(TIMEOUT_RDAP_MS, async (signal) => {
      const res = await deps.fetch(`https://rdap.org/domain/${encodeURIComponent(dominio)}`, {
        headers: { "User-Agent": USER_AGENT, Accept: "application/rdap+json, application/json" },
        redirect: "follow",
        signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { events?: { eventAction?: string; eventDate?: string }[] };
      const reg = data.events?.find((e) => e.eventAction === "registration");
      return reg?.eventDate ?? null;
    });
  } catch {
    return null;
  }
}

interface Seguimiento {
  redirecciones: string[];
  urlFinal: string | null;
  bloqueado: boolean;
  error?: string;
}

/** Sigue redirecciones a mano, validando cada salto contra IPs privadas. */
export async function seguirRedirecciones(url: string, deps: Pick<DepsLinks, "fetch" | "lookup">): Promise<Seguimiento> {
  const redirecciones: string[] = [];
  let actual = url;
  for (let salto = 0; salto <= MAX_REDIRECCIONES; salto++) {
    let u: URL;
    try {
      u = new URL(actual);
    } catch {
      return { redirecciones, urlFinal: null, bloqueado: false, error: "URL inválida" };
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { redirecciones, urlFinal: actual, bloqueado: true, error: "Protocolo no permitido" };
    }
    if (!(await resolverSeguro(u.hostname, deps))) {
      return { redirecciones, urlFinal: actual, bloqueado: true, error: "Destino interno o inexistente" };
    }
    let res: Response;
    try {
      res = await conTimeout(TIMEOUT_FETCH_MS, (signal) =>
        deps.fetch(u.href, { method: "GET", redirect: "manual", signal, headers: { "User-Agent": USER_AGENT } }),
      );
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError" ? "Tiempo de espera agotado" : "No se pudo conectar";
      return { redirecciones, urlFinal: actual, bloqueado: false, error: msg };
    }
    res.body?.cancel().catch(() => {});
    const destino = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && destino) {
      actual = new URL(destino, u).href;
      redirecciones.push(actual);
      continue;
    }
    return { redirecciones, urlFinal: actual, bloqueado: false };
  }
  return { redirecciones, urlFinal: actual, bloqueado: false, error: "Demasiadas redirecciones" };
}

export const depsReales: DepsLinks = {
  fetch: (...args) => fetch(...args),
  lookup: async (host) => (await dnsLookup(host, { all: true })).map((r) => r.address),
  chequearTls: (ip, host, timeoutMs) =>
    new Promise((resolve) => {
      const socket = tls.connect({ host: ip, port: 443, servername: host, timeout: timeoutMs, rejectUnauthorized: false });
      const fin = (ok: boolean) => {
        socket.destroy();
        resolve(ok);
      };
      socket.once("secureConnect", () => fin(socket.authorized));
      socket.once("timeout", () => fin(false));
      socket.once("error", () => fin(false));
    }),
  ahora: () => Date.now(),
};

export async function verificarLink(url: string, deps: DepsLinks = depsReales): Promise<ResultadoLink> {
  const u = new URL(url);
  const dominio = dominioRegistrable(u.hostname);
  const base: ResultadoLink = {
    url,
    dominio,
    bloqueado: false,
    antiguedadDias: null,
    fechaRegistro: null,
    ssl: null,
    redirecciones: [],
    urlFinal: null,
    marcaImitada: null,
    senales: [],
  };

  const ip = await resolverSeguro(u.hostname, deps);
  if (!ip) {
    const interno = hostBloqueado(u.hostname) || isIP(u.hostname.replace(/^\[|\]$/g, "")) !== 0;
    return {
      ...base,
      bloqueado: interno,
      marcaImitada: detectarMarcaImitada(u.hostname),
      error: interno ? "Destino interno bloqueado" : "El dominio no existe o no responde",
      senales: interno ? ["Apunta a una dirección interna"] : ["El dominio no existe o no responde"],
    };
  }

  const esIp = isIP(u.hostname.replace(/^\[|\]$/g, "")) !== 0;
  const usarCache = deps === depsReales;
  const rdap = async () => {
    const guardado = usarCache ? cacheRdap.get(dominio) : undefined;
    if (guardado) return guardado;
    const fecha = await consultarRdap(dominio, deps);
    if (fecha && usarCache) cacheRdap.set(dominio, fecha);
    return fecha;
  };
  const tlsOk = async () => {
    const guardado = usarCache ? cacheSsl.get(u.hostname) : undefined;
    if (guardado !== undefined) return guardado;
    const ok = await deps.chequearTls(ip, u.hostname, TIMEOUT_FETCH_MS).catch(() => false);
    if (ok && usarCache) cacheSsl.set(u.hostname, ok);
    return ok;
  };
  const [fechaRegistro, ssl, seguimiento] = await Promise.all([
    esIp ? Promise.resolve(null) : rdap(),
    tlsOk(),
    seguirRedirecciones(url, deps),
  ]);

  let antiguedadDias: number | null = null;
  if (fechaRegistro) {
    const t = Date.parse(fechaRegistro);
    if (!Number.isNaN(t)) antiguedadDias = Math.max(0, Math.floor((deps.ahora() - t) / 86_400_000));
  }

  const marcas = [detectarMarcaImitada(u.hostname)];
  if (seguimiento.urlFinal) {
    try {
      marcas.push(detectarMarcaImitada(new URL(seguimiento.urlFinal).hostname));
    } catch {}
  }
  const marcaImitada = marcas.filter((m) => m !== null).sort((a, b) => a.distancia - b.distancia)[0] ?? null;

  const senales: string[] = [];
  if (esIp) senales.push("El link usa una IP en vez de un dominio");
  if (antiguedadDias !== null && antiguedadDias < DOMINIO_NUEVO_DIAS) {
    senales.push(`Dominio creado hace ${antiguedadDias} días`);
  }
  if (marcaImitada) senales.push(`El dominio imita a ${marcaImitada.marca}`);
  if (!ssl) senales.push("No tiene un certificado SSL válido");
  if (seguimiento.redirecciones.length >= 2) {
    senales.push(`Redirige ${seguimiento.redirecciones.length} veces`);
  }
  if (seguimiento.bloqueado) senales.push("Redirige a una dirección interna");

  return {
    ...base,
    antiguedadDias,
    fechaRegistro,
    ssl,
    redirecciones: seguimiento.redirecciones,
    urlFinal: seguimiento.urlFinal,
    bloqueado: seguimiento.bloqueado,
    marcaImitada,
    ...(marcaImitada ? { dominioOficial: MARCAS.find((m) => m.nombre === marcaImitada.marca)?.dominios[0] } : {}),
    senales,
    ...(seguimiento.error ? { error: seguimiento.error } : {}),
  };
}

export async function verificarLinks(texto: string, deps: DepsLinks = depsReales): Promise<ResultadoLink[]> {
  return Promise.all(extraerLinks(texto).map((url) => verificarLink(url, deps)));
}
