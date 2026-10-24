import { test } from "node:test";
import assert from "node:assert/strict";
import { aliasValido, cbuValido, validarDestino, AVISO_TRANSFERIR } from "../src/lib/transferenciaUi.ts";
import { analizarTransferencia, parsearTransferencia, validarEntradaTransferencia } from "../src/lib/transferencia.ts";
import { EntradaError } from "../src/lib/entrada.ts";
import { GeminiError, type ClienteGemini } from "../src/lib/gemini.ts";

const CBU = "0170099212345678901233";
const CVU = "0000031400000012345674";

test("CBU/CVU: valida largo y dígitos verificadores", () => {
  assert.equal(cbuValido(CBU), true);
  assert.equal(cbuValido(CVU), true);
  assert.equal(cbuValido("0170099212345678901234"), false); // verificador final mal
  assert.equal(cbuValido("0170099312345678901233"), false); // verificador del banco mal
  assert.equal(cbuValido("017009921234567890123"), false); // 21 dígitos
  assert.equal(cbuValido("01700992123456789012a3"), false);
});

test("validarDestino distingue CBU, CVU y alias, y normaliza", () => {
  assert.equal(validarDestino(CBU).tipo, "cbu");
  assert.equal(validarDestino(CVU).tipo, "cvu");
  assert.equal(validarDestino(" 01700992 1234567890 1233 ").normalizado, CBU);
  const alias = validarDestino("  Mi.Alias-01 ");
  assert.equal(alias.tipo, "alias");
  assert.equal(alias.normalizado, "mi.alias-01");
});

test("validarDestino rechaza formatos inválidos con mensaje", () => {
  assert.match(validarDestino("").error ?? "", /Pegá/);
  assert.match(validarDestino("12345").error ?? "", /22 dígitos/);
  assert.match(validarDestino("0170099212345678901234").error ?? "", /no es válido/);
  assert.match(validarDestino("hola que tal").error ?? "", /alias/);
  assert.equal(validarDestino("abc").valido, false);
});

test("alias: 6 a 20 caracteres, con letra, solo letras/números/punto/guion", () => {
  assert.equal(aliasValido("abcdef"), true);
  assert.equal(aliasValido("a".repeat(20)), true);
  assert.equal(aliasValido("a".repeat(21)), false);
  assert.equal(aliasValido("abcde"), false);
  assert.equal(aliasValido("123456"), false);
  assert.equal(aliasValido("mi_alias.1"), false);
  assert.equal(aliasValido("mi alias1"), false);
});

test("validarEntradaTransferencia exige destino válido y mensaje acotado", () => {
  assert.throws(() => validarEntradaTransferencia(null), EntradaError);
  assert.throws(() => validarEntradaTransferencia({ destino: "xx" }), EntradaError);
  assert.throws(
    () => validarEntradaTransferencia({ destino: CBU, mensaje: "a".repeat(2001) }),
    (e: unknown) => e instanceof EntradaError && e.status === 413,
  );
  const ok = validarEntradaTransferencia({ destino: CBU, mensaje: " hola " });
  assert.equal(ok.mensaje, "hola");
  assert.equal(ok.destino.normalizado, CBU);
});

test("parsearTransferencia valida y siempre manda a verificar por otro canal", () => {
  const r = parsearTransferencia(JSON.stringify({ riesgo: "bajo", senales: [" x ", ""], recomendacion: "Todo normal." }));
  assert.deepEqual(r.senales, ["x"]);
  assert.ok(r.recomendacion.includes(AVISO_TRANSFERIR));
  const r2 = parsearTransferencia(JSON.stringify({ riesgo: "alto", senales: [], recomendacion: "Llamalo por otro canal." }));
  assert.equal(r2.recomendacion, "Llamalo por otro canal.");
  assert.throws(() => parsearTransferencia("no json"), GeminiError);
  assert.throws(() => parsearTransferencia(JSON.stringify({ riesgo: "seguro" })), GeminiError);
});

test("analizarTransferencia usa el cliente y mapea 429", async () => {
  const ok = { models: { generateContent: async () => ({ text: JSON.stringify({ riesgo: "medio", senales: ["urgencia"], recomendacion: "Llamalo." }) }) } } as unknown as ClienteGemini;
  assert.equal((await analizarTransferencia({ destino: CBU, tipo: "cbu", mensaje: "urgente" }, { cliente: ok })).riesgo, "medio");
  const e429 = { models: { generateContent: async () => { throw Object.assign(new Error("x"), { status: 429 }); } } } as unknown as ClienteGemini;
  await assert.rejects(analizarTransferencia({ destino: CBU, tipo: "cbu", mensaje: "" }, { cliente: e429 }), (e: unknown) => e instanceof GeminiError && e.status === 429);
});
