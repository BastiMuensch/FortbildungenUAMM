import Link from "next/link";
import { DatabaseBackup, Download, FileText, MapPin, PenLine, Settings, Tags } from "lucide-react";

import { requireRole } from "@/lib/auth";

export const metadata = { title: "Verwaltung" };

export default async function VerwaltungsSeite() {
  const user = await requireRole("RVS", "ADMIN");

  return (
    <div className="max-w-5xl space-y-7">
      <header>
        <p className="etikett text-primary">Einstellungen und Stammdaten</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Verwaltung</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Orte, Schlagworte und die Verwaltungsaufgaben für den Fortbildungsbereich.
        </p>
      </header>

      <section aria-labelledby="stammdaten" className="space-y-3">
        <div>
          <h2 id="stammdaten" className="text-lg font-semibold">Stammdaten</h2>
          <p className="mt-1 text-sm text-muted-foreground">Grundlagen für Ausschreibungen, Suche und Planung.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <VerwaltungsLink href="/admin/orte" titel="Orte & Schulen" text="Veranstaltungsorte pflegen und das Schulverzeichnis importieren." icon={MapPin} />
          <VerwaltungsLink href="/admin/schlagworte" titel="Schlagworte" text="Begriffe für Suche, Fortbildungen und den FIBS-Import verwalten." icon={Tags} />
          <VerwaltungsLink href="/admin/unterschriften" titel="Unterschriften" text="BdB-Unterschriften für Teilnahmebescheinigungen hinterlegen, ersetzen oder entfernen." icon={PenLine} />
        </div>
      </section>

      {user.role === "RVS" ? (
        <section aria-labelledby="portal-und-betrieb" className="space-y-3 border-t pt-6">
          <div>
            <h2 id="portal-und-betrieb" className="text-lg font-semibold">Portal und Betrieb</h2>
            <p className="mt-1 text-sm text-muted-foreground">Diese Bereiche stehen ausschließlich der Regierung von Schwaben zur Verfügung.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <VerwaltungsLink href="/admin/import" titel="FIBS-Import" text="Lehrgänge anhand der markierten Schlagworte übernehmen." icon={Download} />
            <VerwaltungsLink href="/admin/einrichtung" titel="Einrichtung" text="Profil, Schulen und die grundlegende Portaleinrichtung bearbeiten." icon={Settings} />
            <VerwaltungsLink href="/admin/texte" titel="Rechtstexte" text="Impressum und Datenschutzerklärung im öffentlichen Bereich pflegen." icon={FileText} />
            <VerwaltungsLink href="/admin/datensicherung" titel="Datensicherung" text="Vollbackups erstellen, ablegen und deren Prüfung bestätigen." icon={DatabaseBackup} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function VerwaltungsLink({
  href,
  titel,
  text,
  icon: Icon,
}: {
  href: string;
  titel: string;
  text: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <Link href={href} className="group rounded-xl border bg-card p-5 transition-colors hover:border-primary/35 hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
      <Icon className="size-5 text-primary" aria-hidden />
      <h3 className="mt-4 font-semibold group-hover:text-primary">{titel}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </Link>
  );
}
