import type { MetadataRoute } from "next";

export const COLOR_TEMA = "#0b5a68";
export const COLOR_FONDO = "#ffffff";

/** Manifest para instalar la app en la pantalla de inicio. */
export function crearManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AntiEstafa AR",
    short_name: "AntiEstafa",
    description: "Detector de estafas para Argentina: pegá un mensaje o subí una captura y te decimos si es estafa.",
    lang: "es-AR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: COLOR_FONDO,
    theme_color: COLOR_TEMA,
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}

export type Plataforma =
  | "chromium-compu"
  | "chromium-android"
  | "samsung"
  | "ios"
  | "safari-mac"
  | "firefox-compu"
  | "firefox-android"
  | "otro";

/**
 * Detecta navegador y sistema a partir del user agent.
 * `toques` es navigator.maxTouchPoints: los iPad nuevos se presentan como Mac,
 * pero tienen pantalla táctil.
 */
export function detectarPlataforma(ua: string, toques = 0): Plataforma {
  const esAndroid = /Android/i.test(ua);
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && toques > 1)) return "ios";
  if (/Firefox|FxiOS/i.test(ua)) return esAndroid ? "firefox-android" : "firefox-compu";
  if (/Chrome|Chromium|CriOS|Edg\/|OPR\//i.test(ua)) return esAndroid ? "chromium-android" : "chromium-compu";
  if (/Macintosh/i.test(ua) && /Safari/i.test(ua)) return "safari-mac";
  return "otro";
}

export type Instrucciones = {
  titulo: string;
  pasos: string[];
  /** true si el navegador no permite instalar y conviene ofrecer copiar el link */
  copiarLink: boolean;
};

/** Instrucciones cortas para instalar la app cuando el navegador no lo hace con un clic. */
export function instruccionesInstalar(p: Plataforma): Instrucciones {
  switch (p) {
    case "chromium-compu":
      return {
        titulo: "Instalala en tu compu",
        pasos: [
          "En la barra de direcciones, a la derecha, tocá el ícono de instalar (una pantallita con una flecha).",
          "Si no lo ves, abrí el menú del navegador (⋮ o …) y buscá la opción «Instalar».",
        ],
        copiarLink: false,
      };
    case "chromium-android":
      return {
        titulo: "Agregala a tu celular",
        pasos: ["Tocá el menú ⋮ arriba a la derecha.", "Elegí «Instalar app» o «Agregar a la pantalla principal»."],
        copiarLink: false,
      };
    case "samsung":
      return {
        titulo: "Agregala a tu celular",
        pasos: ["Tocá el menú ☰ abajo a la derecha.", "Elegí «Agregar página a» → «Pantalla de inicio»."],
        copiarLink: false,
      };
    case "ios":
      return {
        titulo: "Agregala a tu iPhone o iPad",
        pasos: [
          "Tocá el botón Compartir (el cuadrado con una flecha hacia arriba).",
          "Bajá y elegí «Agregar a inicio».",
        ],
        copiarLink: false,
      };
    case "safari-mac":
      return {
        titulo: "Agregala a tu Mac",
        pasos: [
          "En la barra de menú, abrí «Archivo» y elegí «Agregar al Dock».",
          "Si esa opción no aparece, guardala en favoritos con Cmd+D.",
        ],
        copiarLink: true,
      };
    case "firefox-android":
      return {
        titulo: "Agregala a tu celular",
        pasos: ["Tocá el menú ⋮.", "Elegí «Instalar» o «Agregar a la pantalla de inicio»."],
        copiarLink: false,
      };
    case "firefox-compu":
      return {
        titulo: "Guardala para tenerla a mano",
        pasos: [
          "Firefox en la compu no permite instalar apps web.",
          "Guardala en favoritos con Ctrl+D, o abrila en Chrome o Edge para instalarla.",
        ],
        copiarLink: true,
      };
    default:
      return {
        titulo: "Guardala para tenerla a mano",
        pasos: [
          "Este navegador no permite instalar apps web.",
          "Guardala en favoritos, o abrila en Chrome, Edge o Safari para instalarla.",
        ],
        copiarLink: true,
      };
  }
}
