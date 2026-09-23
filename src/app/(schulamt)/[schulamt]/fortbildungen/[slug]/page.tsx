import { FortbildungsDetailInhalt, fortbildungsMetadaten } from "@/components/public/FortbildungsDetailInhalt";
import { ladeOeffentlichenBezirk } from "@/lib/schulamtStartseite";
import type { SuchParameter } from "@/lib/filter";
type Props = { params: Promise<{ schulamt: string; slug: string; }>; searchParams: Promise<SuchParameter> };
export async function generateMetadata({ params }: Props) {
  const bezirk = await ladeOeffentlichenBezirk((await params).schulamt);
  return fortbildungsMetadaten({ params, bezirk });
}
export default async function SchulamtsSeite({ params }: Props) {
  const bezirk = await ladeOeffentlichenBezirk((await params).schulamt);
  return <FortbildungsDetailInhalt bezirk={bezirk} params={params} />;
}
