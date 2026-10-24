import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_HISTORIAL_PANDA,
  MAX_PREGUNTA,
  SYSTEM_PROMPT_PANDA,
  construirConversacion,
  limpiarRespuestaPanda,
  responderPanda,
  validarEntradaPanda,
} from "../src/lib/asistente.ts";
import { EntradaError } from "../src/lib/entrada.ts";
import { GeminiError, type ClienteGemini } from "../src/lib/gemini.ts";

test("valida la pregunta: vacía, muy larga y historial acotado", () => {
  assert.throws(() => validarEntradaPanda({ pregunta: "   " }), EntradaError);
  assert.throws(() => validarEntradaPanda({ pregunta: "a".repeat(MAX_PREGUNTA + 1) }), EntradaError);
  assert.throws(() => validarEntradaPanda(null), EntradaError);
  const historial = Array.from({ length: 20 }, (_, i) => ({ rol: i % 2 ? "panda" : "usuario", texto: `m${i}` }));
  const r = validarEntradaPanda({ pregunta: " ¿Qué hago? ", historial: [...historial, { rol: "otro", texto: "x" }, "basura"] });
  assert.equal(r.pregunta, "¿Qué hago?");
  assert.equal(r.historial.length, MAX_HISTORIAL_PANDA);
  assert.equal(r.historial.at(-1)?.texto, "m19");
});

test("arma la conversación con los roles de Gemini", () => {
  const c = construirConversacion("¿Y ahora?", [
    { rol: "usuario", texto: "Hola" },
    { rol: "panda", texto: "¡Hola!" },
  ]);
  assert.deepEqual(
    c.map((m) => m.role),
    ["user", "model", "user"],
  );
  assert.equal(c.at(-1)?.parts[0].text, "¿Y ahora?");
});

test("limpia negritas y títulos de Markdown y no acepta respuestas vacías", () => {
  assert.equal(limpiarRespuestaPanda("## Ojo\n**No** pases el código.\n* Llamá al banco"), "Ojo\nNo pases el código.\n- Llamá al banco");
  assert.throws(() => limpiarRespuestaPanda("   "), GeminiError);
});

test("el prompt solo permite el 911 como teléfono y prohíbe pedir datos", () => {
  assert.match(SYSTEM_PROMPT_PANDA, /911/);
  assert.match(SYSTEM_PROMPT_PANDA, /Nunca pidas/);
  assert.match(SYSTEM_PROMPT_PANDA, /No inventes teléfonos/);
});

function clienteFalso(respuesta: () => Promise<{ text?: string }>): ClienteGemini {
  return {
    models: {
      generateContent: respuesta,
      list: async () => (async function* () {})(),
    },
  };
}

test("responde con el texto del modelo y traduce un 429 a un mensaje amable", async () => {
  const ok = await responderPanda({ pregunta: "Hola", historial: [] }, { cliente: clienteFalso(async () => ({ text: "**Hola**, soy Pandi." })) });
  assert.equal(ok.respuesta, "Hola, soy Pandi.");
  await assert.rejects(
    responderPanda({ pregunta: "Hola", historial: [] }, { cliente: clienteFalso(async () => Promise.reject({ status: 429 })) }),
    (e: unknown) => e instanceof GeminiError && e.status === 429 && /Pandi/.test(e.mensajeUsuario),
  );
});
