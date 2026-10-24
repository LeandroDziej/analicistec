import Pestanas from "./Pestanas";
import YaCai from "./YaCai";
import Historial from "./Historial";

export default function MasAyuda() {
  return (
    <Pestanas
      etiquetaAria="Más ayuda"
      encabezado={
        <div className="px-5 pt-5 sm:px-7 sm:pt-6">
          <h2 className="titulo text-2xl text-ink">Más ayuda</h2>
          <p className="mt-1 text-ink-soft">Qué hacer si ya caíste y lo que revisaste.</p>
        </div>
      }
      pestanas={[
        { id: "ya-cai", etiqueta: "Ya caí", icono: "salvavidas", contenido: <YaCai /> },
        { id: "historial", etiqueta: "Mis análisis", icono: "reloj", contenido: <Historial /> },
      ]}
    />
  );
}