import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  analizarConGemini,
  elegirFlashRecientes,
  limpiarApiKey,
  parsearRespuesta,
  getModeloRecordado,
  esperaPara429,
  _resetModeloRecordado,
  GeminiError,
  type ClienteGemini,
} from "../src/lib/gemini.ts";

const OK = JSON.stringify({
  veredicto: "estafa",
  score: 92,
  banderas: ["Link que imita a Mercado Pago"],
  que_hacer: ["No toques el link"],
  resumen_abuela: "Es una trampa.\nNo respondas.",
});

function mock(
  respuestas: Record<string, () => Promise<{ text?: string }>>,
  modelos: string[] = [],
) {
  const llamados: string[] = [];
  const cliente: ClienteGemini = {
    models: {
      async generateContent({ model }) {
        llamados.push(model);
        const r = respuestas[model];
        if (!r) throw Object.assign(new Error("not found"), { status: 404 });
        return r();
      },
      async list() {
        return (async function* () {
          for (const name of modelos) yield { name, supportedActions: ["generateContent"] };
        })();
      },
    },
  };
  return { cliente, llamados };
}

beforeEach(() => _resetModeloRecordado());

test("limpiarApiKey saca BOM y espacios", () => {
  assert.equal(limpiarApiKey("﻿  abc123 \r\n"), "abc123");
  assert.equal(limpiarApiKey(undefined), "");
});

test("parsearRespuesta normaliza y valida", () => {
  const r = parsearRespuesta(JSON.stringify({ veredicto: "seguro", score: 140, banderas: ["", "x"], que_hacer: "no", resumen_abuela: " ok " }));
  assert.equal(r.score, 100);
  assert.deepEqual(r.banderas, ["x"]);
  assert.deepEqual(r.que_hacer, []);
  assert.equal(r.resumen_abuela, "ok");
  assert.throws(() => parsearRespuesta("no json"), GeminiError);
  assert.throws(() => parsearRespuesta('{"veredicto":"quizas"}'), GeminiError);
});

test("elegirFlashRecientes ordena por versión y excluye lite", () => {
  const r = elegirFlashRecientes([
    "models/gemini-2.5-flash",
    "models/gemini-3.5-flash",
    "models/gemini-3.5-flash-lite",
    "models/gemini-3-flash-preview",
    "models/gemini-2.5-pro",
  ]);
  assert.deepEqual(r, ["gemini-3.5-flash", "gemini-3-flash-preview", "gemini-2.5-flash"]);
});

test("usa el modelo preferido si responde", async () => {
  const { cliente, llamados } = mock({ "gemini-3.8-flash": async () => ({ text: OK }) });
  const r = await analizarConGemini({ texto: "hola" }, { cliente });
  assert.equal(r.analisis.veredicto, "estafa");
  assert.deepEqual(llamados, ["gemini-3.8-flash"]);
});

test("ante 404 lista modelos, cae al flash más reciente y lo recuerda", async () => {
  const { cliente, llamados } = mock(
    { "gemini-3.5-flash": async () => ({ text: OK }) },
    ["models/gemini-3.5-flash", "models/gemini-2.5-flash"],
  );
  const r = await analizarConGemini({ texto: "hola" }, { cliente });
  assert.equal(r.modelo, "gemini-3.5-flash");
  assert.deepEqual(llamados, ["gemini-3.8-flash", "gemini-3.5-flash"]);
  assert.equal(getModeloRecordado(), "gemini-3.5-flash");

  await analizarConGemini({ texto: "otra" }, { cliente });
  assert.equal(llamados.at(-1), "gemini-3.5-flash");
});

test("timeout cuenta como fallo y prueba otro modelo; máximo 3 intentos", async () => {
  const colgado = () => new Promise<{ text?: string }>(() => {});
  const { cliente, llamados } = mock(
    { "gemini-3.8-flash": colgado, "gemini-3.5-flash": colgado, "gemini-3-flash": colgado, "gemini-2.5-flash": colgado },
    ["gemini-3.5-flash", "gemini-3-flash", "gemini-2.5-flash"],
  );
  await assert.rejects(analizarConGemini({ texto: "x" }, { cliente, timeoutMs: 20 }), (e: GeminiError) => e.status === 503);
  assert.equal(llamados.length, 3);
});

test("429 persistente: reintenta 2 veces con espera y devuelve mensaje amable", async () => {
  const esperas: number[] = [];
  const { cliente, llamados } = mock({
    "gemini-3.8-flash": async () => {
      throw Object.assign(new Error("quota"), { status: 429 });
    },
  });
  await assert.rejects(
    analizarConGemini({ texto: "x" }, { cliente, esperar: async (ms) => void esperas.push(ms) }),
    (e: GeminiError) => e.status === 429 && /Esperá un minuto/.test(e.mensajeUsuario),
  );
  assert.equal(llamados.length, 3);
  assert.equal(esperas.length, 2);
  assert.ok(esperas[1] > esperas[0]);
});

test("429 transitorio: reintenta el mismo modelo y responde", async () => {
  let n = 0;
  const esperas: number[] = [];
  const { cliente, llamados } = mock({
    "gemini-3.8-flash": async () => {
      if (n++ === 0) throw new Error('{"error":{"code":429,"details":[{"retryDelay":"3s"}]}}');
      return { text: OK };
    },
  });
  const r = await analizarConGemini({ texto: "x" }, { cliente, esperar: async (ms) => void esperas.push(ms) });
  assert.equal(r.modelo, "gemini-3.8-flash");
  assert.deepEqual(llamados, ["gemini-3.8-flash", "gemini-3.8-flash"]);
  assert.deepEqual(esperas, [3000]);
});

test("esperaPara429 respeta retryDelay sugerido y lo acota", () => {
  assert.equal(esperaPara429(new Error("Please retry in 2.5s."), 0), 2500);
  assert.equal(esperaPara429(new Error('"retryDelay": "40s"'), 0), 5000);
  assert.equal(esperaPara429(new Error("quota"), 0), 1500);
  assert.equal(esperaPara429(new Error("quota"), 1), 3000);
});

test("error no reintentable (400) no prueba otros modelos", async () => {
  const { cliente, llamados } = mock(
    {
      "gemini-3.8-flash": async () => {
        throw Object.assign(new Error("bad request"), { status: 400 });
      },
      "gemini-3.5-flash": async () => ({ text: OK }),
    },
    ["gemini-3.5-flash"],
  );
  await assert.rejects(analizarConGemini({ texto: "x" }, { cliente }), (e: GeminiError) => e.status === 503);
  assert.deepEqual(llamados, ["gemini-3.8-flash"]);
});
