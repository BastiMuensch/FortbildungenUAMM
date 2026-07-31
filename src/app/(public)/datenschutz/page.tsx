import type { Metadata } from "next";

import { SystemtextSeite } from "@/components/public/SystemtextSeite";

// Die Seite liest bei jedem Aufruf aus der Datenbank. Ohne diese Zeile
// würde Next die Inhalte beim Bauen einfrieren.
export const dynamic = "force-dynamic";


export const metadata: Metadata = {
  title: "Datenschutz",
  robots: { index: true, follow: false },
};

export default function DatenschutzSeite() {
  return <SystemtextSeite id="datenschutz" ueberschrift="Datenschutzerklärung" />;
}
