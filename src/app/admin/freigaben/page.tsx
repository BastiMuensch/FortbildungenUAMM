import { FreigabenBereich } from "@/components/admin/FreigabenBereich";
import { type SuchParameter } from "@/lib/filter";

export const metadata = { title: "Freigaben" };
export const dynamic = "force-dynamic";

export default async function FreigabenSeite({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  return <FreigabenBereich params={await searchParams} />;
}
