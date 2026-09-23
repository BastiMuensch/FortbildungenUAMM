import type { Metadata } from "next";
import type { SuchParameter } from "@/lib/filter";
import { FortbildungsListenInhalt } from "@/components/public/FortbildungsListenInhalt";
export const metadata: Metadata = {
  title: "Alle Fortbildungen",
  description:
    "Suche und Filter über die Fortbildungsangebote des Schulamts.",
};


export default function FortbildungsListe({ searchParams }: { searchParams: Promise<SuchParameter> }) {
  return <FortbildungsListenInhalt searchParams={searchParams} />;
}
