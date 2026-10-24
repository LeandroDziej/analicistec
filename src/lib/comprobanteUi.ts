export type VeredictoComprobante = "parece_real" | "sospechoso" | "probablemente_falso";

export interface AnalisisComprobante {
  veredicto: VeredictoComprobante;
  senales: string[];
  recomendacion: string;
}

export const AVISO_VERIFICAR =
  "Ningún análisis de imagen alcanza: entrá vos a la app de tu banco o billetera y confirmá que la plata realmente ingresó antes de entregar nada.";

export function etiquetaComprobante(v: VeredictoComprobante): { titulo: string; luz: "verde" | "amarillo" | "rojo" } {
  if (v === "probablemente_falso") return { titulo: "Probablemente falso", luz: "rojo" };
  if (v === "sospechoso") return { titulo: "Sospechoso", luz: "amarillo" };
  return { titulo: "Parece real (igual verificá)", luz: "verde" };
}
