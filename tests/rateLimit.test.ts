import { test } from "node:test";
import assert from "node:assert/strict";
import { crearLimitador, ipDe } from "../src/lib/rateLimit.ts";

test("permite hasta el límite por IP y después bloquea con Retry-After", () => {
  const verificar = crearLimitador(3, 60_000);
  const t = 1_000_000;
  assert.equal(verificar("1.1.1.1", t).restantes, 2);
  verificar("1.1.1.1", t + 1);
  assert.equal(verificar("1.1.1.1", t + 2).permitido, true);
  const r = verificar("1.1.1.1", t + 10_000);
  assert.equal(r.permitido, false);
  assert.equal(r.reintentarEn, 50);
  assert.equal(verificar("2.2.2.2", t + 10_000).permitido, true, "otra IP no se ve afectada");
});

test("la ventana se desliza y libera lugar", () => {
  const verificar = crearLimitador(2, 1_000);
  verificar("ip", 0);
  verificar("ip", 500);
  assert.equal(verificar("ip", 900).permitido, false);
  assert.equal(verificar("ip", 1_001).permitido, true);
});

test("ipDe toma la primera IP de x-forwarded-for o x-real-ip", () => {
  assert.equal(ipDe(new Headers({ "x-forwarded-for": "200.1.2.3, 10.0.0.1" })), "200.1.2.3");
  assert.equal(ipDe(new Headers({ "x-real-ip": " 200.9.9.9 " })), "200.9.9.9");
  assert.equal(ipDe(new Headers()), "desconocida");
});
