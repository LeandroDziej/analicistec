# AntiEstafa AR — Documentación funcional

| | |
|---|---|
| **Producto** | AntiEstafa AR, detector de estafas para Argentina |
| **Versión** | 1.0 (hackatón, octubre 2026) |
| **URL** | https://antiestafa-ar-2.vercel.app |
| **Repositorio** | https://github.com/Ridioortv/analicistec |

---

## 1. Propósito

AntiEstafa AR ayuda a cualquier persona a saber, en segundos, si un mensaje que recibió (por WhatsApp, SMS o mail) es una estafa, por qué lo es y qué hacer. Además cubre los dos momentos críticos que rodean a una estafa: **antes de pagar** (verificar un alias/CBU o un comprobante) y **después de detectarla** (denunciar y avisar a la familia).

## 2. Usuarios

| Perfil | Necesidad | Cómo lo resuelve la app |
|---|---|---|
| **Persona mayor** | Entender si un mensaje es peligroso sin términos técnicos. | Modo abuela, lectura en voz alta, app instalable con un ícono. |
| **Familiar que "hace de soporte técnico"** | Responder rápido el "¿esto es verdad?" del grupo familiar. | Análisis en segundos y alerta lista para reenviar por WhatsApp. |
| **Comprador/vendedor online** (Marketplace, Mercado Libre) | Detectar comprobantes falsos y pedidos de transferencia sospechosos. | Detector de comprobante y chequeo de alias/CBU. |
| **Víctima o casi víctima** | Saber cómo denunciar. | Generador de denuncia con la evidencia ordenada. |

## 3. Alcance

**Incluye:** análisis de texto e imágenes, verificación técnica de links, puntaje de riesgo, recomendaciones, chequeo de alias/CBU/CVU, análisis de comprobantes, denuncia, alertas, accesibilidad, historial local y app instalable.

**No incluye:** registro de usuarios, almacenamiento de mensajes en servidores, consulta a bases bancarias o de denuncias, bloqueo automático de números ni presentación automática de denuncias.

## 4. Requisitos funcionales

### RF-01 · Analizar un mensaje
- **Entrada:** texto pegado y/o una captura (JPG, PNG, WebP, GIF o HEIC; máximo 4 MB).
- **Proceso:** en paralelo, (a) se extraen los links del mensaje y se verifican técnicamente (RF-02) y (b) la IA (Gemini con visión) analiza el contenido con contexto de estafas argentinas.
- **Salida:** veredicto (seguro / sospechoso / estafa), puntaje 0-100, banderas rojas, pasos de "Qué hacer ahora" y un resumen en dos líneas.
- **Reglas:** si no hay texto ni imagen, se pide cargar algo. Si la imagen supera 4 MB o el formato no es válido, se avisa antes de enviar.

### RF-02 · Verificar links
- Para cada link (máximo 3 por mensaje) se obtiene: antigüedad del dominio (RDAP), presencia de certificado SSL, destino final tras las redirecciones y similitud con marcas conocidas (Mercado Pago, Mercado Libre, ARCA/AFIP, Correo Argentino, bancos) por distancia de Levenshtein.
- **Reglas:** no se accede a direcciones privadas ni locales (protección SSRF). Cada consulta tiene un tiempo máximo de 4 segundos; si vence, el análisis sigue sin ese dato. Los resultados por dominio se reutilizan durante 1 hora.

### RF-03 · Calcular el puntaje final
- Combina el puntaje de la IA con las señales técnicas (dominio nuevo, marca imitada, sin SSL). Una señal técnica fuerte puede elevar el riesgo aunque el texto parezca inocente.
- **Semáforo:** 🟢 seguro · 🟡 sospechoso · 🔴 estafa.

### RF-04 · Mostrar el dominio engañoso
- En cada link revisado se resalta la parte que difiere de la marca oficial (por ejemplo `mercadopag0` frente a `mercadopago`) y se informa la antigüedad del dominio y si tiene SSL.

### RF-05 · "Así se ve el real"
- Si un link imita a una marca, se muestran 2 o 3 reglas generales de cómo se comunica de verdad esa empresa (por ejemplo, "nunca te pide claves por mensaje").
- **Regla:** no se muestran datos ni URLs específicos que no estén verificados.

### RF-06 · Preguntas para afinar
- Tres preguntas opcionales de sí/no: "¿Te pidieron plata o datos?", "¿Conocés a quien te lo mandó?", "¿Te apuran para hacerlo ya?".
- Las respuestas se suman al análisis de la IA. Si no se responden, el análisis funciona igual.

### RF-07 · Progreso visible
- Mientras se analiza se muestran los pasos: "Revisando links…" (solo si hay links), "Analizando el mensaje…", "Calculando el riesgo…".

### RF-08 · Ejemplos de un toque
- Botones con mensajes de ejemplo (falso ARCA, falso Mercado Pago, falso Correo Argentino, "hola mamá" y uno legítimo) que se cargan en el cuadro de texto. Usan dominios inventados.

### RF-09 · Chequear un alias, CBU o CVU antes de transferir
- **Entrada:** el alias/CBU/CVU de destino y, opcionalmente, el mensaje que acompaña el pedido.
- **Proceso:** validación de formato (CBU/CVU de 22 dígitos con dígitos verificadores; alias de 6 a 20 caracteres con letras, números, punto o guion) y evaluación del contexto con IA.
- **Salida:** nivel de riesgo (bajo, medio, alto), señales y una recomendación.
- **Regla:** nunca se afirma que una cuenta es segura; siempre se recomienda verificar por otro canal antes de transferir.

