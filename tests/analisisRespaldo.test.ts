import { test } from "node:test";
import assert from "node:assert/strict";
import { analizarConRespaldo } from "../src/lib/analisisRespaldo.ts";
import { GeminiError } from "../src/lib/gemini.ts";

const falla = (status: number) => async () => {
  throw new GeminiError("x", status, "y");
};

test("si Gemini agotó la cuota, analiza igual con el motor propio", async () => {
  const r = await analizarConRespaldo({ texto: "Hola ma, cambié de número, transferime al alias x.y.z, no me llames" }, falla(429));
  assert.equal(r.sinIA, true);
  assert.equal(r.modelo, "motor-propio");
  assert.equal(r.analisis.veredicto, "estafa");
  assert.equal("reglas" in r.analisis, false);
});

test("si falta la clave de Gemini, también usa el motor propio", async () => {
  const r = await analizarConRespaldo({ texto: "Te confirmo el turno del martes." }, falla(500));
  assert.equal(r.sinIA, true);
});

test("con Gemini andando, usa la IA", async () => {
  const analisis = { veredicto: "seguro" as const, score: 5, banderas: [], que_hacer: ["Nada"], resumen_abuela: "a\nb" };
  const r = await analizarConRespaldo({ texto: "hola" }, async () => ({ analisis, modelo: "gemini-x" }));
  assert.deepEqual(r, { analisis, modelo: "gemini-x", sinIA: false });
});

test("una captura sola no se puede leer sin IA: devuelve el error", async () => {
  await assert.rejects(analizarConRespaldo({ imagen: { mimeType: "image/png", base64: "AA==" } }, falla(429)), GeminiError);
});

test("los errores que no son de Gemini no se tapan", async () => {
  await assert.rejects(analizarConRespaldo({ texto: "hola" }, async () => { throw new TypeError("bug"); }), TypeError);
});
