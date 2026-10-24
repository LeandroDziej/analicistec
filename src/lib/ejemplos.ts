export interface Ejemplo {
  id: string;
  etiqueta: string;
  texto: string;
}

// Dominios ficticios (.example está reservado y nunca resuelve).
export const EJEMPLOS: Ejemplo[] = [
  {
    id: "arca",
    etiqueta: "Falso ARCA",
    texto:
      "ARCA: detectamos una deuda pendiente a tu nombre. Regularizá hoy para evitar el embargo de tus cuentas: https://arca-regularizar.example/deuda",
  },
  {
    id: "mercado-pago",
    etiqueta: "Falso Mercado Pago",
    texto:
      "Mercado Pago: tu cuenta fue bloqueada por actividad sospechosa. Verificá tus datos en las próximas 2 horas o se cerrará: https://mercadopag0-seguridad.example/verificar",
  },
  {
    id: "correo",
    etiqueta: "Falso Correo Argentino",
    texto:
      "Correo Argentino: tu paquete está retenido por una tasa de $1.850. Pagala acá para recibirlo: https://correo-argentino-envios.example/pagar",
  },
  {
    id: "mama",
    etiqueta: "Hola mamá, cambié de número",
    texto:
      "Hola mamá, se me rompió el celu y este es mi número nuevo. Guardalo. Necesito que me hagas una transferencia urgente, después te explico, no le cuentes a papá.",
  },
  {
    id: "legitimo",
    etiqueta: "Mensaje legítimo",
    texto:
      "Hola Lucía, te confirmo el turno con la doctora para el jueves a las 10:30. Si no podés venir, avisanos con 24 hs de anticipación. ¡Saludos!",
  },
];
