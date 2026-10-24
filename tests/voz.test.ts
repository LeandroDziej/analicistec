import { test } from "node:test";
import assert from "node:assert/strict";
import { elegirVoz, textoParaLeer } from "../src/lib/voz.ts";

test("elegirVoz prefiere es-AR, luego es-*, y null si no hay español", () => {
  const en = { lang: "en-US", name: "en" };
  const mx = { lang: "es-MX", name: "mx" };
  const ar = { lang: "es_AR", name: "ar" };
  const es = { lang: "es-ES", name: "es" };
  assert.equal(elegirVoz([en, es, mx, ar]), ar);
  assert.equal(elegirVoz([en, es, mx]), mx);
  assert.equal(elegirVoz([en, es]), es);
  assert.equal(elegirVoz([en]), null);
  assert.equal(elegirVoz([]), null);
});

test("textoParaLeer ignora vacíos", () => {
  assert.equal(textoParaLeer(["Hola", undefined, "  ", "Chau"]), "Hola. Chau");
});
