import Link from "next/link";
import { ArrowRight, ClipboardCheck, FilePenLine, Send, ShieldCheck } from "lucide-react";

import { baueUrl, type SuchParameter } from "@/lib/filter";
import { adminBereichUrl } from "@/lib/adminNavigation";
import type { SessionUser } from "@/lib/auth";
import { darfFreigeben } from "@/constants/fortbildung";
import { ladeFortbildungsAufgaben } from "@/lib/fortbildungsAufgaben";

type Ansicht = "alle" | "entwuerfe" | "freigaben" | "fibs" | "nachbereitung";

/**
 * Gemeinsame Navigation für die Arbeitslisten. Die Ansicht steht bewusst in
 * der URL, damit eine Auswahl verlinkbar bleibt und beim Zurückkehren nicht
 * verloren geht.
 */
export async function FortbildungsNavigation({
  params,
  aktiveAnsicht,
  user,
}: {
  params: SuchParameter;
  aktiveAnsicht: Ansicht;
  user: SessionUser;
}) {
  const zahlen = await ladeFortbildungsAufgaben(user, params);
  const istAdmin = darfFreigeben(user.role);
  const darfNachbereiten = istAdmin || user.role === "REFERENT";
  // Die Kacheln zeigen den gesamten Bezirks-/Jahreskontext. Eine lokale Suche
  // darf beim Bereichswechsel daher nicht unbemerkt Treffer ausblenden.
  const listenUrl = (ansicht: Exclude<Ansicht, "freigaben" | "nachbereitung">) =>
    adminBereichUrl(baueUrl("/admin/fortbildungen", {}, {
      ansicht: ansicht === "alle" ? undefined : ansicht,
    }), params);
  const arbeitsUrl = (pfad: "/admin/freigaben" | "/admin/nachbereitung") =>
    adminBereichUrl(pfad, params);

  const punkte = [
    { id: "entwuerfe", label: "Entwürfe", hinweis: "Weiter vorbereiten", icon: FilePenLine, href: listenUrl("entwuerfe"), sichtbar: true },
    { id: "freigaben", label: "Freigaben", hinweis: "Prüfen & veröffentlichen", icon: ShieldCheck, href: arbeitsUrl("/admin/freigaben"), sichtbar: istAdmin },
    { id: "fibs", label: "FIBS", hinweis: "Noch ausschreiben", icon: Send, href: listenUrl("fibs"), sichtbar: istAdmin },
    { id: "nachbereitung", label: "Nachbereitung", hinweis: istAdmin ? "Angaben ergänzen" : "SchiLf-Zahlen ergänzen", icon: ClipboardCheck, href: arbeitsUrl("/admin/nachbereitung"), sichtbar: darfNachbereiten },
  ] as const;

  return (
    <nav aria-label="Fortbildungsansichten" className="max-w-4xl space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-medium">Offene Aufgaben</h2>
        <p className="text-xs text-muted-foreground">Im gewählten Bezirk und Schuljahr</p>
      </div>
      <div className={`grid grid-cols-2 gap-2.5 ${istAdmin ? "sm:grid-cols-4" : "max-w-md"}`}>
        {punkte.filter((punkt) => punkt.sichtbar).map((punkt) => {
          const aktiv = punkt.id === aktiveAnsicht;
          const Icon = punkt.icon;
          return (
            <Link
              key={punkt.id}
              href={punkt.href}
              aria-current={aktiv ? "page" : undefined}
              className={`min-w-0 rounded-xl border p-3 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-3.5 ${
                aktiv ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50 hover:bg-accent"
              }`}
            >
              <span className="mb-2 flex items-start justify-between gap-2">
                <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums sm:text-4xl">{zahlen[punkt.id].toLocaleString("de-DE")}</span>
                <Icon className={`mt-0.5 size-4 shrink-0 ${aktiv ? "text-primary-foreground" : "text-primary"}`} aria-hidden />
              </span>
              <span className="block text-sm leading-snug font-medium break-words">{punkt.label}</span>
              <span className={`mt-1 block text-xs leading-snug ${aktiv ? "text-primary-foreground/90" : "text-muted-foreground"}`}>{punkt.hinweis}</span>
            </Link>
          );
        })}
      </div>
      <Link href={listenUrl("alle")} aria-current={aktiveAnsicht === "alle" ? "page" : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        Alle Fortbildungen ({zahlen.alle.toLocaleString("de-DE")})<ArrowRight className="size-4" aria-hidden />
      </Link>
    </nav>
  );
}
