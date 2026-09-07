import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// next/font lädt die Schriften zur Bauzeit herunter und liefert sie vom
// eigenen Server aus. Es gibt damit keine Verbindung des Browsers zu Google —
// das ist die datenschutzrechtlich entscheidende Eigenschaft, nicht bloß eine
// Frage der Ladezeit.
//
// Archivo statt einer Standardschrift: eine kräftige Grotesk mit geraden
// Endungen und engem Innenraum. Sie trägt große Überschriften, ohne
// beliebig zu wirken.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Für alles Zählbare. Dieselbe Zeichenbreite lässt Uhrzeiten und Platzzahlen
// in Listen untereinander stehen.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Fortbildungen — Schulamt Memmingen-Unterallgäu",
    template: "%s — Fortbildungen Schulamt Memmingen-Unterallgäu",
  },
  description:
    "Lehrerfortbildungen des Staatlichen Schulamts im Landkreis Unterallgäu und in der Stadt Memmingen: Termine, Kalender und Suche.",
  robots: { index: true, follow: true },
};

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
