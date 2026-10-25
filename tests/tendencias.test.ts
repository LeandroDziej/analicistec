import { test } from "node:test";
import assert from "node:assert/strict";
import { TENDENCIAS, fechaLegible, tendenciasOrdenadas, textoAvisoFamilia } from "../src/lib/tendencias.ts";

test("estafas del momento: datos completos, con fuente https y fecha válida", () => {
  const ids = new Set(TENDENCIAS.map((t) => t.id));
  assert.equal(ids.size, TENDENCIAS.length);
  for (const t of TENDENCIAS) {
    assert.match(t.fecha, /^\d{4}-(0[1-9]|1[0-2])$/);
    assert.match(t.fuente.url, /^https:\/\//);
    assert.ok(t.senales.length >= 2 && t.resumen.length > 40 && t.consejo.length > 20, t.id);
  }
});

test("estafas del momento: de la más nueva a la más vieja", () => {
  const orden = tendenciasOrdenadas([
    { ...TENDENCIAS[0], id: "a", fecha: "2026-03" },
    { ...TENDENCIAS[0], id: "b", fecha: "2026-10" },
    { ...TENDENCIAS[0], id: "c", fecha: "2026-10" },
  ]).map((t) => t.id);
  assert.deepEqual(orden, ["b", "c", "a"]);
});

test("fecha legible y aviso para la familia", () => {
  assert.equal(fechaLegible("2026-10"), "octubre de 2026");
  const aviso = textoAvisoFamilia(TENDENCIAS[0], "https://x.ar");
  assert.match(aviso, /^⚠️ Ojo con esta estafa: /);
  assert.match(aviso, /https:\/\/x\.ar$/);
});
