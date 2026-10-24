import { test } from "node:test";
import assert from "node:assert/strict";
import { leerContexto, textoContexto } from "../src/lib/preguntas.ts";
import { leerEntrada } from "../src/lib/entrada.ts";

test("leerContexto descarta lo que no es booleano o no se conoce", () => {
  assert.deepEqual(leerContexto({ pidenDatos: true, conoce: "si", otra: true }), { pidenDatos: true });
  assert.deepEqual(leerContexto('{"apuran":false}'), { apuran: false });
  assert.deepEqual(leerContexto("no es json"), {});
  assert.deepEqual(leerContexto(null), {});
});

test("textoContexto vacío si no se respondió nada", () => {
  assert.equal(textoContexto(undefined), "");
  assert.equal(textoContexto({}), "");
});

test("textoContexto incluye solo las respondidas", () => {
  const t = textoContexto({ pidenDatos: true, conoce: false });
  assert.match(t, /¿Te pidieron plata o datos\? Sí/);
  assert.match(t, /¿Conocés a quien te lo mandó\? No/);
  assert.doesNotMatch(t, /apuran/);
});

test("leerEntrada: sin contexto no agrega el campo", async () => {
  const form = new FormData();
  form.append("texto", "hola");
  const e = await leerEntrada(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
  assert.deepEqual(e, { texto: "hola" });
});

test("leerEntrada: contexto por multipart y JSON", async () => {
  const form = new FormData();
  form.append("texto", "hola");
  form.append("contexto", JSON.stringify({ apuran: true, basura: 1 }));
  const a = await leerEntrada(new Request("http://localhost/api/analyze", { method: "POST", body: form }));
  assert.deepEqual(a, { texto: "hola", contexto: { apuran: true } });
  const b = await leerEntrada(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ texto: "hola", contexto: { conoce: false } }),
      headers: { "content-type": "application/json" },
    }),
  );
  assert.deepEqual(b, { texto: "hola", contexto: { conoce: false } });
});
