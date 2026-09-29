"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { bereiteArchivpaketVor, bestaetigeArchivuebernahme, erteileArchivnachfrist, type ArchivState } from "@/actions/archiv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Zeile = {
  bezirkId: string;
  bezirkName: string;
  schuljahr: number;
  fristAbgelaufen: boolean;
  hinweis: string;
  nachfristBis?: Date;
  paketAktuell: boolean;
  anzahl: number;
  paket?: { paketkennung: string; inhaltsHash: string; anzahl: number; uebernommen: boolean };
};

export function ArchivuebergabeFormular({ zeilen, darfNachfristErteilen }: { zeilen: Zeile[]; darfNachfristErteilen: boolean }) {
  if (!zeilen.length) return <p className="text-sm text-muted-foreground">Für Ihren Bereich liegen keine Schuljahre zur Archivübergabe vor.</p>;
  return <div className="space-y-5">{zeilen.map((zeile) => <Archivzeile key={`${zeile.bezirkId}-${zeile.schuljahr}`} zeile={zeile} darfNachfristErteilen={darfNachfristErteilen} />)}</div>;
}

function Archivzeile({ zeile, darfNachfristErteilen }: { zeile: Zeile; darfNachfristErteilen: boolean }) {
  const router = useRouter();
  const vorbereiten = (bisher: ArchivState) => bereiteArchivpaketVor(bisher, zeile.bezirkId, String(zeile.schuljahr));
  const [vorbereitungsStand, vorbereite, laeuft] = useActionState<ArchivState, FormData>(vorbereiten, {});
  const [stand, bestaetigen, bestaetigt] = useActionState<ArchivState, FormData>(bestaetigeArchivuebernahme, {});
  const [nachfristStand, nachfrist, nachfristLaeuft] = useActionState<ArchivState, FormData>(erteileArchivnachfrist, {});
  useEffect(() => { if (vorbereitungsStand.erfolg || stand.erfolg || nachfristStand.erfolg) router.refresh(); }, [router, stand.erfolg, vorbereitungsStand.erfolg, nachfristStand.erfolg]);

  const schuljahrText = `${zeile.schuljahr}/${zeile.schuljahr + 1}`;
  const download = zeile.paket
    && zeile.paketAktuell
    ? `/api/admin/archiv/download?bezirkId=${encodeURIComponent(zeile.bezirkId)}&schuljahr=${schuljahrText}`
    : null;
  const nachfristErforderlich = zeile.fristAbgelaufen && !zeile.nachfristBis;
  // Eine bereits vorhandene, aktuelle externe Kopie darf auch nach Ablauf
  // bestätigt werden. Die Nachfrist schützt nur neue Vorbereitung/Downloads.
  const darfBestaetigen = Boolean(zeile.paket && zeile.paketAktuell && !zeile.paket.uebernommen);
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{zeile.bezirkName} · {schuljahrText}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{zeile.anzahl} Fortbildungen · {zeile.fristAbgelaufen ? "Frist abgelaufen" : "Frist noch nicht abgelaufen"}</p>
        </div>
        {zeile.paket?.uebernommen ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Übergabe bestätigt</span> : nachfristErforderlich ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">RvS-Nachfrist nötig</span> : <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">Übergabe offen</span>}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Das Paket enthält keine Kontakte, internen Notizen, Freitexte oder Sitzungsdaten. Die Dauer der externen Ablage ist noch festzulegen.</p>
      <p className={`mt-2 text-sm ${zeile.paket?.uebernommen ? "text-primary" : nachfristErforderlich ? "text-amber-800" : "text-muted-foreground"}`}>{zeile.hinweis}</p>
      {nachfristErforderlich ? (
        darfNachfristErteilen
          ? <p className="mt-4 text-sm text-muted-foreground">Erteilen Sie zuerst eine begründete Nachfrist. Danach können Sie ein Paket vorbereiten und herunterladen.{darfBestaetigen ? " Eine bereits vorhandene aktuelle externe Kopie kann unten bestätigt werden." : ""}</p>
          : <p className="mt-4 text-sm text-muted-foreground">Bitte die Regierung von Schwaben um eine begründete Nachfrist bitten. Bis dahin sind Vorbereitung und Download gesperrt.{darfBestaetigen ? " Eine bereits vorhandene aktuelle externe Kopie kann unten bestätigt werden." : ""}</p>
      ) : !zeile.paket?.uebernommen ? <div className="mt-4 flex flex-wrap gap-2">
        <form action={vorbereite}><Button type="submit" className="min-h-11" disabled={laeuft}>{laeuft ? "Wird vorbereitet …" : zeile.paketAktuell ? "Paket aktualisieren" : "Paket vorbereiten"}</Button></form>
        {download ? <Button nativeButton={false} className="min-h-11" variant="outline" render={<a href={download}>ZIP herunterladen</a>} /> : null}
      </div> : null}
      {vorbereitungsStand.fehler ? <p role="alert" className="mt-2 text-sm text-destructive">{vorbereitungsStand.fehler}</p> : null}
      {vorbereitungsStand.erfolg ? <p role="status" className="mt-2 text-sm text-primary">{vorbereitungsStand.meldung}</p> : null}
      {darfBestaetigen ? (
        <form action={bestaetigen} className="mt-5 grid gap-3 border-t pt-5">
          <input type="hidden" name="bezirkId" value={zeile.bezirkId} />
          <input type="hidden" name="schuljahr" value={schuljahrText} />
          <input type="hidden" name="paketkennung" value={zeile.paket?.paketkennung ?? ""} />
          <input type="hidden" name="inhaltsHash" value={zeile.paket?.inhaltsHash ?? ""} />
          <label className="grid gap-1 text-sm font-medium">Getrennte externe Ablage
            <Input name="externeAblage" required maxLength={500} placeholder="z. B. Aktenzeichen oder Ablageort" />
          </label>
          <label className="flex items-start gap-2 text-sm"><input name="lesbarkeitBestaetigt" type="checkbox" required className="mt-1" />Ich habe das heruntergeladene Paket in der getrennten Ablage abgelegt und dort lesbar geprüft.</label>
          <div><Button type="submit" className="min-h-11" disabled={bestaetigt}>{bestaetigt ? "Wird bestätigt …" : "Übergabe bestätigen"}</Button></div>
          {stand.fehler ? <p role="alert" className="text-sm text-destructive">{stand.fehler}</p> : null}
          {stand.erfolg ? <p role="status" className="text-sm text-primary">{stand.meldung}</p> : null}
        </form>
      ) : null}
      {darfNachfristErteilen && zeile.fristAbgelaufen && !zeile.paket?.uebernommen ? (
        <form action={nachfrist} className="mt-5 grid gap-3 border-t pt-5">
          <input type="hidden" name="bezirkId" value={zeile.bezirkId} />
          <input type="hidden" name="schuljahr" value={schuljahrText} />
          <label className="grid gap-1 text-sm font-medium">Begründung der Nachfrist
            <Input name="begruendung" required minLength={10} maxLength={1000} placeholder="Warum muss das Paket nach Fristablauf erneut heruntergeladen werden?" />
          </label>
          <div><Button type="submit" className="min-h-11" variant="outline" disabled={nachfristLaeuft}>{nachfristLaeuft ? "Wird freigegeben …" : "Nachfrist für 7 Tage erteilen"}</Button></div>
          {nachfristStand.fehler ? <p role="alert" className="text-sm text-destructive">{nachfristStand.fehler}</p> : null}
          {nachfristStand.erfolg ? <p role="status" className="text-sm text-primary">{nachfristStand.meldung}</p> : null}
        </form>
      ) : null}
    </section>
  );
}
