import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // La página /ayuda lee el manual de docs/ en el servidor.
  outputFileTracingIncludes: {
    "/ayuda": ["./docs/MANUAL_DE_USUARIO.md"],
    // Reconocedor de voz propio (Whisper tiny + sherpa-onnx) para analizar audios sin IA paga.
    "/api/analyze": ["./modelos/voz/**", "./node_modules/sherpa-onnx-node/**", "./node_modules/sherpa-onnx-linux-x64/**"],
    "/api/v1/analizar": ["./modelos/voz/**", "./node_modules/sherpa-onnx-node/**", "./node_modules/sherpa-onnx-linux-x64/**"],
  },
  // Módulo nativo: se carga en tiempo de ejecución, no se empaqueta.
  serverExternalPackages: ["sherpa-onnx-node"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
