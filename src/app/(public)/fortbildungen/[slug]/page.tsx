import { FortbildungsDetailInhalt, fortbildungsMetadaten } from "@/components/public/FortbildungsDetailInhalt";
export const generateMetadata = fortbildungsMetadaten;
export default function FortbildungDetail({ params }: { params: Promise<{ slug: string }> }) {
  return <FortbildungsDetailInhalt params={params} />;
}
