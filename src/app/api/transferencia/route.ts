import { GeminiError } from "@/lib/gemini";
import { EntradaError } from "@/lib/entrada";
import { analizarTransferencia, validarEntradaTransferencia } from "@/lib/transferencia";
import { crearLimitador, ipDe } from "@/lib/rateLimit";

const limitador = crearLimitador();

export async function POST(request: Request) {
  const limite = limitador(ipDe(request.headers));
  if (!limite.permitido) {
    return Response.json(
      { error: `Hiciste muchas consultas seguidas. Esperá ${limite.reintentarEn} segundos y probá de nuevo.` },
      { status: 429, headers: { "Retry-After": String(limite.reintentarEn) } },
    );
  }
  try {
    let cuerpo: unknown;
    try {
      cuerpo = await request.json();
    } catch {
      throw new EntradaError("No pudimos leer lo que mandaste. Probá de nuevo.");
    }
    const { destino, mensaje } = validarEntradaTransferencia(cuerpo);
    return Response.json(await analizarTransferencia({ destino: destino.normalizado, tipo: destino.tipo ?? "alias", mensaje }));
  } catch (err) {
    if (err instanceof EntradaError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof GeminiError) {
      return Response.json({ error: err.mensajeUsuario }, { status: err.status });
    }
    console.error("Error en /api/transferencia:", err);
    return Response.json({ error: "Algo salió mal. Probá de nuevo en un rato." }, { status: 500 });
  }
}
