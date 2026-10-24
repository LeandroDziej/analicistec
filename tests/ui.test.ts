import { test } from "node:test";
import assert from "node:assert/strict";
import { generarAlerta, infoSemaforo, mensajeError, urlWhatsApp, validarImagenCliente } from "../src/lib/ui.ts";

test("semáforo mapea veredicto a luz", () => {
  assert.equal(infoSemaforo("estafa").luz, "rojo");
  assert.equal(infoSemaforo("sospechoso").luz, "amarillo");
  assert.equal(infoSemaforo("seguro").luz, "verde");
});

test("validarImagenCliente rechaza vacías, pesadas y tipos raros", () => {
  assert.equal(validarImagenCliente({ size: 1000, type: "image/png" }), null);
  assert.equal(validarImagenCliente({ size: 1000, type: "" }), null);
  assert.match(validarImagenCliente({ size: 0, type: "image/png" })!, /vacía/);
  assert.match(validarImagenCliente({ size: 5 * 1024 * 1024, type: "image/jpeg" })!, /4 MB/);
  assert.match(validarImagenCliente({ size: 1000, type: "application/pdf" })!, /JPG/);
});

test("mensajeError usa el mensaje del servidor o uno amable", () => {
  assert.equal(mensajeError(400, { error: "Pegá un mensaje." }), "Pegá un mensaje.");
  assert.match(mensajeError(429, null), /Esperá un minuto/);
  assert.match(mensajeError(500, "x"), /Algo salió mal/);
});

const base = {
  veredicto: "estafa" as const,
  score: 92,
  banderas: ["Dominio creado hace 3 días", "Imita a Mercado Pago", "Pide datos de tarjeta", "Urgencia", "Quinta"],
  que_hacer: ["No toques el link", "Bloqueá el número", "Avisá a tu banco", "Cuarta"],
  resumen_abuela: "Es una estafa que se hace pasar por Mercado Pago.\nNo toques nada.",
  links: [{ dominio: "mercadopago-seguro.com" }, { dominio: "mercadopago-seguro.com" }],
};

test("generarAlerta arma texto copiable con encabezado, señales y acciones", () => {
  const t = generarAlerta(base);
  assert.match(t, /^🚨 ALERTA DE ESTAFA/);
  assert.match(t, /Riesgo: 92\/100/);
  assert.match(t, /• Imita a Mercado Pago/);
  assert.ok(!t.includes("Quinta"), "máximo 4 banderas");
  assert.ok(!t.includes("Cuarta"), "máximo 3 acciones");
  assert.match(t, /1\. No toques el link/);
  assert.match(t, /AntiEstafa AR/);
});

test("generarAlerta desactiva dominios y no los repite", () => {
  const t = generarAlerta(base);
  assert.equal(t.split("mercadopago-seguro[.]com").length - 1, 1);
  assert.ok(!t.includes("mercadopago-seguro.com"));
});

test("generarAlerta para seguro no lista dominios ni advertencia", () => {
  const t = generarAlerta({ ...base, veredicto: "seguro", score: 5, banderas: [], links: [{ dominio: "afip.gob.ar" }] });
  assert.match(t, /^✅/);
  assert.ok(!t.includes("No entres a"));
  assert.ok(!t.includes("Señales:"));
  assert.ok(!t.includes("no respondas"));
});

test("urlWhatsApp codifica acentos, ñ, emojis y saltos de línea y se puede decodificar", () => {
  const texto = "🚨 ALERTA\nNo pagues: señal de estafa, ¡cuidado con el año!\r\nFin & más = 100%";
  const url = urlWhatsApp(texto);
  assert.ok(url.startsWith("https://wa.me/?text="));
  const codificado = url.slice("https://wa.me/?text=".length);
  assert.doesNotMatch(codificado, /[\s&=ñáé¡]/u);
  assert.match(codificado, /%0A/);
  assert.match(codificado, /%C3%B1/);
  assert.equal(decodeURIComponent(codificado), texto);
});
