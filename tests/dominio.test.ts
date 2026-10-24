import { test } from "node:test";
import assert from "node:assert/strict";
import { resaltarDominio, textoAntiguedad } from "../src/lib/dominio.ts";

test("resalta el 0 en mercadopag0", () => {
  const t = resaltarDominio("mercadopag0.com", "mercadopago.com.ar");
  assert.deepEqual(t.filter((x) => x.distinto).map((x) => x.texto), ["0"]);
  assert.equal(t.map((x) => x.texto).join(""), "mercadopag0.com");
});

test("resalta sufijos agregados", () => {
  const t = resaltarDominio("mercadopago-ayuda.xyz", "mercadopago.com.ar");
  const malos = t.filter((x) => x.distinto).map((x) => x.texto).join("");
  assert.match(malos, /ayuda/);
  assert.equal(t[0].distinto, false);
});

test("dominio idéntico no resalta nada", () => {
  assert.ok(resaltarDominio("arca.gob.ar", "arca.gob.ar").every((x) => !x.distinto));
});

test("textoAntiguedad", () => {
  assert.equal(textoAntiguedad(null), null);
  assert.equal(textoAntiguedad(0), "se creó hoy");
  assert.equal(textoAntiguedad(1), "se creó hace 1 día");
  assert.equal(textoAntiguedad(12), "se creó hace 12 días");
});
