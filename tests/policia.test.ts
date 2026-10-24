import { test } from "node:test";
import assert from "node:assert/strict";
import { NUMERO_POLICIA, TEL_POLICIA, guionLlamada, puedeLlamarPorTelefono } from "../src/lib/policia.ts";

test("el botón llama al 911", () => {
  assert.equal(NUMERO_POLICIA, "911");
  assert.equal(TEL_POLICIA, "tel:911");
});

test("guion con los datos del análisis: mensaje, dominio y señales", () => {
  const g = guionLlamada(
    {
      veredicto: "estafa",
      score: 92,
      banderas: ["Imita a Mercado Pago.", "Te apura", "Tercera señal"],
      links: [{ url: "http://mercadopag0-seguridad.xyz/validar" }, { url: "https://mercadopag0-seguridad.xyz/otra" }],
      mensaje: "Mercado Pago: tu cuenta fue BLOQUEADA.",
    },
    new Date(2026, 9, 24, 14, 30),
  );
  const todo = g.join(" ");
  assert.match(g[0], /denunciar/);
  assert.match(todo, /tu cuenta fue BLOQUEADA/);
  assert.match(todo, /este link: mercadopag0-seguridad\.xyz\./);
  assert.match(todo, /Imita a Mercado Pago; Te apura\./);
  assert.doesNotMatch(todo, /Tercera señal/);
});

test("sin datos, guion genérico para completar", () => {
  const g = guionLlamada();
  assert.ok(g.length >= 4);
  assert.match(g.join(" "), /quiero denunciar una estafa virtual/);
});

test("solo se usa tel: en celulares y tablets; en la compu no (lo abriría Zoom o Teams)", () => {
  const android = "Mozilla/5.0 (Linux; Android 14; SM-A145M) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
  const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
  const windows = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
  const mac = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
  const linux = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";
  assert.equal(puedeLlamarPorTelefono(android), true);
  assert.equal(puedeLlamarPorTelefono(iphone), true);
  assert.equal(puedeLlamarPorTelefono(mac, 5), true); // iPad que se presenta como Mac
  assert.equal(puedeLlamarPorTelefono(windows), false);
  assert.equal(puedeLlamarPorTelefono(windows, 10), false); // notebook con pantalla táctil
  assert.equal(puedeLlamarPorTelefono(mac), false);
  assert.equal(puedeLlamarPorTelefono(linux), false);
});
