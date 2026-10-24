import { test } from "node:test";
import assert from "node:assert/strict";
import { indicePaso, pasosAnalisis } from "../src/lib/progreso.ts";

test("con links incluye el paso de links primero", () => {
  const pasos = pasosAnalisis("Entrá a https://mp-cobro.com ya");
  assert.equal(pasos.length, 3);
  assert.equal(pasos[0].texto, "Revisando links...");
});

test("sin links omite el paso de links", () => {
  const pasos = pasosAnalisis("Hola mamá, cambié de número");
  assert.deepEqual(pasos.map((p) => p.texto), ["Analizando el mensaje...", "Calculando el riesgo..."]);
});

test("indicePaso avanza con el tiempo y se queda en el último", () => {
  const pasos = pasosAnalisis("https://x.com");
  assert.equal(indicePaso(pasos, 0), 0);
  assert.equal(indicePaso(pasos, 2500), 1);
  assert.equal(indicePaso(pasos, 60000), 2);
});
