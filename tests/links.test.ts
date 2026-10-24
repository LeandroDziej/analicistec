import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extraerLinks,
  dominioRegistrable,
  levenshtein,
  detectarMarcaImitada,
  esIpPrivada,
  resolverSeguro,
  seguirRedirecciones,
  consultarRdap,
  verificarLink,
  verificarLinks,
  type DepsLinks,
} from "../src/lib/links.ts";

const AHORA = Date.parse("2026-10-24T00:00:00Z");

function deps(over: Partial<DepsLinks> & { rutas?: Record<string, Response | (() => Response)>; dns?: Record<string, string[]> } = {}) {
  const pedidos: { url: string; init?: RequestInit }[] = [];
  const dns = over.dns ?? {};
  const rutas = over.rutas ?? {};
  const d: DepsLinks = {
    fetch: (async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      pedidos.push({ url, init });
      const r = rutas[url];
      if (!r) return new Response("ok", { status: 200 });
      return typeof r === "function" ? r() : r.clone();
    }) as typeof fetch,
    lookup: async (host) => {
      if (dns[host]) return dns[host];
      throw new Error("ENOTFOUND");
    },
    chequearTls: async () => true,
    ahora: () => AHORA,
    ...over,
  };
  return { d, pedidos };
}

const rdap = (fecha: string) =>
  new Response(JSON.stringify({ events: [{ eventAction: "registration", eventDate: fecha }] }), { status: 200 });

test("extraerLinks: con y sin esquema, sin duplicados ni puntuación final", () => {
  const links = extraerLinks(
    "Entrá a https://mercadopag0-validar.com/login, o a www.arca-pagos.xyz. Escribime a juan@gmail.com. Repito: https://mercadopag0-validar.com/login",
  );
  assert.deepEqual(links, ["https://mercadopag0-validar.com/login", "http://www.arca-pagos.xyz/"]);
});

test("extraerLinks: máximo 3 y nada si no hay links", () => {
  assert.deepEqual(extraerLinks("hola mamá, cambié de número"), []);
  const muchos = Array.from({ length: 8 }, (_, i) => `https://sitio${i}.com`).join(" ");
  assert.equal(extraerLinks(muchos).length, 3);
});

test("dominioRegistrable maneja com.ar y gob.ar", () => {
  assert.equal(dominioRegistrable("www.mercadopago.com.ar"), "mercadopago.com.ar");
  assert.equal(dominioRegistrable("servicios.arca.gob.ar"), "arca.gob.ar");
  assert.equal(dominioRegistrable("login.mp-seguro.xyz"), "mp-seguro.xyz");
  assert.equal(dominioRegistrable("bit.ly"), "bit.ly");
});

test("levenshtein", () => {
  assert.equal(levenshtein("mercadopago", "mercadopago"), 0);
  assert.equal(levenshtein("mercadopag0", "mercadopago"), 1);
  assert.equal(levenshtein("kitten", "sitting"), 3);
  assert.equal(levenshtein("", "abc"), 3);
});

test("detectarMarcaImitada: oficiales no, imitaciones sí", () => {
  assert.equal(detectarMarcaImitada("www.mercadopago.com.ar"), null);
  assert.equal(detectarMarcaImitada("servicios.arca.gob.ar"), null);
  assert.equal(detectarMarcaImitada("www.correoargentino.com.ar"), null);
  assert.equal(detectarMarcaImitada("google.com"), null);
  assert.equal(detectarMarcaImitada("marcadolibre.org")?.marca, "Mercado Libre");

  assert.deepEqual(detectarMarcaImitada("mercadopago-validar.com"), { marca: "Mercado Pago", distancia: 0 });
  assert.equal(detectarMarcaImitada("mercadopag0.com")?.marca, "Mercado Pago");
  assert.equal(detectarMarcaImitada("mercadolibre.com.ar.envios-ya.xyz")?.marca, "Mercado Libre");
  assert.equal(detectarMarcaImitada("correoargentlno.com")?.marca, "Correo Argentino");
  assert.equal(detectarMarcaImitada("arca-pagos.xyz")?.marca, "ARCA");
  assert.equal(detectarMarcaImitada("afip.gob-ar.online")?.marca, "AFIP");
  assert.equal(detectarMarcaImitada("santandr.com")?.marca, "Santander");
  assert.equal(detectarMarcaImitada("bna-homebanking.com")?.marca, "Banco Nación");
  // Claves cortas no matchean adentro de otras palabras.
  assert.equal(detectarMarcaImitada("barcaza.com"), null);
});

test("esIpPrivada", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.20.1.1", "169.254.169.254", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:127.0.0.1", "100.64.0.1"]) {
    assert.equal(esIpPrivada(ip), true, ip);
  }
  for (const ip of ["8.8.8.8", "200.45.1.1", "2800:3f0:4002::200e", "::ffff:8.8.8.8"]) {
    assert.equal(esIpPrivada(ip), false, ip);
  }
});

