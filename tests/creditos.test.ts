import { test } from "node:test";
import assert from "node:assert/strict";
import { AUTORES, listaAutores } from "../src/lib/creditos.ts";

test("créditos con los dos autores, separados por coma y 'y'", () => {
  assert.equal(listaAutores(), "Manuel A. y María Sofía Genta");
  assert.equal(AUTORES.length, 2);
  assert.equal(listaAutores(["Ana", "Beto"]), "Ana y Beto");
  assert.equal(listaAutores(["Ana"]), "Ana");
});
