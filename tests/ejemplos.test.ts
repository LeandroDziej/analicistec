import { test } from "node:test";
import assert from "node:assert/strict";
import { EJEMPLOS } from "../src/lib/ejemplos.ts";

test("hay 5 ejemplos con ids únicos y texto no vacío", () => {
  assert.equal(EJEMPLOS.length, 5);
  assert.equal(new Set(EJEMPLOS.map((e) => e.id)).size, 5);
  for (const e of EJEMPLOS) {
    assert.ok(e.etiqueta.trim());
    assert.ok(e.texto.trim().length > 20);
    assert.ok(e.texto.length <= 5000);
  }
});

test("los dominios de los ejemplos son ficticios (.example)", () => {
  for (const e of EJEMPLOS) {
    const urls = e.texto.match(/https?:\/\/[^\s/]+/g) ?? [];
    for (const u of urls) assert.ok(new URL(u).hostname.endsWith(".example"), u);
  }
});
