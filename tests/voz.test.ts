import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { cortarEnTramos, escribirWav, leerWav, remuestrear } from "../src/lib/wav.ts";
import { analizarSinIA, corregirTranscripcion, normalizar } from "../src/lib/motorPropio.ts";
import { limpiarTranscripcion, transcribirSinIA, CARPETA_MODELO } from "../src/lib/transcribir.ts";

test("WAV: escribir y volver a leer (16 bits mono)", () => {
  const muestras = Float32Array.from({ length: 1600 }, (_, i) => Math.sin(i / 10) * 0.5);
  const onda = leerWav(escribirWav(muestras, 16000));
  assert.ok(onda);
  assert.equal(onda.frecuencia, 16000);
  assert.equal(onda.muestras.length, 1600);
  assert.ok(Math.abs(onda.muestras[100] - muestras[100]) < 0.001);
  assert.equal(leerWav(new Uint8Array(50)), null);
});

test("remuestrear de 48 kHz a 16 kHz mantiene la duración", () => {
  const r = remuestrear(new Float32Array(48000), 48000, 16000);
  assert.equal(r.length, 16000);
});

test("cortar en tramos de hasta 25 s, buscando un silencio", () => {
  const f = 16000;
  const muestras = new Float32Array(f * 60).fill(0.3);
  muestras.fill(0, f * 23, f * 23 + f / 2); // silencio a los 23 s
  const tramos = cortarEnTramos(muestras, f);
  assert.ok(tramos.length >= 3);
  assert.ok(tramos.every((t) => t.length <= 25 * f));
  assert.equal(tramos.reduce((s, t) => s + t.length, 0), muestras.length);
  assert.ok(Math.abs(tramos[0].length - 23.25 * f) < f * 0.3, `cortó en ${tramos[0].length / f}s`);
});

test("corrige palabras clave mal transcriptas", () => {
  assert.equal(corregirTranscripcion("necesito que me transiera plata"), "necesito que me transfieras plata");
  assert.equal(corregirTranscripcion("dicte el codico"), "dicte el codigo");
  assert.equal(corregirTranscripcion("hola que tal"), "hola que tal");
});

// Transcripciones reales que hizo Whisper tiny de audios de prueba (con sus errores).
test("audio sin IA: «hola ma, se me rompió el celu» con errores de transcripción → estafa", () => {
  const r = analizarSinIA(
    "Hola, soy yo, se me rompió el celular y te habló desde este número nuevo. Necesito que me transiera 80.000 pesos ahora, es urgente, después te explico, no me llame que no puedo atender.",
    { audio: true },
  );
  assert.equal(r.veredicto, "estafa");
  assert.ok(r.reglas.includes("voz-conocido"));
  assert.match(r.resumen_abuela, /audio/);
});

test("audio sin IA: falso banco que pide el código → estafa", () => {
  const r = analizarSinIA(
    "Buenas tardes, le hablamos de la área de seguridad del banco. Te detectamos un movimiento sos pecho son su cuenta para bloquearlo. Necesito que me díe el collo que le acaba de llegar por mensaje.",
    { audio: true },
  );
  assert.equal(r.veredicto, "estafa", r.reglas.join(","));
  assert.ok(r.reglas.includes("voz-banco"));
});

test("audio sin IA: un audio normal no se marca como estafa", () => {
  const r = analizarSinIA("por la te confirma el turno con la doctora para el más tesalas 10 y media, si no puedes venir, hay zanos, gracias", { audio: true });
  assert.equal(r.veredicto, "seguro");
  assert.equal(normalizar("Él"), "el");
});

test("limpia lo que Whisper agrega solo", () => {
  assert.equal(limpiarTranscripcion(" [Música] Hola ma (risas) "), "Hola ma");
  assert.equal(limpiarTranscripcion("Subtítulos realizados por la comunidad de Amara.org"), "");
});

const hayModelo = existsSync(`${CARPETA_MODELO}/tiny-encoder.int8.onnx`);
test("transcribe de verdad un audio con el modelo local (sin IA paga)", { skip: !hayModelo && "falta modelos/voz" }, async () => {
  const bytes = new Uint8Array(readFileSync(new URL("./fixtures/audio-hola-ma.wav", import.meta.url)));
  const texto = await transcribirSinIA(bytes);
  assert.ok(texto, "no transcribió nada");
  assert.match(normalizar(texto), /soy yo|celular|numero nuevo/);
  assert.equal(analizarSinIA(texto, { audio: true }).veredicto, "estafa");
  assert.equal(await transcribirSinIA(new Uint8Array([1, 2, 3])), null);
});
