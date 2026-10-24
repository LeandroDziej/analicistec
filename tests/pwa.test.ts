import { test } from "node:test";
import assert from "node:assert/strict";
import { crearManifest } from "../src/lib/pwa.ts";

test("manifest con nombre, modo app, colores e ícono", () => {
  const m = crearManifest();
  assert.equal(m.name, "AntiEstafa AR");
  assert.equal(m.display, "standalone");
  assert.equal(m.start_url, "/");
  assert.match(String(m.theme_color), /^#[0-9a-f]{6}$/i);
  assert.ok(m.icons && m.icons.length > 0);
});
