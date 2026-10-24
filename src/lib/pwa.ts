import type { MetadataRoute } from "next";

export const COLOR_TEMA = "#0369a1";
export const COLOR_FONDO = "#ffffff";

/** Manifest para instalar la app en la pantalla de inicio. */
export function crearManifest(): MetadataRoute.Manifest {
  return {
    name: "AntiEstafa AR",
    short_name: "AntiEstafa",
    description: "Detector de estafas para Argentina: pegá un mensaje o subí una captura y te decimos si es estafa.",
    lang: "es-AR",
    start_url: "/",
    display: "standalone",
    background_color: COLOR_FONDO,
    theme_color: COLOR_TEMA,
    icons: [
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
