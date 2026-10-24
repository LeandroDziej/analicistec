export interface PreguntaQuiz {
  id: string;
  mensaje: string;
  esEstafa: boolean;
  explicacion: string;
  pistas: string[];
}

// Los dominios de los ejemplos son ficticios (.example): no apuntan a ningún sitio real.
export const PREGUNTAS_QUIZ: PreguntaQuiz[] = [
  {
    id: "arca",
    mensaje: "ARCA: detectamos una deuda pendiente a tu nombre. Regularizá hoy para evitar el embargo de tus cuentas: https://arca-regularizar.example/deuda",
    esEstafa: true,
    explicacion: "ARCA no avisa deudas ni embargos por mensaje con links. Mete apuro («hoy»), amenaza con perder las cuentas y el sitio no es arca.gob.ar.",
    pistas: ["Apuro y amenaza", "El link no es arca.gob.ar", "Quiere que regularices por mensaje"],
  },
  {
    id: "turno",
    mensaje: "Hola Lucía, te confirmo el turno con la doctora para el jueves a las 10:30. Si no podés venir, avisanos con 24 hs de anticipación.",
    esEstafa: false,
    explicacion: "No pide plata, ni claves, ni códigos, y no trae links. Es un recordatorio normal. Si querés estar seguro, llamá al consultorio.",
    pistas: ["No trae links", "No pide datos ni dinero", "No te apura"],
  },
  {
    id: "mama",
    mensaje: "Hola mamá, cambié de número. Guardame este. Estoy en un apuro y no puedo entrar al banco, ¿me hacés una transferencia de $150.000? Después te explico.",
    esEstafa: true,
    explicacion: "Es la estafa del «hola mamá»: alguien se hace pasar por un familiar con número nuevo y pide plata con apuro. Antes de transferir, llamá al número de siempre de esa persona.",
    pistas: ["Número desconocido que dice ser un familiar", "Pide plata con apuro", "No puede hablar ni explicar"],
  },
  {
    id: "pedido",
    mensaje: "Mercado Libre: tu pedido salió para tu domicilio y llega hoy. Podés seguirlo desde la sección Compras de la app.",
    esEstafa: false,
    explicacion: "No trae links, no pide datos y te manda a la app que ya tenés. Una estafa te pediría entrar a un link para «confirmar» o «pagar» algo.",
    pistas: ["Te manda a tu app, no a un link", "No pide datos ni pagos"],
  },
  {
    id: "codigo",
    mensaje: "Tu código de verificación de WhatsApp es 482-193. No lo compartas con nadie.",
    esEstafa: false,
    explicacion: "Es el mensaje normal de WhatsApp si vos pediste el código. El peligro es que alguien te lo pida después: si te dicen «me equivoqué, pasame el código», es una estafa. Ese código nunca se comparte.",
    pistas: ["Dice que no lo compartas", "La estafa viene cuando alguien te lo pide"],
  },
  {
    id: "correo",
    mensaje: "Correo Argentino: tu paquete está retenido por una tasa de $1.850. Pagala hoy en https://correo-argentino-envios.example/pagar o lo devolvemos.",
    esEstafa: true,
    explicacion: "El Correo no cobra tasas por mensaje con links. El dominio imita al oficial (correoargentino.com.ar) y mete apuro para que no pienses.",
    pistas: ["Cobra una tasa por mensaje", "El dominio imita al oficial", "Amenaza con devolver el paquete"],
  },
];

export function nivelQuiz(aciertos: number, total: number): { titulo: string; texto: string } {
  const r = total === 0 ? 0 : aciertos / total;
  if (r === 1) return { titulo: "¡Perfecto!", texto: "Detectaste todo. Compartí el quiz con alguien que lo necesite." };
  if (r >= 0.66) return { titulo: "Muy bien", texto: "Te falta poco. Repasá las pistas de los mensajes que fallaste." };
  if (r >= 0.33) return { titulo: "Vas por buen camino", texto: "Las estafas son cada vez más parecidas a lo real. Fijate en las pistas y probá de nuevo." };
  return { titulo: "Ahora ya sabés qué mirar", texto: "Les pasa a muchos. Probá de nuevo con las pistas en mente." };
}

export function textoCompartirQuiz(aciertos: number, total: number, url: string): string {
  return `Saqué ${aciertos}/${total} en el quiz de AntiEstafa AR. ¿Podés detectar cuáles son estafas?${url ? ` ${url}` : ""}`;
}