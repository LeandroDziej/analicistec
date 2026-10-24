# LOG

- 2026-10-24: Scaffold Next.js 16.4.3 (App Router, TS, Tailwind v4, cacheComponents activo -> no usar runtime="nodejs"), .gitignore con .env.local, .env.example. Build OK.
- 2026-10-24: /api/analyze (texto -> JSON con @google/genai, responseSchema, timeout 20s, fallback a 3 flash recientes vía models.list ante 404/503/504, 429 amable). 7 tests mock OK, build OK, 2 llamadas reales (1ra 503 por alta demanda, 2da OK con gemini-3.8-flash).
