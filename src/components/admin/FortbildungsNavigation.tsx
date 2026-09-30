import Link from "next/link";

import { baueUrl, type SuchParameter } from "@/lib/filter";
import { adminBereichUrl } from "@/lib/adminNavigation";

type Ansicht = "alle" | "entwuerfe" | "freigaben" | "fibs" | "nachbereitung";

/**
 * Gemeinsame Navigation für die Arbeitslisten. Die Ansicht steht bewusst in
 * der URL, damit eine Auswahl verlinkbar bleibt und beim Zurückkehren nicht
 * verloren geht.
 */
export function FortbildungsNavigation({
  params,
  aktiveAnsicht,
  darfFreigeben,
  darfNachbereiten,
}: {
  params: SuchParameter;
  aktiveAnsicht: Ansicht;
  darfFreigeben: boolean;
  darfNachbereiten: boolean;
}) {
  const listenUrl = (ansicht: Exclude<Ansicht, "freigaben" | "nachbereitung">) =>
    baueUrl("/admin/fortbildungen", params, {
      ansicht: ansicht === "alle" ? undefined : ansicht,
      bereich: undefined,
      status: undefined,
      fibs: undefined,
    });
  const arbeitsUrl = (pfad: "/admin/freigaben" | "/admin/nachbereitung") =>
    adminBereichUrl(pfad, params);

  const punkte: Array<{ id: Ansicht; label: string; href: string; sichtbar: boolean }> = [
    { id: "alle", label: "Alle", href: listenUrl("alle"), sichtbar: true },
    { id: "entwuerfe", label: "Entwürfe", href: listenUrl("entwuerfe"), sichtbar: true },
    { id: "freigaben", label: "Freigaben", href: arbeitsUrl("/admin/freigaben"), sichtbar: darfFreigeben },
    { id: "fibs", label: "FIBS", href: listenUrl("fibs"), sichtbar: darfFreigeben },
    { id: "nachbereitung", label: "Nachbereitung", href: arbeitsUrl("/admin/nachbereitung"), sichtbar: darfNachbereiten },
  ];

  return (
    <nav aria-label="Fortbildungsansichten" className="flex flex-wrap gap-2 border-b pb-3">
      {punkte.filter((punkt) => punkt.sichtbar).map((punkt) => (
        <Link
          key={punkt.id}
          href={punkt.href}
          aria-current={punkt.id === aktiveAnsicht ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            punkt.id === aktiveAnsicht
              ? "bg-primary text-primary-foreground"
              : "border border-input bg-background hover:bg-accent"
          }`}
        >
          {punkt.label}
        </Link>
      ))}
    </nav>
  );
}
