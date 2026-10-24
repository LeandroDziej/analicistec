# AntiEstafa AR 🛡️

**¿Te llegó un mensaje raro? Pegalo acá y en segundos te decimos si es una estafa.**

👉 Probalo: **https://antiestafa-ar-2.vercel.app** (sin login, gratis, desde el celu)

## El pitch

En Argentina las estafas por WhatsApp y SMS son moneda corriente: el falso
ARCA/AFIP que te amenaza con un embargo, el "Mercado Pago" que te bloqueó la
cuenta, el paquete retenido de Correo Argentino, el clásico "hola ma, cambié
de número", el vendedor trucho de Marketplace, el "soporte del banco" que te
pide la clave y las inversiones cripto que duplican la plata.

Los más expuestos son justamente quienes menos herramientas tienen para
darse cuenta. **AntiEstafa AR** lo resuelve en un paso:

1. **Pegás el texto o subís la captura** del mensaje.
2. **Revisamos los links de verdad**: antigüedad del dominio (RDAP), si tiene
   SSL, a dónde redirige y si imita a una marca conocida (Mercado Libre,
   Mercado Pago, ARCA/AFIP, Correo Argentino, bancos) por distancia de
   Levenshtein.
3. **Una IA entrenada en estafas argentinas** (Gemini, con visión) lee el
   mensaje y detecta las señales de manipulación.
4. **Combinamos ambas cosas** en un puntaje 0-100 con semáforo
   🟢 seguro / 🟡 sospechoso / 🔴 estafa. Si el link es un dominio de 3 días
   que imita a Mercado Pago, lo marcamos aunque el texto parezca inocente.
5. Te decimos **qué hacer ahora**, con un **modo abuela** (letra grande,
   dos líneas, una acción) y un botón para **generar una alerta y compartirla**
   por WhatsApp con la familia.

## 5 ejemplos para la demo

Copiá y pegá cada uno en la app. Los dominios son inventados para la demo.

**1. Falso ARCA con embargo → 🔴 estafa**

```
ARCA INFORMA: Registrás una deuda de $187.430 en Ganancias. Para evitar el embargo de tus cuentas regularizá HOY en https://arca-regularizacion.com/pago antes de las 24 hs.
```

Qué muestra: suplantación de ARCA, urgencia y amenaza, link que no es
`arca.gob.ar` y marca imitada en el dominio.

**2. Falso Mercado Pago, cuenta bloqueada → 🔴 estafa**

```
Mercado Pago: tu cuenta fue BLOQUEADA por actividad inusual. Validá tu identidad en http://mercadopag0-seguridad.xyz/validar o perdés tu saldo.
```

Qué muestra: `mercadopag0` (con cero) detectado por Levenshtein, sin SSL,
pedido de validar identidad por link.

**3. "Hola ma, cambié de número" → 🔴 estafa**

```
Hola ma, cambié de número, agendá este. Estoy en un apuro, ¿me podés transferir $85.000 al alias pago.rapido.mp? Después te explico, no me llames que no puedo hablar.
```

Qué muestra: estafa sin links, detectada solo por el patrón de ingeniería
social. Probá el **modo abuela** y el botón **Generar alerta para compartir**.

**4. Falso Correo Argentino → 🔴 estafa**

```
Correo Argentino: tu paquete está retenido por falta de pago de $1.250 de aduana. Abonalo en https://correoargentlno-envios.com/pago para recibirlo mañana.
```

Qué muestra: `correoargentlno` (una "l" en vez de "i"), cobro chico para
robar la tarjeta.

**5. Mensaje legítimo → 🟢 seguro**

```
Hola! Te confirmo el turno con la Dra. Gómez el martes 28 a las 10:30 en el consultorio de siempre. Si no podés venir, avisanos por este medio. Gracias!
```

Qué muestra: que no todo es alarma; también probá subir la **captura de
pantalla** de cualquiera de los anteriores para ver la lectura por visión.

## Cómo funciona

```
texto / imagen ──► /api/analyze ──┬─► extracción de links ─► RDAP · SSL · redirects · marcas
                                  └─► Gemini (JSON con responseSchema)
                                           │
                                 score combinado + veredicto ─► UI
```

- `src/lib/links.ts`: extracción y chequeo de links, Levenshtein contra marcas,
  anti-SSRF (bloquea IPs privadas/localhost) y timeouts.
- `src/lib/gemini.ts`: system prompt con contexto de estafas argentinas,
  salida JSON validada, fallback entre modelos flash y reintento ante 429.
- `src/lib/score.ts`: combina señales técnicas con el veredicto del LLM.
- `src/lib/rateLimit.ts`: rate limit básico por IP. Imágenes hasta 4 MB.
- `src/components/Analizador.tsx`: UI mobile first.

## Correrlo local

```powershell
npm install
Copy-Item .env.example .env.local   # y completá GEMINI_API_KEY
npm run dev
```

Tests (con Gemini y red simulados, no gastan cuota):

```powershell
npm test
```

Stack: Next.js (App Router) + TypeScript + Tailwind, `@google/genai`, deploy en Vercel.
