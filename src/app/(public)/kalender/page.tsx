import type { Metadata } from "next";
import type { SuchParameter } from "@/lib/filter";
import { KalenderInhalt } from "@/components/public/KalenderInhalt";
export const metadata: Metadata = {
  title: "Kalender",
  description:
    "Monatsübersicht der Fortbildungen, inklusive bayerischer Ferien und Feiertage.",
};


export default function KalenderSeite({ searchParams }: { searchParams: Promise<SuchParameter> }) {
  return <KalenderInhalt searchParams={searchParams} />;
}
