import { analizarConGemini, GeminiError } from "@/lib/gemini";
import { EntradaError, leerEntrada } from "@/lib/entrada";

export async function POST(request: Request) {
  try {
    const entrada = await leerEntrada(request);
    const { analisis, modelo } = await analizarConGemini(entrada);
    return Response.json({ ...analisis, modelo });
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
