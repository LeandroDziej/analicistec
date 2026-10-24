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
