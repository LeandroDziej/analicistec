- Ejemplos de un toque: src/lib/ejemplos.ts (5 mensajes, dominios .example), src/components/EjemplosRapidos.tsx, 2 líneas en src/components/Analizador.tsx, tests/ejemplos.test.ts. Build/lint/tests OK. Merge con upstream/main sin conflictos.
- Dominio engañoso resaltado: src/lib/dominio.ts (diff de caracteres + textoAntiguedad), src/components/DominioResaltado.tsx, campo opcional dominioOficial en ResultadoLink (src/lib/links.ts), 2 líneas en Analizador.tsx, tests/dominio.test.ts. Build/lint/tests OK. Upstream sin cambios.
- Compartir por WhatsApp: urlWhatsApp() en src/lib/ui.ts (codificación testeable), usada por el botón en src/components/Analizador.tsx, test en tests/ui.test.ts. Build/lint/tests OK. Upstream sin cambios.
- Leer en voz alta: src/lib/voz.ts (elegirVoz es-AR→es-*, textoParaLeer), src/components/LeerEnVozAlta.tsx (Escuchar/Detener, oculto si no hay speechSynthesis), 2 líneas en Analizador.tsx, tests/voz.test.ts. Build/lint/tests OK. Upstream sin cambios.
- Generar denuncia: src/lib/denuncia.ts (generarDenuncia, htmlImprimible), src/components/GenerarDenuncia.tsx (Copiar, Descargar .txt, Imprimir/PDF), estado mensajeAnalizado + 3 líneas en src/components/Analizador.tsx, tests/denuncia.test.ts. Build/lint/tests OK. Upstream sin cambios.
- Detector de comprobante falso: src/lib/comprobante.ts (validación, prompt, parseo, analizarComprobante reutilizando crearCliente/GeminiError y el 429 de gemini.ts; el proyecto no tiene rate limit propio ni reintento ante 429, se devuelve el mismo mensaje amable), src/lib/comprobanteUi.ts (parte segura para el cliente), src/app/api/comprobante/route.ts, src/components/DetectorComprobante.tsx, 2 líneas en src/app/page.tsx, tests/comprobante.test.ts. Build/lint/tests OK. Upstream sin cambios.
- Chequeo de alias/CBU/CVU: src/lib/transferenciaUi.ts (validación de formato con dígitos verificadores, etiquetas, aviso), src/lib/transferencia.ts (prompt, schema, parseo, analizarTransferencia con el mismo manejo de 429 que comprobante), src/app/api/transferencia/route.ts, src/components/ChequeoTransferencia.tsx, 2 líneas en src/app/page.tsx, tests/transferencia.test.ts. Build/lint/tests OK. Upstream sin cambios.
- Verificación final: upstream/main ya estaba mergeado (sin conflictos), `npm run build`, `npm run lint` y `npm test` (69/69) pasan.

## Resumen para el Pull Request

Mejoras agregadas sobre AntiEstafa AR (sin cambiar contratos existentes; solo campos opcionales y pocas líneas en archivos de upstream):

1. **Ejemplos de un toque**: 5 mensajes de ejemplo que se cargan en el input. `src/lib/ejemplos.ts`, `src/components/EjemplosRapidos.tsx`, `tests/ejemplos.test.ts`.
2. **Dominio engañoso resaltado**: diferencia con la marca oficial y antigüedad (RDAP). `src/lib/dominio.ts`, `src/components/DominioResaltado.tsx`, campo opcional `dominioOficial` en `src/lib/links.ts`, `tests/dominio.test.ts`.
3. **Compartir por WhatsApp**: `urlWhatsApp` en `src/lib/ui.ts`, `tests/ui.test.ts`.
4. **Leer en voz alta** (modo abuela, voz es-AR): `src/lib/voz.ts`, `src/components/LeerEnVozAlta.tsx`, `tests/voz.test.ts`.
5. **Generar denuncia** (copiar, .txt, imprimir/PDF): `src/lib/denuncia.ts`, `src/components/GenerarDenuncia.tsx`, `tests/denuncia.test.ts`.
6. **Detector de comprobante falso** (Gemini visión): `src/lib/comprobante.ts`, `src/lib/comprobanteUi.ts`, `src/app/api/comprobante/route.ts`, `src/components/DetectorComprobante.tsx`, `tests/comprobante.test.ts`.
7. **Chequeo de alias/CBU/CVU**: `src/lib/transferencia.ts`, `src/lib/transferenciaUi.ts`, `src/app/api/transferencia/route.ts`, `src/components/ChequeoTransferencia.tsx`, `tests/transferencia.test.ts`.

Archivos de upstream tocados (cambios mínimos): `src/components/Analizador.tsx`, `src/app/page.tsx`, `src/lib/links.ts`, `src/lib/ui.ts`.

Qué falta / notas: el proyecto no tiene rate limit propio ni reintento ante 429, así que los endpoints nuevos devuelven el mismo mensaje amable que `/api/analyze`. No se hizo push ni deploy.
