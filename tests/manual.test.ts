import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { manualAHtml, slug } from "../src/lib/manual.ts";

test("slug igual al de GitHub y el PDF (sin acentos ni signos)", () => {
  assert.equal(slug("1. Instalar la app"), "1-instalar-la-app");
  assert.equal(slug("9. Tus últimos análisis"), "9-tus-ultimos-analisis");
  assert.equal(slug("6. Antes de transferir"), "6-antes-de-transferir");
});

test("el manual se convierte a HTML sin el título y con anclas para el índice", () => {
  const md = readFileSync(new URL("../docs/MANUAL_DE_USUARIO.md", import.meta.url), "utf8");
  const html = manualAHtml(md);
  assert.doesNotMatch(html, /<h1/);
  assert.match(html, /<h2 id="2-instalar-la-app">/);
  assert.match(html, /<h2 id="11-mis-analisis">/);
  assert.match(html, /<h2 id="13-preguntale-a-pandi">/);
  assert.match(html, /<table>/);
  // cada link del índice apunta a un título que existe
  const anclas = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.ok(anclas.length >= 10);
  for (const a of anclas) assert.match(html, new RegExp(`id="${a}"`), a);
});

test("los links externos abren en otra pestaña", () => {
  const html = manualAHtml("Mirá [la app](https://ejemplo.com) y [arriba](#arriba).");
  assert.match(html, /href="https:\/\/ejemplo.com" target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /href="#arriba">/);
});
