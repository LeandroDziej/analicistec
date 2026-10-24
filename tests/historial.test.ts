import { test } from "node:test";
import assert from "node:assert/strict";
import { borrarHistorial, CLAVE_HISTORIAL, guardarEnHistorial, leerHistorial, MAX_HISTORIAL, type Almacen } from "../src/lib/historial.ts";

function almacenFalso(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => void datos.set(k, v),
    removeItem: (k) => void datos.delete(k),
  };
}

const base = { veredicto: "estafa" as const, score: 90, mensaje: "hola", resumen: "es estafa" };

test("guarda y lee, lo más nuevo primero", () => {
  const a = almacenFalso();
  guardarEnHistorial({ ...base, mensaje: "uno" }, a);
  guardarEnHistorial({ ...base, mensaje: "dos" }, a);
  assert.deepEqual(leerHistorial(a).map((e) => e.mensaje), ["dos", "uno"]);
});

test("se queda con los últimos 10", () => {
  const a = almacenFalso();
  for (let i = 0; i < 15; i++) guardarEnHistorial({ ...base, mensaje: String(i) }, a);
  const l = leerHistorial(a);
  assert.equal(l.length, MAX_HISTORIAL);
  assert.equal(l[0].mensaje, "14");
});

test("borrar vacía el historial", () => {
  const a = almacenFalso();
  guardarEnHistorial(base, a);
  borrarHistorial(a);
  assert.deepEqual(leerHistorial(a), []);
});

test("no rompe sin almacenamiento, con JSON roto ni con almacenamiento que tira error", () => {
  assert.deepEqual(leerHistorial(null), []);
  assert.doesNotThrow(() => guardarEnHistorial(base, null));
  assert.doesNotThrow(() => borrarHistorial(null));
  const a = almacenFalso();
  a.datos.set(CLAVE_HISTORIAL, "{roto");
  assert.deepEqual(leerHistorial(a), []);
  a.datos.set(CLAVE_HISTORIAL, JSON.stringify([{ x: 1 }, 5]));
  assert.deepEqual(leerHistorial(a), []);
  const malo: Almacen = {
    getItem: () => { throw new Error("no"); },
    setItem: () => { throw new Error("lleno"); },
    removeItem: () => { throw new Error("no"); },
  };
  assert.deepEqual(leerHistorial(malo), []);
  assert.doesNotThrow(() => guardarEnHistorial(base, malo));
  assert.doesNotThrow(() => borrarHistorial(malo));
});
