/**
 * Estafas del momento: modalidades que circulan ahora en Argentina, con su fuente.
 * Es una lista curada a mano: para sumar una, agregá un objeto con fuente verificable
 * y fecha. Se muestran de la más nueva a la más vieja.
 */
export interface Tendencia {
  id: string;
  titulo: string;
  /** Mes en que se reportó, formato AAAA-MM. */
  fecha: string;
  resumen: string;
  senales: string[];
  consejo: string;
  fuente: { nombre: string; url: string };
}

export const TENDENCIAS: Tendencia[] = [
  {
    id: "alquiler-verano",
    titulo: "Alquileres de verano con descuento si pagás la seña afuera",
    fecha: "2026-10",
    resumen:
      "Copian avisos de casas y departamentos en la costa y ofrecen hasta 25 % de descuento si pagás la seña por fuera de la plataforma. La plata va a billeteras virtuales que vacían y cierran en horas.",
    senales: ["Descuento por pagar fuera de la app", "Cuenta virtual o a nombre de otra persona", "Apuro para reservar"],
    consejo: "Pagá solo por la plataforma o a una cuenta bancaria con CBU de una inmobiliaria que puedas verificar.",
    fuente: { nombre: "El Cronista", url: "https://www.elcronista.ar/se-acerca-el-verano-y-ya-empezaron-las-nuevas-estafas-para-alquilar-en-mar-del-plata" },
  },
  {
    id: "vivienda-whatsapp",
    titulo: "WhatsApp falso de institutos de vivienda",
    fecha: "2026-10",
    resumen:
      "Un perfil de WhatsApp con el nombre y el logo del Instituto Provincial de la Vivienda de Mendoza contacta a inscriptos y pide transferencias para “gestiones” y hasta claves bancarias.",
    senales: ["Perfil con logo oficial pero número desconocido", "Pide plata para un trámite", "Pide claves"],
    consejo: "Los organismos no cobran trámites por WhatsApp. Buscá el número oficial en su página y consultá ahí.",
    fuente: {
      nombre: "Minuto Ya",
      url: "https://www.minutoya.com.ar/2026/10/24/alerta-por-estafas-en-mendoza-el-ipv-advierte-sobre-un-whatsapp-falso-y-difunde-su-unico-numero-oficial",
    },
  },
  {
    id: "cripto-ia-famosos",
    titulo: "Inversiones cripto con videos de famosos hechos con IA",
    fecha: "2026-10",
    resumen:
      "Publicidades en redes con videos falsos de famosos, hechos con inteligencia artificial, que prometen ganancias enormes. Un “asesor” te guía por videollamada para mover tus ahorros y hasta sacar préstamos.",
    senales: ["Famoso recomendando una inversión", "Ganancias garantizadas o enormes", "Te piden sacar un préstamo"],
    consejo: "Ninguna inversión real garantiza ganancias. Si ves a un famoso recomendándola en un aviso, es falso.",
    fuente: { nombre: "Minuto Ya", url: "https://www.minutoya.com.ar/2026/10/23/con-sofisticado-uso-de-ia-estafaron-a-un-mendocino-en-24-5-millones" },
  },
  {
    id: "entradas-recitales",
    titulo: "Entradas truchas para recitales y festivales",
    fecha: "2026-10",
    resumen:
      "Sitios falsos, reventas por redes, sorteos y “entradas VIP de último momento” para los shows más buscados. Buscan tu plata, los datos de tu tarjeta o que instales una app para ver el show “en vivo”.",
    senales: ["Entradas agotadas que alguien “consigue”", "Precio muy bajo", "Link para ver el show gratis"],
    consejo: "Comprá solo en la ticketera oficial del show y nunca publiques la foto de tu entrada con el código QR.",
    fuente: {
      nombre: "MDZ",
      url: "https://www.mdzol.com/sociedad/2026/10/15/alertan-por-estafas-virtuales-con-entradas-para-ver-los-proximos-recitales-de-grandes-bandas-en-arge-1988523.html",
    },
  },
  {
    id: "anses-pami-salud",
    titulo: "Falsos ANSES, PAMI y Ministerio de Salud",
    fecha: "2026-08",
    resumen:
      "Mensajes y llamadas por WhatsApp desde números comunes con foto de perfil oficial. Te apuran para entrar a un link, pasar tu CUIL o los códigos del banco.",
    senales: ["Número común con logo oficial", "Link para cobrar un beneficio", "Piden CUIL o códigos"],
    consejo: "ANSES y PAMI no piden datos ni códigos por WhatsApp. Ante la duda, llamá a la línea oficial o andá en persona.",
    fuente: {
      nombre: "Noticias (Perfil)",
      url: "https://noticias.perfil.com/noticias/informacion-general/advierten-sobre-un-cuento-del-tio-con-mensajes-falsos-de-anses-pami-y-el-ministerio-de-salud.phtml",
    },
  },
];

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** "2026-10" → "octubre de 2026" */
export function fechaLegible(fecha: string): string {
  const [anio, mes] = fecha.split("-").map(Number);
  return MESES[mes - 1] ? `${MESES[mes - 1]} de ${anio}` : fecha;
}

/** De la más nueva a la más vieja (el orden de la lista desempata). */
export function tendenciasOrdenadas(lista: Tendencia[] = TENDENCIAS): Tendencia[] {
  return lista
    .map((t, i) => ({ t, i }))
    .sort((a, b) => b.t.fecha.localeCompare(a.t.fecha) || a.i - b.i)
    .map(({ t }) => t);
}

/** Aviso corto para mandar al grupo de la familia por WhatsApp. */
export function textoAvisoFamilia(t: Tendencia, urlApp: string): string {
  return `⚠️ Ojo con esta estafa: ${t.titulo}.\n${t.resumen}\n👉 ${t.consejo}\nSi te llega algo raro, revisalo gratis en ${urlApp}`;
}
