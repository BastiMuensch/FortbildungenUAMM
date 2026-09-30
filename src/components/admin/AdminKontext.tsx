"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange, MapPin } from "lucide-react";
import { adminSchuljahr } from "@/lib/adminNavigation";
import { rolleLabel, type Rolle } from "@/constants/fortbildung";

const FILTERSEITEN = new Set([
  "/admin", "/admin/fortbildungen", "/admin/freigaben",
  "/admin/nachbereitung", "/admin/katalog", "/admin/auswertung",
]);

/** URL-gebundener Arbeitskontext. Auf Formularen und Betriebsseiten kein scheinbarer Datenfilter. */
export function AdminKontext({ bezirke, schuljahre, aktuell, rolle }: {
  bezirke: Array<{ id: string; name: string }>;
  schuljahre: string[];
  aktuell: string;
  rolle: Rolle;
}) {
  const pfad = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [laeuft, starte] = useTransition();
  const filterbar = FILTERSEITEN.has(pfad);
  const bezirk = params.get("bezirk") ?? "";
  const schuljahr = adminSchuljahr(params.get("schuljahr"), aktuell);
  const jahre = [...new Set([...schuljahre, ...(schuljahr !== "alle" ? [schuljahr] : [])])].sort().reverse();
  const unbekannterBezirk = Boolean(bezirk) && !bezirke.some((eintrag) => eintrag.id === bezirk);
  const auswahlKlasse = "min-h-10 w-full min-w-0 max-w-full rounded-md border border-input bg-card px-2.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:max-w-80";

  function setzen(name: "bezirk" | "schuljahr", wert: string) {
    const neu = new URLSearchParams(params.toString());
    if (wert) neu.set(name, wert);
    else neu.delete(name);
    neu.delete("seite");
    starte(() => router.push(`${pfad}${neu.size ? `?${neu}` : ""}`, { scroll: false }));
  }

  if (!filterbar) {
    return <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 text-sm sm:px-8 lg:px-10">
      <p className="min-w-0 break-words text-muted-foreground">
        {pfad === "/admin/kalender" ? "Terminabgleich · alle Schulamtsbezirke" : rolleLabel(rolle)}
      </p>
      {pfad === "/admin/archiv" ? <p className="text-xs text-muted-foreground">Schuljahr im Archivvorgang auswählen</p> : null}
    </div>;
  }

  return <div aria-label="Arbeitsbereich und Schuljahr" aria-busy={laeuft} className="flex min-w-0 flex-wrap items-end justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-8 lg:px-10">
    {bezirke.length > 1 || rolle === "RVS" || unbekannterBezirk ? (
      <label className="grid w-full min-w-0 gap-1.5 sm:w-auto">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><MapPin className="size-3.5" aria-hidden />Schulamtsbezirk</span>
        <select value={bezirk} onChange={(e) => setzen("bezirk", e.target.value)} disabled={laeuft} className={auswahlKlasse}>
          <option value="">{rolle === "RVS" ? "Alle Schulamtsbezirke" : "Alle zugeordneten Schulamtsbezirke"}</option>
          {unbekannterBezirk ? <option value={bezirk}>Nicht verfügbarer Schulamtsbezirk</option> : null}
          {bezirke.map((eintrag) => <option key={eintrag.id} value={eintrag.id}>{eintrag.name}</option>)}
        </select>
      </label>
    ) : <p className="min-w-0 max-w-full break-words py-2 text-sm font-medium">{bezirke[0]?.name ?? "Kein Schulamtsbezirk zugeordnet"}</p>}
    <label className="grid w-full min-w-0 gap-1.5 sm:w-auto">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarRange className="size-3.5" aria-hidden />Schuljahr</span>
      <select value={schuljahr} onChange={(e) => setzen("schuljahr", e.target.value)} disabled={laeuft} className={auswahlKlasse}>
        <option value="alle">Alle Schuljahre</option>
        {jahre.map((jahr) => <option key={jahr} value={jahr}>{jahr}{jahr === aktuell ? " · laufend" : ""}</option>)}
      </select>
    </label>
  </div>;
}
