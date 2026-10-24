import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { analizarConGemini, _resetModeloRecordado, SYSTEM_PROMPT, type AnalisisLLM, type ClienteGemini } from "../src/lib/gemini.ts";
import { dominioRegistrable, verificarLinks, type DepsLinks } from "../src/lib/links.ts";
import { combinarScore } from "../src/lib/score.ts";
import { AHORA, DOMINIOS, EJEMPLOS, type Ejemplo } from "./fixtures/ejemplos.ts";

/** Red simulada: DNS, RDAP y TLS salen de DOMINIOS; no hay tráfico real. */
const depsSimuladas: DepsLinks = {
  fetch: (async (input: string | URL | Request) => {
    const url = String(input);
    const rdap = /^https:\/\/rdap\.org\/domain\/(.+)$/.exec(url);
    if (rdap) {
      const d = DOMINIOS[decodeURIComponent(rdap[1])];
      if (!d) return new Response("not found", { status: 404 });
      return Response.json({ events: [{ eventAction: "registration", eventDate: d.registro }] });
    }
    return new Response("ok", { status: 200 });
  }) as typeof fetch,
  lookup: async (host) => {
    const d = DOMINIOS[dominioRegistrable(host)];
    if (!d) throw new Error("ENOTFOUND");
    return [d.ip];
  },
  chequearTls: async (_ip, host) => DOMINIOS[dominioRegistrable(host)]?.ssl ?? false,
  ahora: () => AHORA,
};

/** Cliente de Gemini simulado: devuelve una respuesta fija y guarda lo que recibió. */
function geminiSimulado(respuesta: AnalisisLLM) {
  const recibidos: { contents: unknown; config?: Record<string, unknown> }[] = [];
  const cliente: ClienteGemini = {
    models: {
      async generateContent({ contents, config }) {
        recibidos.push({ contents, config });
        return { text: JSON.stringify(respuesta) };
      },
      async list() {
        return (async function* () {})();
      },
    },
  };
  return { cliente, recibidos };
}

/** Mismo flujo que /api/analyze, con dependencias simuladas. */
async function analizar(texto: string, llm: AnalisisLLM) {
  const { cliente, recibidos } = geminiSimulado(llm);
  const [{ analisis }, links] = await Promise.all([
    analizarConGemini({ texto }, { cliente }),
    verificarLinks(texto, depsSimuladas),
  ]);
  return { final: combinarScore(analisis, links), recibidos };
}

const LLM_INGENUO: AnalisisLLM = {
  veredicto: "seguro",
  score: 10,
  banderas: [],
  que_hacer: ["Seguí normal"],
  resumen_abuela: "Parece un mensaje común.\nNo hay peligro.",
};

beforeEach(() => _resetModeloRecordado());

test("hay 4 estafas y 4 legítimos", () => {
  assert.equal(EJEMPLOS.filter((e) => e.tipo === "estafa").length, 4);
  assert.equal(EJEMPLOS.filter((e) => e.tipo === "legitimo").length, 4);
});

for (const ej of EJEMPLOS) {
  test(`[${ej.tipo}] ${ej.nombre} -> ${ej.esperado}`, async () => {
    const { final, recibidos } = await analizar(ej.texto, ej.llm);

    assert.equal(final.veredicto, ej.esperado, `score ${final.score}, banderas: ${final.banderas.join(" | ")}`);
    if (ej.tipo === "estafa") {
      assert.ok(final.score >= 70, `score ${final.score}`);
      assert.ok(final.banderas.length > 0);
    } else {
      assert.ok(final.score < 35, `score ${final.score}`);
      assert.equal(final.detalle.score_tecnico, 0, "un link oficial no debería sumar riesgo");
      assert.ok(final.links.every((l) => l.senales.length === 0 && l.marcaImitada === null), JSON.stringify(final.links));
    }
    if (ej.marcaImitada) {
      assert.ok(final.links.some((l) => l.marcaImitada?.marca === ej.marcaImitada), JSON.stringify(final.links));
      assert.ok(final.que_hacer.some((q) => /link|enlace/i.test(q)));
    }

    // El texto le llega a Gemini con el contexto argentino y salida JSON.
    assert.equal(recibidos.length, 1);
    assert.ok(JSON.stringify(recibidos[0].contents).includes(JSON.stringify(ej.texto).slice(1, -1)));
    assert.equal(recibidos[0].config?.systemInstruction, SYSTEM_PROMPT);
    assert.equal(recibidos[0].config?.responseMimeType, "application/json");
    assert.ok(final.resumen_abuela.length > 0);
  });
}

const conLinkFalso = (e: Ejemplo) => e.tipo === "estafa" && Boolean(e.marcaImitada);

for (const ej of EJEMPLOS.filter(conLinkFalso)) {
  test(`señales técnicas detectan "${ej.nombre}" aunque el LLM diga seguro`, async () => {
    const { final } = await analizar(ej.texto, LLM_INGENUO);
    assert.equal(final.veredicto, "estafa");
    assert.ok(final.score >= 85, `score ${final.score}`);
    assert.equal(final.detalle.veredicto_llm, "seguro");
    assert.ok(final.banderas.some((b) => b.startsWith("Dominio creado hace")));
    assert.ok(final.banderas.some((b) => b.startsWith(`El dominio imita a ${ej.marcaImitada}`)));
  });
}

test("los mensajes legítimos no se vuelven sospechosos por sus links", async () => {
  for (const ej of EJEMPLOS.filter((e) => e.tipo === "legitimo")) {
    const { final } = await analizar(ej.texto, LLM_INGENUO);
    assert.equal(final.veredicto, "seguro", ej.nombre);
    assert.equal(final.score, LLM_INGENUO.score, ej.nombre);
  }
});

test("sin link, el 'hola mamá' depende solo del LLM", async () => {
  const ej = EJEMPLOS.find((e) => e.nombre.startsWith("Hola mamá"))!;
  const { final } = await analizar(ej.texto, LLM_INGENUO);
  assert.deepEqual(final.links, []);
  assert.equal(final.veredicto, "seguro");
});
