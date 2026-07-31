import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ERFASSER, requireRole } from "@/lib/auth";
import { ladeFormularDaten } from "@/lib/formularDaten";
import { FortbildungWizard } from "@/components/admin/FortbildungForm/Wizard";

export const metadata = { title: "Neue Fortbildung" };

export default async function NeueFortbildungPage() {
  await requireRole(...ERFASSER);
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
      <p className="mb-8 max-w-2xl text-sm text-muted-foreground text-pretty">
        In sechs Schritten zur fertigen Ausschreibung. Jeder Schritt wird
        geprüft, bevor es weitergeht — so bleibt nichts liegen. Als Entwurf
        lässt sich jederzeit speichern, auch wenn noch etwas fehlt.
      </p>

      <FortbildungWizard {...daten} />
    </div>
  );
}
