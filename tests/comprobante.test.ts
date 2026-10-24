import { test } from "node:test";
import assert from "node:assert/strict";
import { analizarComprobante, leerComprobante, parsearComprobante, validarComprobante } from "../src/lib/comprobante.ts";
import { EntradaError, MAX_IMAGEN_BYTES } from "../src/lib/entrada.ts";
import { GeminiError, type ClienteGemini } from "../src/lib/gemini.ts";

const PNG = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));

const rechaza = (fn: () => unknown, status: number) =>
  assert.throws(fn, (e: unknown) => e instanceof EntradaError && e.status === status);

test("acepta PNG y rechaza vacío, GIF, HTML y >4 MB", () => {
  assert.equal(validarComprobante(PNG).mimeType, "image/png");
  rechaza(() => validarComprobante(new Uint8Array()), 400);
  rechaza(() => validarComprobante(new Uint8Array(Buffer.from("GIF89a....."))), 415);
  rechaza(() => validarComprobante(new Uint8Array(Buffer.from("<html></html>"))), 415);
  const grande = new Uint8Array(MAX_IMAGEN_BYTES + 1);
  grande.set([0x89, 0x50, 0x4e, 0x47]);
  rechaza(() => validarComprobante(grande), 413);
});

test("leerComprobante pide multipart con imagen", async () => {
  const sinForm = new Request("http://x/api/comprobante", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
  await assert.rejects(leerComprobante(sinForm), EntradaError);
  const form = new FormData();
  form.append("imagen", new Blob([PNG], { type: "image/png" }), "c.png");
  const ok = await leerComprobante(new Request("http://x/api/comprobante", { method: "POST", body: form }));
  assert.equal(ok.mimeType, "image/png");
  await assert.rejects(leerComprobante(new Request("http://x/api/comprobante", { method: "POST", body: new FormData() })), EntradaError);
});

test("parsearComprobante valida y siempre manda a verificar en la app", () => {
  const r = parsearComprobante(JSON.stringify({ veredicto: "parece_real", senales: [" ok ", ""], recomendacion: "Todo bien." }));
  assert.deepEqual(r.senales, ["ok"]);
  assert.match(r.recomendacion, /app de tu banco/);
  const r2 = parsearComprobante(JSON.stringify({ veredicto: "sospechoso", senales: [], recomendacion: "Mirá la app del banco." }));
  assert.equal(r2.recomendacion, "Mirá la app del banco.");
  assert.throws(() => parsearComprobante("no json"), GeminiError);
  assert.throws(() => parsearComprobante(JSON.stringify({ veredicto: "seguro" })), GeminiError);
});

test("analizarComprobante usa el cliente y mapea 429", async () => {
  const ok = { models: { generateContent: async () => ({ text: JSON.stringify({ veredicto: "probablemente_falso", senales: ["Fuente rara"], recomendacion: "No entregues." }) }) } } as unknown as ClienteGemini;
  assert.equal((await analizarComprobante({ mimeType: "image/png", base64: "x" }, { cliente: ok })).veredicto, "probablemente_falso");
  const limite = { models: { generateContent: async () => { throw Object.assign(new Error("x"), { status: 429 }); } } } as unknown as ClienteGemini;
  await assert.rejects(analizarComprobante({ mimeType: "image/png", base64: "x" }, { cliente: limite }), (e: unknown) => e instanceof GeminiError && e.status === 429);
});
