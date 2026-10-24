import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // La página /ayuda lee el manual de docs/ en el servidor.
  outputFileTracingIncludes: {
    "/ayuda": ["./docs/MANUAL_DE_USUARIO.md"],
  },
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
