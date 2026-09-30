import Link from "next/link";

import type { Rolle } from "@/constants/fortbildung";
import { adminBereichUrl } from "@/lib/adminNavigation";
import type { SuchParameter } from "@/lib/filter";

type Berichtsseite = "katalog" | "auswertung" | "archiv";

const bereiche: Array<{ id: Berichtsseite; pfad: string; titel: string; rollen: Rolle[] }> = [
  { id: "katalog", pfad: "/admin/katalog", titel: "Katalog", rollen: ["RVS", "ADMIN", "REFERENT"] },
  { id: "auswertung", pfad: "/admin/auswertung", titel: "Auswertung", rollen: ["RVS", "ADMIN", "REFERENT"] },
  { id: "archiv", pfad: "/admin/archiv", titel: "Archivübergabe", rollen: ["RVS", "ADMIN"] },
];

/** Kontextuelle Navigation für Recherche, Auswertung und getrennte Archivübergabe. */
export function BerichteNavigation({
  aktiveSeite,
  rolle,
  params,
}: {
  aktiveSeite: Berichtsseite;
  rolle: Rolle;
  params: SuchParameter;
}) {
  const kontext = { bezirk: params.bezirk, schuljahr: params.schuljahr };

  return (
    <nav aria-label="Berichte und Katalog" className="border-b print:hidden">
      <p className="etikett mb-2 text-muted-foreground">Berichte &amp; Katalog</p>
      <div className="-mb-px grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
        {bereiche.filter((bereich) => bereich.rollen.includes(rolle)).map((bereich) => {
          const aktiv = bereich.id === aktiveSeite;
          return (
            <Link
              key={bereich.id}
              href={adminBereichUrl(bereich.pfad, kontext)}
              aria-current={aktiv ? "page" : undefined}
              className={`min-w-0 border-b-2 px-3 py-2 text-center text-sm font-medium whitespace-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-left ${aktiv ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"}`}
            >
              {bereich.titel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
