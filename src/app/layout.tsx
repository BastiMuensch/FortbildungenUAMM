import { ladeSchulamt } from "@/lib/schulamt";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { fortbildungsZusatz } from "@/lib/marke";
import "./globals.css";

// Die OFL-lizenzierten Dateien liegen im Repository. next/font/local erzeugt
// daraus lokale Build-Artefakte; weder Build noch Browser benötigen Google.
//
// Archivo statt einer Standardschrift: eine kräftige Grotesk mit geraden
// Endungen und engem Innenraum. Sie trägt große Überschriften, ohne
// beliebig zu wirken.
const archivo = localFont({
  src: "./fonts/archivo-latin.woff2",
  variable: "--font-archivo",
  display: "swap",
  weight: "400 700",
});

// Für alles Zählbare. Dieselbe Zeichenbreite lässt Uhrzeiten und Platzzahlen
// in Listen untereinander stehen.
const plexMono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ibm-plex-mono-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/ibm-plex-mono-latin-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const schulamt = await ladeSchulamt();
  return {
    title: {
      default: `weiter.bilden — ${fortbildungsZusatz(schulamt.kurzname)}`,
      template: `%s — weiter.bilden · ${fortbildungsZusatz(schulamt.kurzname)}`,
    },
    description: schulamt.startText,
    robots: { index: true, follow: true },
    // Eigene, versionierte Adressen lösen alte Favicon-Caches ab. PNG und
    // Apple-Touch-Icon ergänzen SVG für Browser mit eingeschränktem SVG-Support.
    icons: {
      icon: [
        { url: "/favicon.ico?v=weiter-bilden-1", type: "image/x-icon", sizes: "16x16 32x32" },
        { url: "/marke/favicon-v1.svg", type: "image/svg+xml", sizes: "any" },
        { url: "/marke/favicon-v1.png", type: "image/png", sizes: "32x32" },
      ],
      shortcut: "/favicon.ico?v=weiter-bilden-1",
      apple: [{ url: "/marke/apple-touch-icon-v1.png", type: "image/png", sizes: "180x180" }],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de"
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
