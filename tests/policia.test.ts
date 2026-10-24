import { test } from "node:test";
import assert from "node:assert/strict";
import { NUMERO_POLICIA, TEL_POLICIA, guionLlamada } from "../src/lib/policia.ts";

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
