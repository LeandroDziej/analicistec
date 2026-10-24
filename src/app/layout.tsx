import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible: pensada para que cada letra se distinga bien (útil para adultos mayores).
const fuenteUi = Atkinson_Hyperlegible_Next({
  variable: "--font-ui-src",
  subsets: ["latin"],
  display: "swap",
});

// Newsreader: serif sobria para títulos; transmite criterio y seriedad sin ser fría.
const fuenteTitulo = Plus_Jakarta_Sans({
  variable: "--font-titulo-src",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AntiEstafa AR — ¿Es estafa este mensaje?",
  icons: {
    icon: [
      { url: "/icono.svg", type: "image/svg+xml" },
      { url: "/icono-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: { capable: true, title: "AntiEstafa", statusBarStyle: "default" },
  description: "Detector de estafas para Argentina: pegá un mensaje o subí una captura de WhatsApp y te decimos si es estafa.",
};

export const viewport: Viewport = {
  themeColor: "#0b5a68",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${fuenteUi.variable} ${fuenteTitulo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}