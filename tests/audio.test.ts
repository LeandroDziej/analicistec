import { test } from "node:test";
import assert from "node:assert/strict";
import { detectarMimeAudio, leerEntrada } from "../src/lib/entrada.ts";
import { formatoDuracion, formatoGrabacion, validarAudioCliente } from "../src/lib/audio.ts";
import { parsearRespuesta } from "../src/lib/gemini.ts";
import { combinarScore } from "../src/lib/score.ts";

const bytes = (...partes: (string | number[])[]) =>
  new Uint8Array(partes.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

test("detecta los formatos de audio por sus primeros bytes", () => {
  assert.equal(detectarMimeAudio(bytes("OggS", [0, 2])), "audio/ogg");
  assert.equal(detectarMimeAudio(bytes("ID3", [3, 0])), "audio/mpeg");
  assert.equal(detectarMimeAudio(bytes([0xff, 0xfb, 0x90])), "audio/mpeg");
  assert.equal(detectarMimeAudio(bytes([0xff, 0xf1, 0x50])), "audio/aac");
  assert.equal(detectarMimeAudio(bytes("RIFF", [0, 0, 0, 0], "WAVE")), "audio/wav");
  assert.equal(detectarMimeAudio(bytes([0x1a, 0x45, 0xdf, 0xa3])), "audio/webm");
  assert.equal(detectarMimeAudio(bytes([0, 0, 0, 0x20], "ftypM4A ")), "audio/mp4");
  assert.equal(detectarMimeAudio(bytes("#!AMR\n")), "audio/amr");
  assert.equal(detectarMimeAudio(bytes([0x89], "PNG")), null);
});

test("leerEntrada acepta un audio solo (multipart) y rechaza lo que no es audio", async () => {
  const form = new FormData();
  form.append("audio", new Blob([bytes("OggS", [0, 2, 0, 0])]), "nota.opus");
  const e = await leerEntrada(new Request("http://x/api/analyze", { method: "POST", body: form }));
  assert.equal(e.audio?.mimeType, "audio/ogg");
  assert.equal(e.texto, undefined);

  const malo = new FormData();
  malo.append("audio", new Blob([bytes("hola que tal")]), "x.opus");
  await assert.rejects(leerEntrada(new Request("http://x/api/analyze", { method: "POST", body: malo })), /audios de WhatsApp/);
});

test("validación del audio en el navegador: tamaño y tipo (o extensión)", () => {
  assert.equal(validarAudioCliente({ size: 1000, type: "audio/ogg", name: "a.ogg" }), null);
  assert.equal(validarAudioCliente({ size: 1000, type: "", name: "PTT-20261024-WA0003.opus" }), null);
  assert.match(validarAudioCliente({ size: 5 * 1024 * 1024, type: "audio/mpeg", name: "a.mp3" }) ?? "", /4 MB/);
  assert.match(validarAudioCliente({ size: 1000, type: "image/png", name: "a.png" }) ?? "", /Elegí un audio/);
  assert.match(validarAudioCliente({ size: 0, type: "audio/ogg", name: "a.ogg" }) ?? "", /vacío/);
});

test("grabación: elige el formato que soporta el navegador", () => {
  assert.equal(formatoGrabacion(() => true), "audio/webm;codecs=opus");
  assert.equal(formatoGrabacion((t) => t === "audio/mp4"), "audio/mp4");
  assert.equal(formatoGrabacion(() => false), undefined);
  assert.equal(formatoDuracion(75), "1:15");
  assert.equal(formatoDuracion(180), "3:00");
});

test("la transcripción del audio llega hasta el resultado final", () => {
  const llm = parsearRespuesta(
    JSON.stringify({ veredicto: "estafa", score: 90, banderas: ["Voz de familiar pide plata"], que_hacer: ["Llamá"], resumen_abuela: "a\nb", transcripcion: " Hola ma, soy yo, transferime " }),
  );
  assert.equal(llm.transcripcion, "Hola ma, soy yo, transferime");
  assert.equal(combinarScore(llm, []).transcripcion, "Hola ma, soy yo, transferime");
  const sinAudio = parsearRespuesta(JSON.stringify({ veredicto: "seguro", score: 5, banderas: [], que_hacer: [], resumen_abuela: "x", transcripcion: "" }));
  assert.equal("transcripcion" in sinAudio, false);
});
