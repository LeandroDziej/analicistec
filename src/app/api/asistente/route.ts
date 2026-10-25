import { GeminiError } from "@/lib/gemini";
import { EntradaError } from "@/lib/entrada";
import { respuestaPandaSinIA, responderPanda, validarEntradaPanda } from "@/lib/asistente";
import { crearLimitador, ipDe } from "@/lib/rateLimit";

// El chat genera más consultas que el análisis: un poco más de margen por minuto.
const limitador = crearLimitador(12);

export async function POST(request: Request) {
  const limite = limitador(ipDe(request.headers));
  if (!limite.permitido) {
    return Response.json(
      { error: `Le hiciste muchas preguntas seguidas a Pandi. Esperá ${limite.reintentarEn} segundos y seguimos.` },
      { status: 429, headers: { "Retry-After": String(limite.reintentarEn) } },
    );
  }
  try {
    let cuerpo: unknown;
    try {
      cuerpo = await request.json();
    } catch {
      throw new EntradaError("No pudimos leer tu pregunta. Probá de nuevo.");
    }
    const entrada = validarEntradaPanda(cuerpo);
    try {
      return Response.json(await responderPanda(entrada));
    } catch (err) {
      if (!(err instanceof GeminiError)) throw err;
      // Sin IA disponible, Pandi igual orienta con lo básico.
      return Response.json({ respuesta: respuestaPandaSinIA(entrada.pregunta), sinIA: true });
    }
  } catch (err) {
    if (err instanceof EntradaError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof GeminiError) {
      return Response.json({ error: err.mensajeUsuario }, { status: err.status });
    }
    console.error("Error en /api/asistente:", err);
    return Response.json({ error: "Pandi tuvo un problema. Probá de nuevo en un rato." }, { status: 500 });
  }
}
