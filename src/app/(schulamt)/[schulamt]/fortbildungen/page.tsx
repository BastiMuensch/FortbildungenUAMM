import { FortbildungsListenInhalt } from "@/components/public/FortbildungsListenInhalt";
import { ladeOeffentlichenBezirk } from "@/lib/schulamtStartseite";
import type { SuchParameter } from "@/lib/filter";
type Props = { params: Promise<{ schulamt: string;  }>; searchParams: Promise<SuchParameter> };
export async function generateMetadata({ params }: Props) {
  const bezirk = await ladeOeffentlichenBezirk((await params).schulamt);
  return { title: `Fortbildungen ${bezirk.name}`, description: `Fortbildungsangebote im Schulamtsbezirk ${bezirk.name}.` };
}
export default async function SchulamtsSeite({ params, searchParams }: Props) {
  const bezirk = await ladeOeffentlichenBezirk((await params).schulamt);
  return <FortbildungsListenInhalt bezirk={bezirk} searchParams={searchParams} />;
}
