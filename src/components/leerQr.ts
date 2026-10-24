/** Lee un código QR de una foto o captura, todo dentro del navegador (la imagen no se sube a ningún lado). */
export async function leerQrDeArchivo(archivo: File): Promise<string | null> {
  const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
  try {
    const { default: jsQR } = await import("jsqr");
    // Probamos a varios tamaños: a veces el QR se lee mejor con la foto más chica.
    for (const maximo of [1600, 1000, 600]) {
      const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
      const ancho = Math.max(1, Math.round(imagen.width * escala));
      const alto = Math.max(1, Math.round(imagen.height * escala));
      const lienzo = document.createElement("canvas");
      lienzo.width = ancho;
      lienzo.height = alto;
      const ctx = lienzo.getContext("2d", { willReadFrequently: true });
      if (!ctx) return null;
      ctx.drawImage(imagen, 0, 0, ancho, alto);
      const pixeles = ctx.getImageData(0, 0, ancho, alto);
      const resultado = jsQR(pixeles.data, ancho, alto, { inversionAttempts: "attemptBoth" });
      if (resultado?.data) return resultado.data;
    }
    return null;
  } finally {
    imagen.close();
  }
}