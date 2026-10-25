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

test("un audio sin IA: lo transcribimos localmente y lo analiza el motor propio con reglas de voz", async () => {
  const r = await analizarConRespaldo(
    { audio: { mimeType: "audio/wav", base64: "AA==" } },
    falla(429),
    async () => "Hola, soy yo, se me rompió el celular y te habló desde este número nuevo. Necesito que me transiera 80.000 pesos ahora, es urgente.",
  );
  assert.equal(r.sinIA, true);
  assert.equal(r.modelo, "voz-propia+motor-propio");
  assert.equal(r.analisis.veredicto, "estafa");
  assert.match(r.analisis.transcripcion ?? "", /soy yo/);
  assert.ok(r.analisis.banderas.some((b) => /imitar con inteligencia artificial/.test(b)));
});

test("si no se entiende el audio, avisa qué hacer", async () => {
  await assert.rejects(
    analizarConRespaldo({ audio: { mimeType: "audio/ogg", base64: "AA==" } }, falla(429), async () => null),
    (e: GeminiError) => /No pudimos entender el audio/.test(e.mensajeUsuario) && e.status === 429,
  );
});
