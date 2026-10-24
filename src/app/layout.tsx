import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AntiEstafa AR — ¿Es estafa este mensaje?",
  icons: { icon: "/icono.svg", apple: "/icono.svg" },
  description: "Detector de estafas para Argentina: pegá un mensaje o subí una captura de WhatsApp y te decimos si es estafa.",
};

export const viewport: Viewport = {
  themeColor: "#0369a1",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
