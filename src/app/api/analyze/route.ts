import { analizarConGemini, GeminiError } from "@/lib/gemini";

const MAX_TEXTO = 5000;

export async function POST(request: Request) {
  let body: { texto?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Mandanos el mensaje en formato JSON." }, { status: 400 });
  }

  const texto = typeof body?.texto === "string" ? body.texto.trim() : "";
  if (!texto) {
    return Response.json({ error: "Pegá el mensaje que querés revisar." }, { status: 400 });
  }
  if (texto.length > MAX_TEXTO) {
    return Response.json({ error: `El mensaje es muy largo (máximo ${MAX_TEXTO} caracteres).` }, { status: 413 });
  }

  try {
    const { analisis, modelo } = await analizarConGemini({ texto });
    return Response.json({ ...analisis, modelo });
  } catch (err) {
    if (err instanceof GeminiError) {
      return Response.json({ error: err.mensajeUsuario }, { status: err.status });
    }
    console.error("Error en /api/analyze:", err);
    return Response.json({ error: "Algo salió mal. Probá de nuevo en un rato." }, { status: 500 });
  }
}
