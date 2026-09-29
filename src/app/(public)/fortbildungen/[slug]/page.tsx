import { FortbildungsDetailInhalt, fortbildungsMetadaten } from "@/components/public/FortbildungsDetailInhalt";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return fortbildungsMetadaten({ params });
}
export default function FortbildungDetail({ params }: { params: Promise<{ slug: string }> }) {
  return <FortbildungsDetailInhalt params={params} />;
}
