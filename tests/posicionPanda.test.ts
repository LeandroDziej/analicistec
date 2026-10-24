import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALTO_PANDA,
  ANCHO_PANDA,
  MARGEN_PANDA,
  esArrastre,
  leerPosicionGuardada,
  limitarPosicion,
  posicionInicial,
} from "../src/lib/posicionPanda.ts";

test("Pandi arranca abajo a la derecha, dentro de la pantalla", () => {
  assert.deepEqual(posicionInicial(390, 780), { x: 390 - ANCHO_PANDA - MARGEN_PANDA, y: 780 - ALTO_PANDA - MARGEN_PANDA });
});

test("no se puede sacar a Pandi de la pantalla", () => {
  assert.deepEqual(limitarPosicion({ x: -500, y: -20 }, 1280, 800), { x: MARGEN_PANDA, y: MARGEN_PANDA });
  assert.deepEqual(limitarPosicion({ x: 5000, y: 5000 }, 1280, 800), { x: 1280 - ANCHO_PANDA - MARGEN_PANDA, y: 800 - ALTO_PANDA - MARGEN_PANDA });
  assert.deepEqual(limitarPosicion({ x: 200.4, y: 300.6 }, 1280, 800), { x: 200, y: 301 });
});

test("lee la posición guardada y descarta datos rotos", () => {
  assert.deepEqual(leerPosicionGuardada('{"x":10,"y":20}'), { x: 10, y: 20 });
  assert.equal(leerPosicionGuardada(null), null);
  assert.equal(leerPosicionGuardada("no es json"), null);
  assert.equal(leerPosicionGuardada('{"x":"a","y":2}'), null);
});

test("un movimiento chiquito es un toque, uno largo es arrastre", () => {
  assert.equal(esArrastre({ x: 0, y: 0 }, { x: 3, y: 3 }), false);
  assert.equal(esArrastre({ x: 0, y: 0 }, { x: 20, y: 0 }), true);
});
