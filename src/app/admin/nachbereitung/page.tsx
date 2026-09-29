import { NachbereitungsBereich } from "@/components/admin/NachbereitungsBereich";
import { type SuchParameter } from "@/lib/filter";

export const metadata = { title: "Nachbereitung" };
export const dynamic = "force-dynamic";

export default async function NachbereitungSeite({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  return <NachbereitungsBereich params={await searchParams} />;
}
