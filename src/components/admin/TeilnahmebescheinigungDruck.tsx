"use client";

import { useId, useState, type FormEvent } from "react";
import { Download, Printer } from "lucide-react";
import { MAX_BESCHEINIGUNGEN } from "@/lib/teilnahmebescheinigung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TeilnahmebescheinigungDruck({ id, vorgeschlageneAnzahl }: { id: string; vorgeschlageneAnzahl: number }) {
  const feldId = useId();
  const [laedt, setLaedt] = useState(false);
  const [fehler, setFehler] = useState("");
  const [meldung, setMeldung] = useState("");

  async function herunterladen(ereignis: FormEvent<HTMLFormElement>) {
    ereignis.preventDefault();
    const anzahl = String(new FormData(ereignis.currentTarget).get("anzahl") ?? "");
    setLaedt(true);
    setFehler("");
    setMeldung("");
    try {
      const antwort = await fetch(`/api/admin/export/teilnahmebescheinigung?${new URLSearchParams({ id, anzahl })}`, { cache: "no-store" });
      if (!antwort.ok) {
        const daten = await antwort.json().catch(() => null);
        throw new Error(daten?.fehler ?? "Die Bescheinigungen konnten nicht erstellt werden. Bitte erneut versuchen.");
      }
      if (!antwort.headers.get("content-type")?.startsWith("application/pdf")) {
        throw new Error("Die Bescheinigungen konnten nicht geladen werden. Bitte erneut anmelden.");
      }
      const adresse = URL.createObjectURL(await antwort.blob());
      const link = document.createElement("a");
      link.href = adresse;
      link.download = `teilnahmebescheinigungen-${id}-${anzahl}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Der Browser muss den Download übernehmen, bevor die URL freigegeben wird.
      window.setTimeout(() => URL.revokeObjectURL(adresse), 30_000);
      setMeldung(`${anzahl} ${anzahl === "1" ? "Bescheinigung ist" : "Bescheinigungen sind"} bereit. Öffnen Sie die PDF und drucken Sie alle Seiten einmal aus.`);
    } catch (fehler) {
      setFehler(fehler instanceof Error ? fehler.message : "Der Download ist fehlgeschlagen. Bitte erneut versuchen.");
    } finally {
      setLaedt(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-4" aria-labelledby={`${feldId}-titel`}>
      <h2 id={`${feldId}-titel`} className="flex items-center gap-2 text-sm font-semibold">
        <Printer className="size-4 text-muted-foreground" aria-hidden />Teilnahmebescheinigungen
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Druckfertige A4-Bescheinigungen mit BdB-Logo, Veranstaltungsdaten und den zuständigen BdBs.
        Die Namen der Teilnehmenden werden nach dem Drucken eingetragen.
      </p>
      <form onSubmit={herunterladen} className="mt-4 flex flex-wrap items-end gap-3" aria-busy={laedt}>
        <div className="space-y-1">
          <label htmlFor={feldId} className="text-sm font-medium">Anzahl Exemplare</label>
          <Input id={feldId} name="anzahl" type="number" min={1} max={MAX_BESCHEINIGUNGEN} step={1} required
            defaultValue={Math.max(1, Math.min(MAX_BESCHEINIGUNGEN, vorgeschlageneAnzahl))}
            disabled={laedt} className="w-28" aria-describedby={`${feldId}-hinweis`} />
        </div>
        <Button type="submit" variant="outline" disabled={laedt}>
          <Download className="size-4" aria-hidden />{laedt ? "PDF wird erstellt …" : "PDF zum Drucken herunterladen"}
        </Button>
      </form>
      <p id={`${feldId}-hinweis`} className="mt-2 text-xs text-muted-foreground">
        1 bis {MAX_BESCHEINIGUNGEN} Exemplare. Die PDF enthält bereits die gewählte Anzahl;
        im Druckdialog nur eine Kopie einstellen. Der FIBS-Versandvermerk wird dadurch nicht geändert.
      </p>
      {fehler ? <p role="alert" className="mt-3 text-sm text-destructive">{fehler}</p> : null}
      {meldung ? <p role="status" className="mt-3 text-sm text-primary">{meldung}</p> : null}
    </section>
  );
}
