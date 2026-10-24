import { test } from "node:test";
import assert from "node:assert/strict";
import { analizarSinIA, normalizar } from "../src/lib/motorPropio.ts";

const casos: [string, string, "estafa" | "sospechoso" | "seguro"][] = [
  ["ARCA", "ARCA INFORMA: Registrás una deuda de $187.430 en Ganancias. Para evitar el embargo de tus cuentas regularizá HOY en https://arca-regularizacion.com/pago antes de las 24 hs.", "estafa"],
  ["Mercado Pago", "Mercado Pago: tu cuenta fue BLOQUEADA por actividad inusual. Validá tu identidad en http://mercadopag0-seguridad.xyz/validar o perdés tu saldo.", "estafa"],
  ["Hola ma", "Hola ma, cambié de número, agendá este. Estoy en un apuro, ¿me podés transferir $85.000 al alias pago.rapido.mp? Después te explico, no me llames que no puedo hablar.", "estafa"],
  ["Código WhatsApp", "Hola! Te mandé un código de 6 dígitos por error, ¿me lo pasás? Es urgente.", "estafa"],
  ["Inversión", "Duplicá tu plata en 7 días con cripto, ganancia garantizada. Escribime.", "sospechoso"],
  ["Turno", "Hola! Te confirmo el turno con la Dra. Gómez el martes 28 a las 10:30 en el consultorio de siempre. Si no podés venir, avisanos por este medio. Gracias!", "seguro"],
];

for (const [nombre, texto, esperado] of casos) {
  test(`motor sin IA: ${nombre} → ${esperado}`, () => {
    const r = analizarSinIA(texto);
    if (esperado === "sospechoso") assert.notEqual(r.veredicto, "seguro");
    else assert.equal(r.veredicto, esperado, `${nombre}: ${r.score} ${r.reglas.join(",")}`);
    assert.ok(r.que_hacer.length >= 1 && r.que_hacer.length <= 4);
    assert.equal(r.resumen_abuela.split("\n").length, 2);
  });
}

test("motor sin IA: nunca da 0 ni 100 (no puede estar seguro)", () => {
  assert.ok(analizarSinIA("hola").score >= 10);
  assert.ok(analizarSinIA(casos[2][1] + " " + casos[0][1] + " anydesk ganaste bitcoin").score <= 95);
});

test("normalizar saca acentos y mayúsculas", () => {
  assert.equal(normalizar("Transferí YA"), "transferi ya");
});

test("Pandi sin IA orienta según la pregunta", async () => {
  const { respuestaPandaSinIA } = await import("../src/lib/asistente.ts");
  assert.match(respuestaPandaSinIA("Ya transferí la plata, ¿qué hago?"), /banco[^]*Ya caí/);
  assert.match(respuestaPandaSinIA("me pidieron el código de whatsapp"), /Nunca pases códigos/);
  assert.match(respuestaPandaSinIA("¿este link es seguro?"), /pestaña «Link»/);
  assert.match(respuestaPandaSinIA("hola"), /pestaña «Mensaje»/);
});

test("motor sin IA: familiar con número nuevo que pide plata es estafa aunque sea corto", () => {
  assert.equal(analizarSinIA("Hola ma, cambié de número, transferime al alias pago.rapido.mp").veredicto, "estafa");
});
