import { NachbereitungsBereich } from "@/components/admin/NachbereitungsBereich";

export const metadata = { title: "Nachbereitung" };
export const dynamic = "force-dynamic";

export default async function NachbereitungSeite() {
  return <NachbereitungsBereich />;
}
