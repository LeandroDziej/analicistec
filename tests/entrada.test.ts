import { test } from "node:test";
import assert from "node:assert/strict";
import { leerEntrada, detectarMimeImagen, EntradaError, MAX_IMAGEN_BYTES } from "../src/lib/entrada.ts";
import { analizarConGemini, _resetModeloRecordado, type ClienteGemini } from "../src/lib/gemini.ts";

// PNG mínimo de 1x1
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const PNG = new Uint8Array(Buffer.from(PNG_B64, "base64"));

const req = (body: BodyInit, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/analyze", { method: "POST", body, headers });

async function rechaza(p: Promise<unknown>, status: number) {
  await assert.rejects(p, (e: unknown) => e instanceof EntradaError && e.status === status);
}

test("detecta tipos de imagen por magic bytes", () => {
  assert.equal(detectarMimeImagen(PNG), "image/png");
  assert.equal(detectarMimeImagen(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(detectarMimeImagen(new Uint8Array(Buffer.from("RIFF\0\0\0\0WEBPVP8 "))), "image/webp");
  assert.equal(detectarMimeImagen(new Uint8Array(Buffer.from("<html>hola</html>"))), null);
});

test("JSON solo texto", async () => {
  const e = await leerEntrada(req(JSON.stringify({ texto: "  hola  " }), { "content-type": "application/json" }));
  assert.deepEqual(e, { texto: "hola" });
});

test("JSON con imagen en data URL", async () => {
  const e = await leerEntrada(
    req(JSON.stringify({ imagen: `data:image/png;base64,${PNG_B64}` }), { "content-type": "application/json" }),
  );
  assert.equal(e.imagen?.mimeType, "image/png");
  assert.equal(e.imagen?.base64, PNG_B64);
  assert.equal(e.texto, undefined);
});

test("multipart con imagen y texto", async () => {
  const fd = new FormData();
  fd.append("texto", "mirá esto");
  fd.append("imagen", new Blob([PNG], { type: "image/png" }), "captura.png");
  const e = await leerEntrada(req(fd));
  assert.equal(e.texto, "mirá esto");
  assert.equal(e.imagen?.mimeType, "image/png");
});

test("rechaza archivo que no es imagen aunque diga image/png", async () => {
  const fd = new FormData();
  fd.append("imagen", new Blob(["#!/bin/sh echo hola"], { type: "image/png" }), "x.png");
  await rechaza(leerEntrada(req(fd)), 415);
});

test("rechaza imagen de más de 4 MB", async () => {
  const grande = new Uint8Array(MAX_IMAGEN_BYTES + 10);
  grande.set(PNG.subarray(0, 8));
  const fd = new FormData();
  fd.append("imagen", new Blob([grande], { type: "image/png" }), "g.png");
  await rechaza(leerEntrada(req(fd)), 413);
  await rechaza(
    leerEntrada(req(JSON.stringify({ imagen: Buffer.from(grande).toString("base64") }), { "content-type": "application/json" })),
    413,
  );
});

test("rechaza vacío, JSON roto y texto largo", async () => {
  await rechaza(leerEntrada(req(JSON.stringify({}), { "content-type": "application/json" })), 400);
  await rechaza(leerEntrada(req("{no", { "content-type": "application/json" })), 400);
  await rechaza(leerEntrada(req(JSON.stringify({ texto: "a".repeat(5001) }), { "content-type": "application/json" })), 413);
  await rechaza(leerEntrada(req(JSON.stringify({ imagen: "%%%" }), { "content-type": "application/json" })), 400);
});

test("la imagen llega a Gemini como inlineData con prompt de captura", async () => {
  _resetModeloRecordado();
  let enviado: unknown;
  const cliente: ClienteGemini = {
    models: {
      async generateContent({ contents }) {
        enviado = contents;
        return {
          text: JSON.stringify({ veredicto: "estafa", score: 90, banderas: [], que_hacer: [], resumen_abuela: "x" }),
        };
      },
      async list() {
        return (async function* () {})();
      },
    },
  };
  const { analisis } = await analizarConGemini({ imagen: { mimeType: "image/png", base64: PNG_B64 } }, { cliente });
  assert.equal(analisis.veredicto, "estafa");
  const parts = (enviado as { parts: Record<string, unknown>[] }[])[0].parts;
  assert.deepEqual(parts[0], { inlineData: { mimeType: "image/png", data: PNG_B64 } });
  assert.match(String(parts[1].text), /captura/);
});
