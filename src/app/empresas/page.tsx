import type { Metadata } from "next";
import Link from "next/link";
import Encabezado from "@/components/Encabezado";
import PiePagina from "@/components/PiePagina";
import { Icono, type NombreIcono } from "@/components/Iconos";
import { MARCA } from "@/lib/marca";

export const metadata: Metadata = {
  title: "Para empresas — AntiEstafa AR",
  description:
    "Ofrecé AntiEstafa AR a tus clientes con tu marca: app, bot de WhatsApp y botón para tu web. Gratis para las familias, con IA opcional incluida en el abono.",
};

const CANALES: { icono: NombreIcono; titulo: string; texto: string }[] = [
  { icono: "escudo", titulo: "La app con tu marca", texto: "Tu nombre, tu logo y tu contacto. Tus clientes la instalan en el celu o la usan desde la compu." },
  { icono: "mensaje", titulo: "Bot de WhatsApp", texto: "Reenvían el mensaje raro a tu número y les contesta al toque si es estafa y qué hacer." },
  { icono: "link", titulo: "Botón en tu web", texto: "Un botón “¿Es estafa?” que se agrega a cualquier página con una sola línea." },
  { icono: "candado", titulo: "Funciona sin IA paga", texto: "Si no hay clave de IA o se agota la cuota, sigue con nuestro motor propio. Nunca se corta." },
];

const PLANES: { nombre: string; precio: string; destacado?: boolean; items: string[] }[] = [
  {
    nombre: "Comunidad",
    precio: "Gratis",
    items: ["App web, Pandi y botón al 911", "Motor propio + IA gratuita", "Con la marca AntiEstafa AR"],
  },
  {
    nombre: "Empresa",
    precio: "Abono mensual",
    items: ["Tu marca, logo y contacto", "Bot de WhatsApp y botón web", "Medidor de uso", "Usa tu clave gratuita de IA"],
  },
  {
    nombre: "Empresa + IA",
    precio: "Abono con IA incluida",
    destacado: true,
    items: ["Todo lo del plan Empresa", "Clave de IA paga incluida", "Más análisis por mes, sin cortes", "Más privacidad para tus clientes"],
  },
];

const PASOS = [
  "Pedí el diagnóstico gratuito.",
  "Te mostramos una demo con mensajes que les llegaron a tus clientes.",
  "Elegís el plan y nos pasás tu logo y tu número de WhatsApp.",
  "Lo dejamos andando con tu marca y te damos soporte.",
];

export default function Empresas() {
  const scriptWidget = `<script src="${MARCA.urlApp}/widget.js" defer></script>`;
  return (
    <>
      <Encabezado enlazarInicio />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-4 py-10 sm:px-6 sm:py-14">
        <section className="flex max-w-3xl flex-col gap-5">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-700">Para empresas, cooperativas y municipios</p>
          <h1 className="titulo text-4xl text-ink sm:text-5xl">Cuidá a tus clientes de las estafas, con tu marca.</h1>
          <p className="text-lg text-ink-soft">
            Gratis para las familias que lo usan. Vos lo ofrecés como beneficio: fidelizás, cuidás tu marca y evitás reclamos por fraudes.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href={MARCA.ventas} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Quiero ofrecerlo a mis clientes
            </a>
            <Link href="/" className="btn btn-secondary">
              Probar la app
            </Link>
          </div>
        </section>

        <section aria-labelledby="canales" className="flex flex-col gap-6">
          <h2 id="canales" className="titulo text-3xl text-ink">
            Llega a tu gente por donde ya está
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CANALES.map((c) => (
              <li key={c.titulo} className="card flex flex-col gap-2 p-5">
                <Icono nombre={c.icono} className="h-7 w-7 text-brand-700" />
                <p className="font-bold text-ink">{c.titulo}</p>
                <p className="text-base text-ink-soft">{c.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="planes" className="flex flex-col gap-6">
          <h2 id="planes" className="titulo text-3xl text-ink">
            Planes
          </h2>
          <ul className="grid gap-4 lg:grid-cols-3">
            {PLANES.map((p) => (
              <li key={p.nombre} className={`card flex flex-col gap-3 p-6 ${p.destacado ? "border-2 border-brand-700" : ""}`}>
                <p className="titulo text-2xl text-ink">{p.nombre}</p>
                <p className="font-bold text-brand-800">{p.precio}</p>
                <ul className="flex flex-col gap-2">
                  {p.items.map((i) => (
                    <li key={i} className="flex gap-2 text-base text-ink-soft">
                      <Icono nombre="check" className="mt-0.5 h-5 w-5 text-safe-600" />
                      {i}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="text-base text-ink-soft">
            La clave de IA paga es opcional: si la querés, la compramos por vos y la cobramos dentro del mismo abono, según lo que uses. Sin
            ella, el servicio funciona igual con la IA gratuita y nuestro motor propio.
          </p>
        </section>

        <section aria-labelledby="contratar" className="flex flex-col gap-6">
          <h2 id="contratar" className="titulo text-3xl text-ink">
            Cómo se contrata
          </h2>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((p, i) => (
              <li key={p} className="card flex flex-col gap-2 p-5">
                <span className="titulo text-3xl text-brand-700">{i + 1}</span>
                <p className="text-base text-ink">{p}</p>
              </li>
            ))}
          </ol>
          <a href={MARCA.ventas} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-fit">
            Pedir el diagnóstico gratuito
          </a>
        </section>

        <section aria-labelledby="web" className="card flex flex-col gap-3 p-6">
          <h2 id="web" className="titulo text-2xl text-ink">
            ¿Tenés página web? Sumá el botón
          </h2>
          <p className="text-base text-ink-soft">Pegá esta línea antes de cerrar el &lt;body&gt; de tu sitio:</p>
          <pre className="overflow-x-auto rounded-xl bg-ink p-4 text-sm text-white">
            <code>{scriptWidget}</code>
          </pre>
          <p className="text-sm text-ink-mute">Aparece un botón “¿Es estafa?” abajo a la izquierda que abre el detector sin salir de tu página.</p>
        </section>
      </main>

      <PiePagina />
    </>
  );
}