test("resolverSeguro bloquea localhost, IPs privadas y DNS que apunta adentro", async () => {
  const { d } = deps({ dns: { "rebind.com": ["8.8.8.8", "127.0.0.1"], "ok.com": ["8.8.8.8"] } });
  assert.equal(await resolverSeguro("localhost", d), null);
  assert.equal(await resolverSeguro("192.168.1.1", d), null);
  assert.equal(await resolverSeguro("[::1]", d), null);
  assert.equal(await resolverSeguro("rebind.com", d), null);
  assert.equal(await resolverSeguro("noexiste.com", d), null);
  assert.equal(await resolverSeguro("ok.com", d), "8.8.8.8");
});

test("seguirRedirecciones corta si un salto apunta a una IP interna", async () => {
  const { d, pedidos } = deps({
    dns: { "corto.ly": ["1.1.1.1"] },
    rutas: { "https://corto.ly/x": new Response(null, { status: 302, headers: { location: "http://169.254.169.254/latest" } }) },
  });
  const r = await seguirRedirecciones("https://corto.ly/x", d);
  assert.equal(r.bloqueado, true);
  assert.deepEqual(r.redirecciones, ["http://169.254.169.254/latest"]);
  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].init?.redirect, "manual");
});

test("seguirRedirecciones registra la cadena y para en el máximo", async () => {
  const rutas: Record<string, Response> = {};
  for (let i = 0; i < 10; i++) {
    rutas[`https://a.com/${i}`] = new Response(null, { status: 301, headers: { location: `/${i + 1}` } });
  }
  const { d } = deps({ dns: { "a.com": ["1.1.1.1"] }, rutas });
  const r = await seguirRedirecciones("https://a.com/0", d);
  assert.equal(r.error, "Demasiadas redirecciones");
  assert.equal(r.redirecciones.length, 6);
});

test("seguirRedirecciones aplica timeout", async () => {
  const { d } = deps({
    dns: { "lento.com": ["1.1.1.1"] },
    fetch: ((_u: string, init?: RequestInit) =>
      new Promise((_r, rej) => init?.signal?.addEventListener("abort", () => rej(Object.assign(new Error("abort"), { name: "AbortError" }))))) as typeof fetch,
  });
  const t0 = Date.now();
  const r = await seguirRedirecciones("https://lento.com", d);
  assert.equal(r.error, "Tiempo de espera agotado");
  assert.ok(Date.now() - t0 < 7000);
});

test("consultarRdap manda User-Agent y lee la fecha de registro", async () => {
  const { d, pedidos } = deps({ rutas: { "https://rdap.org/domain/estafa.xyz": rdap("2026-10-10T00:00:00Z") } });
  assert.equal(await consultarRdap("estafa.xyz", d), "2026-10-10T00:00:00Z");
  const headers = pedidos[0].init?.headers as Record<string, string>;
  assert.ok(headers["User-Agent"]);
  const { d: d404 } = deps({ rutas: { "https://rdap.org/domain/x.com": new Response("", { status: 404 }) } });
  assert.equal(await consultarRdap("x.com", d404), null);
});

test("verificarLink: dominio nuevo que imita a Mercado Pago, sin SSL", async () => {
  const { d } = deps({
    dns: { "mercadopago-validar.com": ["45.1.1.1"] },
    rutas: { "https://rdap.org/domain/mercadopago-validar.com": rdap("2026-10-14T00:00:00Z") },
    chequearTls: async () => false,
  });
  const r = await verificarLink("http://mercadopago-validar.com/", d);
  assert.equal(r.antiguedadDias, 10);
  assert.equal(r.ssl, false);
  assert.equal(r.marcaImitada?.marca, "Mercado Pago");
  assert.ok(r.senales.some((s) => s.includes("10 días")));
  assert.ok(r.senales.some((s) => s.includes("Mercado Pago")));
  assert.ok(r.senales.some((s) => s.includes("SSL")));
});

test("verificarLink: sitio oficial viejo no genera señales", async () => {
  const { d } = deps({
    dns: { "www.mercadopago.com.ar": ["200.1.1.1"] },
    rutas: { "https://rdap.org/domain/mercadopago.com.ar": rdap("2003-05-01T00:00:00Z") },
  });
  const r = await verificarLink("https://www.mercadopago.com.ar/", d);
  assert.equal(r.marcaImitada, null);
  assert.equal(r.ssl, true);
  assert.ok(r.antiguedadDias! > 8000);
  assert.deepEqual(r.senales, []);
});

test("verificarLink: localhost queda bloqueado sin hacer fetch", async () => {
  const { d, pedidos } = deps();
  const r = await verificarLink("http://localhost:3000/admin", d);
  assert.equal(r.bloqueado, true);
  assert.equal(pedidos.length, 0);
});

test("verificarLinks: analiza todos los links del texto", async () => {
  const { d } = deps({ dns: { "a.com": ["1.1.1.1"], "b.com": ["1.1.1.2"] } });
  const r = await verificarLinks("mirá https://a.com y https://b.com", d);
  assert.deepEqual(r.map((x) => x.dominio), ["a.com", "b.com"]);
});
