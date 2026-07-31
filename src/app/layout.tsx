import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// next/font lädt die Schrift zur Bauzeit herunter und liefert sie vom eigenen
// Server aus. Es gibt damit keine Verbindung des Browsers zu Google — das ist
// die datenschutzrechtlich entscheidende Eigenschaft, nicht bloß eine
// Performance-Frage.
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
