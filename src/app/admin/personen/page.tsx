import Link from "next/link";
import { ShieldCheck, UserRound, Users } from "lucide-react";

import { requireRole } from "@/lib/auth";

export const metadata = { title: "Personen & Zugänge" };

export default async function PersonenSeite() {
  const user = await requireRole("RVS", "ADMIN");

  return (
    <div className="max-w-5xl space-y-7">
      <header>
        <p className="etikett text-primary">Zuständigkeiten und Zugänge</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Personen & Zugänge</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Referentinnen und Referenten werden getrennt von den Zuständigkeiten der Schulamtsbezirke verwaltet.
        </p>
      </header>

      <section aria-labelledby="referenten" className="space-y-3">
        <div>
          <h2 id="referenten" className="text-lg font-semibold">Referentinnen und Referenten</h2>
          <p className="mt-1 text-sm text-muted-foreground">Profile, Zuordnungen und Zugänge für die Fortbildungsarbeit.</p>
        </div>
        <PersonenLink href="/admin/referenten" titel="Referenten verwalten" text="Personen anlegen, Bezirken zuordnen und Zugänge für die Fortbildungsarbeit verwalten." icon={UserRound} />
      </section>

      {user.role === "RVS" ? (
        <section aria-labelledby="bezirke" className="space-y-3 border-t pt-6">
          <div>
            <h2 id="bezirke" className="text-lg font-semibold">Schulamtsbezirke und BdBs</h2>
            <p className="mt-1 text-sm text-muted-foreground">Zentrale Zuständigkeiten der Regierung von Schwaben.</p>
          </div>
          <PersonenLink href="/admin/bezirke" titel="Bezirke & BdBs verwalten" text="Bezirke einrichten sowie BdBs einladen und ihren Zuständigkeiten zuordnen." icon={Users} />
          <p className="flex items-start gap-2 rounded-lg bg-muted/65 p-4 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />Nur Regierungskonten können Bezirke und BdB-Zugänge verändern.</p>
        </section>
      ) : null}
    </div>
  );
}

function PersonenLink({
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
    <Link href={href} className="group block rounded-xl border bg-card p-5 transition-colors hover:border-primary/35 hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
      <Icon className="size-5 text-primary" aria-hidden />
      <h3 className="mt-4 font-semibold group-hover:text-primary">{titel}</h3>
      <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{text}</p>
    </Link>
  );
}
