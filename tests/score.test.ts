import { test } from "node:test";
import assert from "node:assert/strict";
import { combinarScore, scoreLink, veredictoDeScore } from "../src/lib/score.ts";
import type { AnalisisLLM } from "../src/lib/gemini.ts";
import type { ResultadoLink } from "../src/lib/links.ts";

const llm = (over: Partial<AnalisisLLM> = {}): AnalisisLLM => ({
  veredicto: "seguro",
  score: 10,
  banderas: [],
  que_hacer: ["Seguí normal."],
  resumen_abuela: "Está todo bien.\nNo hay peligro.",
  ...over,
});

const link = (over: Partial<ResultadoLink> = {}): ResultadoLink => ({
  url: "https://ejemplo.com/",
  dominio: "ejemplo.com",
  bloqueado: false,
  antiguedadDias: 4000,
  fechaRegistro: "2015-01-01T00:00:00Z",
  ssl: true,
  redirecciones: [],
  urlFinal: "https://ejemplo.com/",
  marcaImitada: null,
  senales: [],
  ...over,
});

test("veredictoDeScore usa umbrales 35/70", () => {
  assert.equal(veredictoDeScore(0), "seguro");
  assert.equal(veredictoDeScore(34), "seguro");
  assert.equal(veredictoDeScore(35), "sospechoso");
  assert.equal(veredictoDeScore(70), "estafa");
});

test("sin links el score es el del LLM", () => {
  const r = combinarScore(llm({ score: 20 }), []);
  assert.equal(r.score, 20);
  assert.equal(r.veredicto, "seguro");
  assert.equal(r.detalle.score_tecnico, 0);
  assert.deepEqual(r.que_hacer, ["Seguí normal."]);
});

test("link limpio no cambia el score", () => {
  const r = combinarScore(llm({ score: 15 }), [link()]);
  assert.equal(r.score, 15);
  assert.equal(scoreLink(link()), 0);
});

test("marca imitada + dominio nuevo -> estafa aunque el LLM diga seguro", () => {
  const l = link({
    dominio: "mercadopago-validar.com",
    antiguedadDias: 3,
    marcaImitada: { marca: "Mercado Pago", distancia: 0 },
    senales: ["Dominio creado hace 3 días", "El dominio imita a Mercado Pago"],
  });
  const r = combinarScore(llm({ score: 10 }), [l]);
  assert.equal(r.veredicto, "estafa");
  assert.ok(r.score >= 85, `score ${r.score}`);
  assert.equal(r.detalle.veredicto_llm, "seguro");
  assert.ok(r.banderas.includes("El dominio imita a Mercado Pago (mercadopago-validar.com)"));
  assert.match(r.que_hacer[0], /link/);
});

test("sin SSL solo suma un poco", () => {
  const l = link({ ssl: false, senales: ["No tiene un certificado SSL válido"] });
  assert.equal(scoreLink(l), 15);
  const r = combinarScore(llm({ score: 20 }), [l]);
  assert.equal(r.score, 32);
  assert.equal(r.veredicto, "seguro");
});

test("las señales técnicas nunca bajan el veredicto del LLM", () => {
  const r = combinarScore(llm({ veredicto: "estafa", score: 60 }), [link()]);
  assert.equal(r.veredicto, "estafa");
  assert.equal(r.score, 70);
});

test("toma el link más riesgoso y dedup de banderas", () => {
  const malo = link({
    dominio: "afip-gob.net",
    antiguedadDias: 50,
    marcaImitada: { marca: "AFIP", distancia: 0 },
    senales: ["Dominio creado hace 50 días"],
  });
  const r = combinarScore(
    llm({ veredicto: "sospechoso", score: 50, banderas: ["Dominio creado hace 50 días (afip-gob.net)", "Urgencia"] }),
    [link(), malo],
  );
  assert.equal(r.detalle.score_tecnico, 70);
  assert.equal(r.score, 85);
  assert.equal(r.banderas.filter((b) => b.startsWith("Dominio creado")).length, 1);
  assert.ok(r.banderas.includes("Urgencia"));
});

test("link a IP interna bloqueada empuja a sospechoso", () => {
  const l = link({ bloqueado: true, ssl: null, antiguedadDias: null, senales: ["Apunta a una dirección interna"] });
  const r = combinarScore(llm({ score: 5 }), [l]);
  assert.equal(r.veredicto, "sospechoso");
  assert.ok(r.score >= 50);
});

test("no duplica consejo de link si el LLM ya lo dio", () => {
  const l = link({ ssl: false, senales: ["No tiene un certificado SSL válido"] });
  const r = combinarScore(llm({ que_hacer: ["No toques el enlace."] }), [l]);
  assert.deepEqual(r.que_hacer, ["No toques el enlace."]);
});
