import { GeminiError } from "@/lib/gemini";
import { EntradaError } from "@/lib/entrada";
import { analizarComprobante, leerComprobante } from "@/lib/comprobante";

export async function POST(request: Request) {
  try {
    const imagen = await leerComprobante(request);
    return Response.json(await analizarComprobante(imagen));
  } catch (err) {
    if (err instanceof EntradaError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof GeminiError) {
      return Response.json({ error: err.mensajeUsuario }, { status: err.status });
    }
    console.error("Error en /api/comprobante:", err);
    return Response.json({ error: "Algo salió mal. Probá de nuevo en un rato." }, { status: 500 });
  }
}
