import Pestanas from "./Pestanas";
import Analizador from "./Analizador";
import RevisarLink from "./RevisarLink";
import EscanearQr from "./EscanearQr";
import DetectorComprobante from "./DetectorComprobante";
import ChequeoTransferencia from "./ChequeoTransferencia";

export default function Herramientas() {
  return (
    <Pestanas
      etiquetaAria="Qué querés revisar"
      pestanas={[
        { id: "mensaje", etiqueta: "Mensaje", icono: "mensaje", contenido: <Analizador /> },
        { id: "link", etiqueta: "Link", icono: "link", contenido: <RevisarLink /> },
        { id: "qr", etiqueta: "QR", icono: "qr", contenido: <EscanearQr /> },
        { id: "comprobante", etiqueta: "Comprobante", icono: "recibo", contenido: <DetectorComprobante /> },
        { id: "transferencia", etiqueta: "Transferencia", icono: "banco", contenido: <ChequeoTransferencia /> },
      ]}
    />
  );
}