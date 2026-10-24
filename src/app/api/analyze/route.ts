import { analizarConGemini, GeminiError } from "@/lib/gemini";
import { EntradaError, leerEntrada } from "@/lib/entrada";
import { verificarLinks, type ResultadoLink } from "@/lib/links";
import { combinarScore } from "@/lib/score";

export async function POST(request: Request) {
  try {
    const entrada = await leerEntrada(request);
    const chequeoLinks: Promise<ResultadoLink[]> = entrada.texto
      ? verificarLinks(entrada.texto).catch((err) => {
          console.warn("Chequeo de links falló:", err);
          return [];
        })
      : Promise.resolve([]);
    const [{ analisis, modelo }, links] = await Promise.all([analizarConGemini(entrada), chequeoLinks]);
    return Response.json({ ...combinarScore(analisis, links), modelo });
  } catch (err) {
    if (err instanceof EntradaError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof GeminiError) {
      return Response.json({ error: err.mensajeUsuario }, { status: err.status });
    }
    console.error("Error en /api/analyze:", err);
    return Response.json({ error: "Algo salió mal. Probá de nuevo en un rato." }, { status: 500 });
  }
}
