import { test } from "node:test";
import assert from "node:assert/strict";
import { autenticar, leerClientes, textoParaWhatsApp } from "../src/lib/apiClientes.ts";
import { claveMes, registrarUso, _resetMedidor } from "../src/lib/medidor.ts";
import { leerMarca, linkContacto, URL_APP_PUBLICA, VENTAS_POR_DEFECTO } from "../src/lib/marca.ts";

const CLAVE = "k_1234567890abcdef";

test("clientes de la API: nombre, clave y tope; ignora claves cortas", () => {
  const c = leerClientes(` demo:${CLAVE}:500 , corto:abc , sur:${CLAVE}x `);
  assert.deepEqual(c, [
    { nombre: "demo", clave: CLAVE, tope: 500 },
    { nombre: "sur", clave: `${CLAVE}x`, tope: null },
  ]);
  assert.deepEqual(leerClientes(undefined), []);
});

test("autenticar con Bearer o x-api-key; rechaza claves malas", () => {
  const clientes = leerClientes(`demo:${CLAVE}`);
  assert.equal(autenticar(new Headers({ authorization: `Bearer ${CLAVE}` }), clientes)?.nombre, "demo");
  assert.equal(autenticar(new Headers({ "x-api-key": CLAVE }), clientes)?.nombre, "demo");
  assert.equal(autenticar(new Headers({ authorization: `Bearer ${CLAVE}0` }), clientes), null);
  assert.equal(autenticar(new Headers(), clientes), null);
});

test("texto para WhatsApp: veredicto primero, pasos y aviso de banco y 911", () => {
  const t = textoParaWhatsApp(
    { veredicto: "estafa", score: 92, resumen_abuela: "Es estafa.\nNo pagues.", que_hacer: ["No abras el link.", "Bloqueá el número.", "Avisá a tu familia.", "Cuarto"] },
    "https://ejemplo.ar",
  );
  assert.match(t, /^🔴 \*Es una estafa\* \(riesgo 92\/100\)/);
  assert.match(t, /Es estafa\. No pagues\./);
  assert.equal((t.match(/^• /gm) ?? []).length, 3);
  assert.match(t, /911/);
  assert.match(t, /https:\/\/ejemplo\.ar$/);
  assert.doesNotMatch(textoParaWhatsApp({ veredicto: "seguro", score: 5, resumen_abuela: "ok", que_hacer: [] }), /911/);
});

test("medidor: cuenta por cliente y por mes (en memoria si no hay Upstash)", async () => {
  _resetMedidor();
  const fecha = new Date(Date.UTC(2026, 9, 24));
  assert.equal(claveMes("demo", fecha), "uso:demo:2026-10");
  assert.equal(await registrarUso("demo", { url: "", token: "", fecha }), 1);
  assert.equal(await registrarUso("demo", { url: "", token: "", fecha }), 2);
  assert.equal(await registrarUso("otro", { url: "", token: "", fecha }), 1);
});

test("medidor: usa Upstash si está configurado y no se cae si falla", async () => {
  _resetMedidor();
  let llamada = "";
  const ok = (async (url: string) => {
    llamada = url;
    return new Response(JSON.stringify({ result: 41 }));
  }) as unknown as typeof fetch;
  assert.equal(await registrarUso("demo", { url: "https://x.upstash.io/", token: "t", fetch: ok, fecha: new Date(Date.UTC(2026, 0, 5)) }), 41);
  assert.equal(llamada, "https://x.upstash.io/incr/uso%3Ademo%3A2026-01");
  const roto = (async () => {
    throw new Error("caído");
  }) as unknown as typeof fetch;
  assert.equal(await registrarUso("demo", { url: "https://x.upstash.io", token: "t", fetch: roto }), 1);
});

test("marca blanca: valores por defecto y de la empresa cliente", () => {
  assert.deepEqual(leerMarca({}), { empresa: null, logo: null, contacto: null, urlApp: URL_APP_PUBLICA, ventas: VENTAS_POR_DEFECTO });
  const m = leerMarca({
    NEXT_PUBLIC_MARCA_NOMBRE: " Seguridad Sur ",
    NEXT_PUBLIC_MARCA_LOGO: "https://sur.com.ar/logo.png",
    NEXT_PUBLIC_MARCA_CONTACTO: "+54 9 341 555-1234",
    NEXT_PUBLIC_URL_APP: "https://sur.antiestafa.ar/",
  });
  assert.equal(m.empresa, "Seguridad Sur");
  assert.equal(m.logo, "https://sur.com.ar/logo.png");
  assert.equal(m.contacto, "https://wa.me/5493415551234");
  assert.equal(m.urlApp, "https://sur.antiestafa.ar");
});

test("marca blanca: no acepta links inseguros", () => {
  assert.equal(leerMarca({ NEXT_PUBLIC_MARCA_LOGO: "javascript:alert(1)" }).logo, null);
  assert.equal(linkContacto("http://sitio.com"), null);
  assert.equal(linkContacto("https://sitio.com/contacto"), "https://sitio.com/contacto");
});
