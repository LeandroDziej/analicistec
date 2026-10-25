import { test } from "node:test";
import assert from "node:assert/strict";
import { interpretarQr, leerTlv } from "../src/lib/qr.ts";
import { PREGUNTAS_QUIZ, nivelQuiz, textoCompartirQuiz } from "../src/lib/quiz.ts";

test("QR: reconoce links, con y sin https", () => {
  assert.deepEqual(interpretarQr(" https://mercadopag0.xyz/cobro "), { tipo: "url", url: "https://mercadopag0.xyz/cobro" });
  assert.deepEqual(interpretarQr("www.ejemplo.com.ar/pago"), { tipo: "url", url: "https://www.ejemplo.com.ar/pago" });
});

test("QR: lee un QR de pago EMV con comercio, ciudad y monto", () => {
  const campo = (tag: string, v: string) => `${tag}${String(v.length).padStart(2, "0")}${v}`;
  const qr = "000201" + campo("53", "032") + campo("54", "1500.50") + campo("59", "KIOSCO PEPE") + campo("60", "ROSARIO") + campo("63", "ABCD");
  const r = interpretarQr(qr);
  assert.equal(r.tipo, "pago");
  if (r.tipo === "pago") {
    assert.equal(r.comercio, "KIOSCO PEPE");
    assert.equal(r.ciudad, "ROSARIO");
    assert.match(r.monto ?? "", /1\.500,50/);
  }
});

test("QR: texto común y TLV inválido", () => {
  assert.equal(leerTlv("00xx"), null);
  const r = interpretarQr("WIFI:S:casa;T:WPA;P:1234;;");
  assert.equal(r.tipo, "texto");
  if (r.tipo === "texto") assert.equal(r.esquema, "wifi");
});

test("Practicá: preguntas variadas, ids únicos y dominios ficticios", () => {
  const ids = new Set(PREGUNTAS_QUIZ.map((p) => p.id));
  assert.equal(ids.size, PREGUNTAS_QUIZ.length);
  assert.ok(PREGUNTAS_QUIZ.some((p) => p.esEstafa) && PREGUNTAS_QUIZ.some((p) => !p.esEstafa));
  for (const p of PREGUNTAS_QUIZ) {
    for (const url of p.mensaje.match(/https?:\/\/\S+/g) ?? []) assert.match(url, /\.example\//);
    assert.ok(p.pistas.length > 0 && p.explicacion.length > 20);
  }
});

test("Practicá: nivel y texto para compartir", () => {
  assert.equal(nivelQuiz(6, 6).titulo, "¡Perfecto!");
  assert.equal(nivelQuiz(0, 6).titulo, "Ahora ya sabés qué mirar");
  assert.equal(textoCompartirQuiz(4, 6, "https://x.ar"), "Saqué 4/6 en el quiz de AntiEstafa AR. ¿Podés detectar cuáles son estafas? https://x.ar");
});
