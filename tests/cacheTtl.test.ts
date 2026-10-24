import test from "node:test";
import assert from "node:assert/strict";
import { crearCacheTtl } from "../src/lib/cacheTtl.ts";

test("cacheTtl: guarda, vence y respeta el máximo", () => {
  let t = 0;
  const c = crearCacheTtl<number>(1000, 2, () => t);
  c.set("a", 1);
  assert.equal(c.get("a"), 1);
  t = 1000;
  assert.equal(c.get("a"), undefined);
  c.set("a", 1);
  c.set("b", 2);
  c.set("c", 3);
  assert.equal(c.get("a"), undefined);
  assert.equal(c.get("c"), 3);
});
