import { test } from "node:test";
import assert from "node:assert/strict";
import { formatoFechaHora, generarDenuncia, htmlImprimible } from "../src/lib/denuncia.ts";

const fecha = new Date(2026, 2, 5, 9, 7);

test("formatoFechaHora rellena con ceros", () => {
  assert.equal(formatoFechaHora(fecha), "05/03/2026 09:07");
});

test("generarDenuncia incluye todas las secciones y datos", () => {
  const t = generarDenuncia(
    {
      veredicto: "estafa",
      score: 92,
      banderas: ["Dominio creado hace 3 días"],
      links: [{ url: "https://mercadopag0.example/pago" }, { url: "https://mercadopag0.example/pago" }],
      mensaje: "  Hola, ¿podés pasarme el código? Año nuevo, niño.  ",
    },
    fecha,
  );
  assert.match(t, /05\/03\/2026 09:07/);
  assert.match(t, /Hola, ¿podés pasarme el código\? Año nuevo, niño\./);
  assert.equal(t.split("https://mercadopag0.example/pago").length, 2);
  assert.match(t, /Dominio creado hace 3 días/);
  assert.match(t, /Veredicto: Estafa/);
  assert.match(t, /92\/100/);
  assert.match(t, /Dónde presentarla/);
  assert.match(t, /Fiscalía de cibercrimen de tu provincia/);
  assert.doesNotMatch(t, /https?:\/\/(?!mercadopag0)/);
});

test("generarDenuncia maneja mensaje, links y señales vacíos", () => {
  const t = generarDenuncia({ veredicto: "sospechoso", score: 50, banderas: [], links: [] }, fecha);
  assert.match(t, /captura de pantalla/);
  assert.match(t, /No se detectaron links/);
  assert.match(t, /No se detectaron señales/);
});

test("htmlImprimible escapa HTML", () => {
  const h = htmlImprimible('<script>alert("x")</script> & más');
  assert.doesNotMatch(h, /<script>/);
  assert.match(h, /&lt;script&gt;/);
  assert.match(h, /&amp; más/);
});
