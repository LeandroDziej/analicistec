import { test } from "node:test";
import assert from "node:assert/strict";
import { infoSemaforo, mensajeError, validarImagenCliente } from "../src/lib/ui.ts";

test("semáforo mapea veredicto a luz", () => {
  assert.equal(infoSemaforo("estafa").luz, "rojo");
  assert.equal(infoSemaforo("sospechoso").luz, "amarillo");
  assert.equal(infoSemaforo("seguro").luz, "verde");
});

test("validarImagenCliente rechaza vacías, pesadas y tipos raros", () => {
  assert.equal(validarImagenCliente({ size: 1000, type: "image/png" }), null);
  assert.equal(validarImagenCliente({ size: 1000, type: "" }), null);
  assert.match(validarImagenCliente({ size: 0, type: "image/png" })!, /vacía/);
  assert.match(validarImagenCliente({ size: 5 * 1024 * 1024, type: "image/jpeg" })!, /4 MB/);
  assert.match(validarImagenCliente({ size: 1000, type: "application/pdf" })!, /JPG/);
});

test("mensajeError usa el mensaje del servidor o uno amable", () => {
  assert.equal(mensajeError(400, { error: "Pegá un mensaje." }), "Pegá un mensaje.");
  assert.match(mensajeError(429, null), /Esperá un minuto/);
  assert.match(mensajeError(500, "x"), /Algo salió mal/);
});