### RF-10 · Detectar un comprobante falso
- **Entrada:** captura del comprobante (PNG, JPG o WebP, máximo 4 MB).
- **Salida:** "parece real", "sospechoso" o "probablemente falso", con señales y recomendación.
- **Regla:** nunca se afirma certeza; siempre se recomienda confirmar el ingreso en la app del banco o la billetera.

### RF-11 · Generar una denuncia
- Arma un texto formal con fecha y hora, mensaje recibido, links, señales detectadas, veredicto y puntaje, y una sección de dónde presentarla (de forma genérica).
- Acciones: copiar, descargar como `.txt` e imprimir o guardar como PDF.

### RF-12 · Alertar a la familia
- Genera un texto de alerta listo para compartir, con botón para copiar y botón "Mandar por WhatsApp" que abre WhatsApp con el texto cargado.

### RF-13 · Modo abuela y lectura en voz alta
- Modo abuela: letra grande y el resultado resumido en dos líneas.
- Botón "Escuchar" que lee el resumen con voz en español (es-AR si está disponible) y "Detener". Se oculta si el navegador no lo soporta.

### RF-14 · Historial local
- Guarda los últimos 10 análisis **solo en el dispositivo** (almacenamiento del navegador). Se pueden ver y borrar. Nunca se envían al servidor.

### RF-15 · Instalar como app
- Botón "Instalar app" visible arriba de todo, en la compu y el celular. Instala con un clic cuando el navegador lo permite; si no, muestra instrucciones según el navegador (Chrome/Edge, Android, Samsung, iPhone/iPad, Safari en Mac, Firefox). Se oculta si la app ya está instalada.

## 5. Flujos principales

**Analizar un mensaje**
```
Pegar texto o subir captura → (opcional) responder preguntas → "¿Es estafa? Analizar"
→ progreso por pasos → semáforo + puntaje → banderas, qué hacer, links revisados
→ (opcional) modo abuela / escuchar / alerta / WhatsApp / denuncia
```

**Antes de transferir**
```
"¿Te pidieron que transfieras?" → alias/CBU/CVU + mensaje → "Revisar antes de transferir"
→ riesgo bajo/medio/alto + señales + recomendación
```

**Comprobante recibido**
```
"¿Te mandaron un comprobante?" → subir captura → "Revisar comprobante"
→ parece real / sospechoso / probablemente falso + recomendación
```

## 6. Requisitos no funcionales

| Categoría | Requisito |
|---|---|
| **Privacidad** | No se guardan mensajes en el servidor. El historial vive solo en el dispositivo. Sin registro. |
| **Seguridad** | Protección SSRF, rate limit por IP, límite de 4 MB por imagen, claves solo en variables de entorno. |
| **Rendimiento** | Chequeos en paralelo, máximo 3 links, caché de 1 hora por dominio, timeouts de 4 s. |
| **Disponibilidad** | Reintentos y modelos alternativos ante sobrecarga de la IA (errores 429/503/504), con mensaje amable al usuario. |
| **Accesibilidad** | Mobile first, botones grandes, etiquetas para lectores de pantalla, modo abuela, lectura en voz alta. |
| **Idioma** | Español rioplatense. |
| **Calidad** | Más de 100 tests automáticos, lint y verificación de tipos. |

## 7. Mensajes del sistema

| Situación | Mensaje |
|---|---|
| Se tocó Analizar sin cargar nada | "Pegá el mensaje o subí una captura para analizar." |
| Sin conexión | "No pudimos conectarnos. Revisá tu internet y probá de nuevo." |
| IA sobrecargada o límite de uso | Mensaje amable pidiendo reintentar en unos minutos. |
| Imagen muy grande o formato inválido | Aviso antes de enviar. |
| Copiado automático no disponible | "No pudimos copiar solo: mantené apretado el texto y elegí Copiar." |

## 8. Limitaciones conocidas

- El resultado es una **orientación**, no una certeza: la app puede equivocarse en ambos sentidos.
- La verificación de comprobantes es visual; no consulta al banco.
- La antigüedad de algunos dominios puede no estar disponible (RDAP); en ese caso se informa "Antigüedad desconocida".
- La instalación como app depende del navegador (Firefox en la compu no la permite).
- El servicio de IA puede estar sobrecargado en momentos puntuales.

## 9. Glosario

| Término | Significado |
|---|---|
| **Phishing** | Mensaje que imita a una empresa u organismo para robar datos o dinero. |
| **Dominio** | La parte principal de una dirección web (por ejemplo `mercadopago.com.ar`). |
| **RDAP** | Servicio público que informa cuándo se registró un dominio. |
| **SSL** | Certificado que cifra la conexión (el candado del navegador). No garantiza que el sitio sea legítimo. |
| **Levenshtein** | Medida de cuántas letras difieren dos palabras; detecta imitaciones como `mercadopag0`. |
| **PWA** | Página web que se puede instalar como una app. |
| **CBU / CVU / alias** | Identificadores de cuentas bancarias y virtuales en Argentina. |
