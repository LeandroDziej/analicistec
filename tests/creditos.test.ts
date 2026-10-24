import { test } from "node:test";
import assert from "node:assert/strict";
import { AUTORES, listaAutores } from "../src/lib/creditos.ts";

test("créditos con los tres autores, separados por coma y 'y'", () => {
  assert.equal(listaAutores(), "Manuel A., María Sofía Genta y Leandro Dizej");
  assert.equal(AUTORES.length, 3);
  assert.equal(listaAutores(["Ana", "Beto"]), "Ana y Beto");
  assert.equal(listaAutores(["Ana"]), "Ana");
});
