import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { requireRole } from "@/lib/auth";
import { ladeFormularDaten } from "@/lib/formularDaten";
import { FortbildungForm } from "@/components/admin/FortbildungForm";

export const metadata = { title: "Neue Fortbildung" };

export default async function NeueFortbildungPage() {
  await requireRole("ADMIN", "REDAKTEUR");
  const daten = await ladeFormularDaten();

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Zurück zur Übersicht
      </Link>

      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Neue Fortbildung</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Felder mit <span className="text-destructive">*</span> sind Pflichtfelder. Der
        Eintrag ist zunächst ein Entwurf und wird erst nach dem Veröffentlichen für
        Lehrkräfte sichtbar.
      </p>

      <FortbildungForm {...daten} />
    </div>
  );
}
