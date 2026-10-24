Sos un ingeniero senior. Construís "AntiEstafa AR": un detector de estafas
para Argentina (texto o captura de WhatsApp) y lo ponés en producción.
Trabajás en Windows 10 con PowerShell: usá comandos compatibles (sin
chmod, sin &&, sin rm -rf; usá Remove-Item, ;, etc.).
Si la carpeta no es un repo git, corré git init y configurá user.name y
user.email solo para este repo. Escribí todos los archivos en UTF-8 sin BOM
(incluidos LOG.md, package.json y .gitignore). Agregá loop.ps1 y STATUS.md
a .gitignore antes del primer commit.

REGLAS DEL LOOP
1. Leé PLAN.md. Tomá SOLO la primera tarea sin tildar.
2. Implementala, corré build/tests y arreglá hasta que pase.
3. Tildá la tarea en PLAN.md, anotá una línea en LOG.md y hacé git commit.
4. Si una tarea falla 3 veces, anotá el bloqueo en LOG.md y pasá a la siguiente.
5. No hagas más de UNA tarea por ejecución. Al terminarla, frená.
6. Cuando todas estén tildadas y la URL de producción responda 200,
   escribí DONE en la primera línea de STATUS.md.

STACK
- Next.js (App Router) + TypeScript + Tailwind. Si la versión de Next.js
  tiene Cache Components activado, no uses export const runtime = "nodejs"
  en las rutas (rompe el build).
- SDK @google/genai, modelo "gemini-3.8-flash" con visión.
  Si falla, listá los modelos disponibles con models.list y usá el flash más reciente.
  Ante 503, 504, 404 o timeout (20 s por intento), probá hasta 3 modelos
  flash recientes en orden y recordá el que respondió.
- Pedí salida JSON con responseMimeType "application/json" y un
  responseSchema; parseá con try/catch.
- Para probar, hacé como máximo 2 llamadas reales a Gemini por tarea;
  el resto de los tests con respuestas simuladas (la cuota gratis es chica).
- RDAP para antigüedad de dominios (sin API key): usá rdap.org con un
  header User-Agent, porque sin él responde 403.
- Deploy en Vercel con CLI (si no está instalado, usá npx vercel@latest).
  Usá siempre --token $env:VERCEL_TOKEN.
  Nombre del proyecto en Vercel: antiestafa-ar-2 (el nombre antiestafa-ar
  ya existe: no lo toques ni lo uses).
  Cargá la variable en producción con:
  $env:GEMINI_API_KEY | vercel env add GEMINI_API_KEY production --token $env:VERCEL_TOKEN
  y desplegá con: vercel --prod --yes --token $env:VERCEL_TOKEN
  Al cargar la variable, forzá UTF-8 sin BOM (PowerShell 5.1 agrega un
  carácter invisible al principio si usás el pipe normal), y en el código
  limpiá espacios y ese carácter de la key.
- La GEMINI_API_KEY va SOLO en variables de entorno (.env.local para
  desarrollo, ignorado por git). Nunca en el código ni en commits.
- Dependencias livianas. Si una librería da problemas en Windows,
  reemplazala por una alternativa o implementalo a mano.

PRODUCTO
- Input: texto pegado o imagen subida.
- Extrae links y chequea: antigüedad del dominio (RDAP), SSL, redirecciones,
  similitud con marcas (mercadolibre, mercadopago, arca/afip,
  correoargentino, bancos) con distancia de Levenshtein.
- El LLM devuelve JSON: {veredicto: "seguro"|"sospechoso"|"estafa",
  score: 0-100, banderas: [...], que_hacer: [...],
  resumen_abuela: "2 líneas"}.
- El system prompt incluye contexto de estafas argentinas: falso ARCA/AFIP,
  Mercado Pago, Correo Argentino, "hola mamá/papá cambié de número",
  Marketplace, soporte bancario falso, inversiones/cripto falsas.
- El score final combina señales técnicas (dominio nuevo, marca imitada,
  sin SSL) con el veredicto del LLM.
- UI: semáforo, puntaje, banderas, "Qué hacer ahora", modo abuela,
  botón "Generar alerta para compartir" (texto copiable).
- Mobile first, español rioplatense, sin login.
- Protecciones: límite de 4 MB por imagen, rate limit básico por IP,
  timeout al hacer fetch de links (SSRF: bloquear IPs privadas y localhost).
- Ante errores 429 de la API de Gemini, reintentá con espera y mostrá un
  mensaje amable al usuario.
