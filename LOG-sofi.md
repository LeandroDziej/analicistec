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

## Análisis más rápido
- Antes (medido local): RDAP ~1,4 s; seguir redirecciones hasta 5,2 s (timeout de 5 s); links completos ~0,8 s; Gemini ~2,6 s si responde el primer modelo (40 s cuando los flash dieron 503/504 en cadena).
- Cambios: máx. 3 links, timeouts de RDAP y fetch de 4 s (si vencen se sigue sin ese dato), caché en memoria 1 h de RDAP y SSL por dominio (`src/lib/cacheTtl.ts`, solo guarda datos obtenidos), thinking bajo (`configThinking`: gemini-3.8-flash rechaza MINIMAL con 400, por eso LOW; presupuesto 0 en versiones <3), log de tiempos en /api/analyze. Gemini y links ya corrían en paralelo y sin links no se hace chequeo.
- Después: links 2ª vez con caché ~0,3 s (antes ~0,8 s); Gemini ~3 s cuando responde (la variación la domina la sobrecarga del servicio, 504 en la 1ª llamada); redirecciones ~0,1 s en esa corrida. Tests 97 OK, lint y build OK.

## Progreso visible
- Mientras analiza se muestran pasos ("Revisando links..." solo si hay links, "Analizando el mensaje...", "Calculando el riesgo...") con aria-live. `src/lib/progreso.ts`, `src/components/ProgresoAnalisis.tsx`, `tests/progreso.test.ts`; una línea en `Analizador.tsx`. Tests 100 OK, lint y build OK.

## Preguntas para afinar
- 3 preguntas opcionales sí/no bajo el cuadro de texto (tocar de nuevo la opción la deja sin responder). `src/lib/preguntas.ts` (validación y texto para el prompt), `src/components/PreguntasAfinar.tsx`, campo opcional `contexto` en `EntradaAnalisis`/`leerEntrada` (multipart o JSON) y sumado al prompt en `construirContenido`; sin respuestas el contrato y el prompt no cambian. `tests/preguntas.test.ts`. Tests 105 OK, lint y build OK.

## Así se ve el real
- Cuando un link imita una marca (`marcaImitada`), el resultado muestra un recuadro con 3 reglas generales de cómo se comunica la marca de verdad (Mercado Pago, Mercado Libre, ARCA/AFIP, Correo Argentino; el resto de bancos comparte reglas genéricas). Sin datos ni URLs específicos. `src/lib/marcaReal.ts`, `src/components/AsiSeVeElReal.tsx`, `tests/marcaReal.test.ts`; dos líneas en `Analizador.tsx`. Tests 108 OK, lint y build OK.

## Historial local
- Últimos 10 análisis guardados solo en localStorage (try/catch, no rompe sin almacenamiento), con botón "Ver mis últimos análisis" y "Borrar historial"; nada se envía al servidor. `src/lib/historial.ts`, `src/components/HistorialLocal.tsx`, `tests/historial.test.ts`; unas líneas en `Analizador.tsx`. Tests 112 OK, lint y build OK.

## PWA instalable
- Manifest "AntiEstafa AR" (`src/app/manifest.ts` + `src/lib/pwa.ts`), ícono SVG `public/icono.svg`, theme color en `layout.tsx` y botón "Agregar a la pantalla de inicio" (`src/components/BotonInstalar.tsx`, solo aparece si el navegador dispara `beforeinstallprompt`). Tests 113 OK, lint y build OK.

## Verificación final 2
- Merge con upstream/main al día (sin cambios nuevos). Build, lint y 113 tests OK.
- Tiempos de análisis (ver "Análisis más rápido"): antes, links completos ~0,8 s, redirecciones hasta 5,2 s, Gemini ~2,6 s (hasta 40 s con 503/504 en cadena); después, links con caché ~0,3 s, timeouts de 4 s, máx. 3 links, Gemini ~3 s con thinking bajo.
- Resumen para el Pull Request: análisis más rápido (caché 1 h de RDAP/SSL, máx. 3 links, timeouts de 4 s, thinking bajo); progreso visible por pasos; preguntas opcionales sí/no para afinar; recuadro "Así se ve el real" con reglas generales de la marca imitada; historial local de los últimos 10 análisis (solo en el dispositivo); app instalable (PWA) con botón de agregar a la pantalla de inicio; más ejemplos de un toque, dominio engañoso resaltado, compartir por WhatsApp, leer en voz alta, generar denuncia, detector de comprobante falso y chequeo de alias/CBU/CVU.
