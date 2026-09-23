import { KalenderInhalt } from "@/components/public/KalenderInhalt";
import { ladeOeffentlichenBezirk } from "@/lib/schulamtStartseite";
import type { SuchParameter } from "@/lib/filter";
type Props = { params: Promise<{ schulamt: string;  }>; searchParams: Promise<SuchParameter> };
export async function generateMetadata({ params }: Props) {
  const bezirk = await ladeOeffentlichenBezirk((await params).schulamt);
  return { title: `Kalender ${bezirk.name}`, description: `Fortbildungsangebote im Schulamtsbezirk ${bezirk.name}.` };
}
export default async function SchulamtsSeite({ params, searchParams }: Props) {
  const bezirk = await ladeOeffentlichenBezirk((await params).schulamt);
  return <KalenderInhalt bezirk={bezirk} searchParams={searchParams} />;
}
