import { test } from "node:test";
import assert from "node:assert/strict";
import { marcasImitadas, reglasDeMarca } from "../src/lib/marcaReal.ts";

test("reglasDeMarca devuelve 2 o 3 reglas para cada marca, sin URLs", () => {
  for (const m of ["Mercado Pago", "Mercado Libre", "ARCA", "AFIP", "Correo Argentino", "Banco Nación", "Ualá"]) {
    const { reglas } = reglasDeMarca(m);
    assert.ok(reglas.length >= 2 && reglas.length <= 3, m);
    for (const r of reglas) assert.doesNotMatch(r, /https?:|www\.|\.com|\.gob/i);
  }
});

test("los bancos comparten reglas genéricas y ARCA/AFIP las mismas", () => {
  assert.deepEqual(reglasDeMarca("Santander").reglas, reglasDeMarca("BBVA").reglas);
  assert.deepEqual(reglasDeMarca("AFIP").reglas, reglasDeMarca("ARCA").reglas);
});

test("marcasImitadas ignora links sin marca y no repite", () => {
  const links = [
    { marcaImitada: null },
    { marcaImitada: { marca: "AFIP", distancia: 1 } },
    { marcaImitada: { marca: "ARCA", distancia: 1 } },
    { marcaImitada: { marca: "Mercado Pago", distancia: 0 } },
  ];
  assert.deepEqual(marcasImitadas(links).map((m) => m.marca), ["AFIP", "Mercado Pago"]);
  assert.deepEqual(marcasImitadas([]), []);
});
