# Reconocedor de voz propio

Sirve para analizar audios **sin IA paga**: cuando Gemini no está disponible (sin clave, cuota agotada o caído), el servidor transcribe el audio acá mismo y el motor propio analiza el texto. El audio no se manda a ningún servicio externo.

| Archivo | Qué es |
|---|---|
| `tiny-encoder.int8.onnx` | Encoder de Whisper tiny cuantizado a int8 (de sherpa-onnx). |
| `tiny-decoder.q8e.onnx` | Decoder de Whisper tiny int8, con la tabla de palabras (embedding) también pasada a int8 por fila para que pese 30 MB en vez de 90 MB. |
| `tiny-tokens.txt` | Vocabulario. |

- **Origen:** `sherpa-onnx-whisper-tiny` de https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models
- **Licencias:** Whisper (OpenAI) es MIT; sherpa-onnx es Apache 2.0. Se pueden usar comercialmente.
- **Motor:** paquete npm `sherpa-onnx-node` (se instala solo con `npm install`, trae la versión para Windows, Mac y Linux).
- Funciona con WAV. La app convierte el audio a WAV de 16 kHz en el navegador antes de mandarlo.
