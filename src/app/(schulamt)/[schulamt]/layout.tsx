import { OeffentlicherRahmen } from "@/components/public/OeffentlicherRahmen";
import { ladeOeffentlichenBezirk } from "@/lib/schulamtStartseite";
export const dynamic = "force-dynamic";
export default async function SchulamtsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ schulamt: string }> }) {
  const bezirk = await ladeOeffentlichenBezirk((await params).schulamt);
  return <OeffentlicherRahmen bezirk={bezirk}>{children}</OeffentlicherRahmen>;
}
