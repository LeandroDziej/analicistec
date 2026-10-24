import { test } from "node:test";
import assert from "node:assert/strict";
import { crearManifest, detectarPlataforma, instruccionesInstalar } from "../src/lib/pwa.ts";

test("manifest con nombre, modo app, colores e ícono", () => {
  const m = crearManifest();
  assert.equal(m.name, "AntiEstafa AR");
  assert.equal(m.display, "standalone");
  assert.equal(m.start_url, "/");
  assert.match(String(m.theme_color), /^#[0-9a-f]{6}$/i);
  assert.ok(m.icons && m.icons.length > 0);
});

test("manifest con íconos PNG de 192 y 512, incluido uno maskable", () => {
  const iconos = crearManifest().icons ?? [];
  assert.ok(iconos.some((i) => i.sizes === "192x192" && i.type === "image/png"));
  assert.ok(iconos.some((i) => i.sizes === "512x512" && i.type === "image/png"));
  assert.ok(iconos.some((i) => i.purpose === "maskable"));
});

const UA = {
  chromeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  chromeLinux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36",
  samsung:
    "Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  chromeIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0 Mobile/15E148 Safari/604.1",
  ipadComoMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  safariMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  firefoxLinux: "Mozilla/5.0 (X11; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0",
  firefoxAndroid: "Mozilla/5.0 (Android 14; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0",
};

test("detecta cada navegador y sistema", () => {
  assert.equal(detectarPlataforma(UA.chromeWindows), "chromium-compu");
  assert.equal(detectarPlataforma(UA.chromeLinux), "chromium-compu");
  assert.equal(detectarPlataforma(UA.edge), "chromium-compu");
  assert.equal(detectarPlataforma(UA.chromeAndroid), "chromium-android");
  assert.equal(detectarPlataforma(UA.samsung), "samsung");
  assert.equal(detectarPlataforma(UA.iphone), "ios");
  assert.equal(detectarPlataforma(UA.chromeIphone), "ios");
  assert.equal(detectarPlataforma(UA.ipadComoMac, 5), "ios");
  assert.equal(detectarPlataforma(UA.safariMac, 0), "safari-mac");
  assert.equal(detectarPlataforma(UA.firefoxLinux), "firefox-compu");
  assert.equal(detectarPlataforma(UA.firefoxAndroid), "firefox-android");
  assert.equal(detectarPlataforma(""), "otro");
});

test("cada plataforma tiene instrucciones, y las que no instalan ofrecen copiar el link", () => {
  const todas = [
    "chromium-compu",
    "chromium-android",
    "samsung",
    "ios",
    "safari-mac",
    "firefox-compu",
    "firefox-android",
    "otro",
  ] as const;
  for (const p of todas) {
    const i = instruccionesInstalar(p);
    assert.ok(i.titulo.length > 0, p);
    assert.ok(i.pasos.length > 0, p);
  }
  assert.equal(instruccionesInstalar("firefox-compu").copiarLink, true);
  assert.equal(instruccionesInstalar("otro").copiarLink, true);
  assert.equal(instruccionesInstalar("ios").copiarLink, false);
  assert.match(instruccionesInstalar("ios").pasos.join(" "), /Agregar a inicio/);
});
