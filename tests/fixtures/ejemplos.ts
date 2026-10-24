import type { AnalisisLLM, Veredicto } from "../../src/lib/gemini.ts";

/** Datos simulados de un dominio: DNS, fecha de registro (RDAP) y SSL. */
export interface DominioSimulado {
  ip: string;
  registro: string;
  ssl: boolean;
}

export interface Ejemplo {
  nombre: string;
  tipo: "estafa" | "legitimo";
  texto: string;
  /** Veredicto final esperado. */
  esperado: Veredicto;
  /** Respuesta simulada de Gemini. */
  llm: AnalisisLLM;
  /** Marca que debería detectarse como imitada en algún link. */
  marcaImitada?: string;
}

export const AHORA = Date.parse("2026-10-24T12:00:00Z");

const diasAtras = (d: number) => new Date(AHORA - d * 86_400_000).toISOString();

/** "Internet" simulada: dominios que resuelven, con su RDAP y SSL. */
export const DOMINIOS: Record<string, DominioSimulado> = {
  "arca-regularizacion.com": { ip: "203.0.113.10", registro: diasAtras(5), ssl: true },
  "mercadopag0-seguridad.xyz": { ip: "203.0.113.11", registro: diasAtras(2), ssl: false },
  "correoargentlno-envios.com": { ip: "203.0.113.12", registro: diasAtras(12), ssl: true },
  "mercadolibre.com.ar": { ip: "198.51.100.20", registro: "1999-08-02T00:00:00Z", ssl: true },
  "arca.gob.ar": { ip: "198.51.100.21", registro: "2024-10-01T00:00:00Z", ssl: true },
};

export const EJEMPLOS: Ejemplo[] = [
  {
    nombre: "Falso ARCA con deuda y embargo",
    tipo: "estafa",
    texto:
      "ARCA INFORMA: Registrás una deuda de $187.430 en Ganancias. Para evitar el embargo de tus cuentas regularizá HOY en https://arca-regularizacion.com/pago antes de las 24 hs.",
    esperado: "estafa",
    marcaImitada: "ARCA",
    llm: {
      veredicto: "estafa",
      score: 90,
      banderas: ["Se hace pasar por ARCA", "Amenaza de embargo con urgencia", "Link que no es arca.gob.ar"],
      que_hacer: ["No toques el link", "Entrá vos a arca.gob.ar con tu clave fiscal para verificar"],
      resumen_abuela: "Es una trampa: ARCA no manda links por WhatsApp.\nNo pagues nada y borrá el mensaje.",
    },
  },
  {
    nombre: "Falso Mercado Pago, cuenta bloqueada",
    tipo: "estafa",
    texto:
      "Mercado Pago: tu cuenta fue BLOQUEADA por actividad inusual. Validá tu identidad en http://mercadopag0-seguridad.xyz/validar o perdés tu saldo.",
    esperado: "estafa",
    marcaImitada: "Mercado Pago",
    llm: {
      veredicto: "estafa",
      score: 88,
      banderas: ["Imita a Mercado Pago", "Pide validar identidad por link", "Amenaza con perder el saldo"],
      que_hacer: ["No abras el enlace", "Revisá tu cuenta solo desde la app oficial"],
      resumen_abuela: "Es un engaño para robarte la cuenta.\nNo toques el link.",
    },
  },
  {
    nombre: "Hola mamá, cambié de número",
    tipo: "estafa",
    texto:
      "Hola ma, cambié de número, agendá este. Estoy en un apuro, ¿me podés transferir $85.000 al alias pago.rapido.mp? Después te explico, no me llames que no puedo hablar.",
    esperado: "estafa",
    llm: {
      veredicto: "estafa",
      score: 85,
      banderas: ["Dice ser un familiar con número nuevo", "Pide plata urgente", "Evita que lo llames"],
      que_hacer: ["Llamá al número viejo de tu hijo/a", "No transfieras nada"],
      resumen_abuela: "Puede no ser tu hijo: llamalo al número de siempre.\nNo mandes plata.",
    },
  },
  {
    nombre: "Falso Correo Argentino, paquete retenido",
    tipo: "estafa",
    texto:
      "Correo Argentino: tu paquete está retenido en aduana. Aboná el arancel de $1.500 en correoargentlno-envios.com/pago para liberarlo.",
    esperado: "estafa",
    marcaImitada: "Correo Argentino",
    llm: {
      veredicto: "sospechoso",
      score: 60,
      banderas: ["Cobro de arancel por un paquete", "Link que no es el sitio oficial"],
      que_hacer: ["No pagues por link", "Consultá el seguimiento en correoargentino.com.ar"],
      resumen_abuela: "Parece un cobro trucho.\nNo pongas tu tarjeta.",
    },
  },
  {
    nombre: "Mercado Libre, compra entregada (oficial)",
    tipo: "legitimo",
    texto:
      "¡Tu compra llegó! Entregamos tu paquete hoy a las 14:32. Podés ver el detalle en https://www.mercadolibre.com.ar/mis-compras",
    esperado: "seguro",
    llm: {
      veredicto: "seguro",
      score: 8,
      banderas: [],
      que_hacer: ["Podés seguir normal"],
      resumen_abuela: "Es un aviso normal de Mercado Libre.\nNo hay peligro.",
    },
  },
  {
    nombre: "Mensaje familiar sin pedidos",
    tipo: "legitimo",
    texto: "Ma, llego a las 21 para la cena. ¿Llevo helado o vino? Besos",
    esperado: "seguro",
    llm: {
      veredicto: "seguro",
      score: 3,
      banderas: [],
      que_hacer: ["Nada que hacer, es un mensaje común"],
      resumen_abuela: "Es un mensaje normal de la familia.\nTodo bien.",
    },
  },
  {
    nombre: "Recordatorio de ARCA con link oficial",
    tipo: "legitimo",
    texto:
      "Recordatorio: el 20 vence la cuota del Monotributo. Podés consultar tu estado de cuenta ingresando con clave fiscal en https://www.arca.gob.ar",
    esperado: "seguro",
    llm: {
      veredicto: "seguro",
      score: 15,
      banderas: [],
      que_hacer: ["Si querés verificar, entrá vos a arca.gob.ar escribiendo la dirección"],
      resumen_abuela: "Es un recordatorio normal con la página oficial.\nNo pide plata ni datos.",
    },
  },
  {
    nombre: "Confirmación de turno médico",
    tipo: "legitimo",
    texto:
      "Hola, te confirmamos el turno con la Dra. López el martes 28 a las 10:00 en Av. Rivadavia 4500. Si no podés asistir, respondé este mensaje. Gracias.",
    esperado: "seguro",
    llm: {
      veredicto: "seguro",
      score: 5,
      banderas: [],
      que_hacer: ["Nada que hacer"],
      resumen_abuela: "Es la confirmación de un turno.\nTodo tranquilo.",
    },
  },
];
