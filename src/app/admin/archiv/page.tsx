import { requireRole, bezirkScope } from "@/lib/auth";
import { fortbildungBezirksScope } from "@/lib/berechtigungsScope";
import { archivinhaltsHash, ladeArchivInhalt } from "@/lib/archiv";
import { letzterLauf } from "@/lib/retention";
import { formatDatumZeit } from "@/lib/datetime";
import { schuljahrBeginn } from "@/lib/schuljahr";
import { prisma } from "@/lib/prisma";
import { ArchivuebergabeFormular } from "@/components/admin/ArchivuebergabeFormular";
import { BerichteNavigation } from "@/components/admin/BerichteNavigation";
import type { SuchParameter } from "@/lib/filter";

export const metadata = { title: "Archivübergabe" };
export const dynamic = "force-dynamic";

/**
 * Eng begrenzte Verwaltungsansicht für fällige bzw. bereits vorbereitete
 * Kohorten. Sie ist kein Ersatz für die regulären Fortbildungslisten.
 */
export default async function ArchivSeite({ searchParams }: { searchParams: Promise<SuchParameter> }) {
  const user = await requireRole("RVS", "ADMIN");
  const params = await searchParams;
  const jetzt = new Date();
  const letzterLoeschlauf = await letzterLauf();
  const loeschlaufUeberfaellig = !letzterLoeschlauf || jetzt.getTime() - letzterLoeschlauf.getTime() > 36 * 60 * 60 * 1000;
  const [fortbildungen, pakete, nachfristen] = await Promise.all([
    prisma.fortbildung.findMany({
      where: { AND: [fortbildungBezirksScope(user)] },
      select: { bezirkId: true, schuljahr: true, aufbewahrenBis: true, bezirk: { select: { name: true } } },
      orderBy: [{ bezirk: { name: "asc" } }, { schuljahr: "asc" }],
    }),
    prisma.archivpaket.findMany({
      where: { bezirk: bezirkScope(user) },
      select: { bezirkId: true, schuljahr: true, paketkennung: true, inhaltsHash: true, anzahl: true, uebernahmen: { select: { inhaltsHash: true, lesbarkeitBestaetigtAm: true, externeAblage: true }, orderBy: { lesbarkeitBestaetigtAm: "desc" } } },
    }),
    prisma.archivnachfristFreigabe.findMany({
      where: { gueltigBis: { gt: jetzt }, bezirk: bezirkScope(user) },
      select: { bezirkId: true, schuljahr: true, gueltigBis: true },
    }),
  ]);
  const gruppen = new Map<string, { bezirkId: string; bezirkName: string; schuljahr: number; anzahl: number; fristAbgelaufen: boolean }>();
  for (const fortbildung of fortbildungen) {
    const schluessel = `${fortbildung.bezirkId}-${fortbildung.schuljahr}`;
    const gruppe = gruppen.get(schluessel) ?? { bezirkId: fortbildung.bezirkId, bezirkName: fortbildung.bezirk.name, schuljahr: fortbildung.schuljahr, anzahl: 0, fristAbgelaufen: true };
    gruppe.anzahl += 1;
    gruppe.fristAbgelaufen &&= fortbildung.aufbewahrenBis <= jetzt;
    gruppen.set(schluessel, gruppe);
  }
  const paketNachKohorte = new Map(pakete.map((paket) => [`${paket.bezirkId}-${paket.schuljahr}`, paket]));
  const nachfristNachKohorte = new Map(nachfristen.map((nachfrist) => [`${nachfrist.bezirkId}-${nachfrist.schuljahr}`, nachfrist.gueltigBis]));
  const zeilen = (await Promise.all([...gruppen.values()]
    .map(async (gruppe) => {
      const paket = paketNachKohorte.get(`${gruppe.bezirkId}-${gruppe.schuljahr}`);
      const nachfristBis = nachfristNachKohorte.get(`${gruppe.bezirkId}-${gruppe.schuljahr}`);
      const inhalt = await ladeArchivInhalt(gruppe.bezirkId, gruppe.schuljahr);
      const aktuell = inhalt ? archivinhaltsHash(inhalt) : null;
      const uebernommen = Boolean(paket && aktuell && paket.inhaltsHash === aktuell && paket.uebernahmen.some((uebernahme) => uebernahme.inhaltsHash === aktuell));
      const paketAktuell = Boolean(paket && aktuell && paket.inhaltsHash === aktuell);
      const hinweis = uebernommen
        ? "Die bestätigte Übernahme stimmt mit dem aktuellen Paketinhalt überein."
        : paket && aktuell && paket.inhaltsHash !== aktuell
          ? "Die Daten haben sich seit dieser Paketversion geändert. Bereiten Sie eine neue Version vor."
          : gruppe.fristAbgelaufen
            ? nachfristBis ? `Die RvS-Nachfrist ist bis ${formatDatumZeit(nachfristBis)} aktiv.` : "Die Frist ist abgelaufen. Für die Vorbereitung und den Download ist eine RvS-Nachfrist erforderlich."
            : "Noch nicht fällig: Paket kann vorbereitet werden, die Löschung bleibt gesperrt.";
      return { ...gruppe, hinweis, nachfristBis, paketAktuell, paket: paket ? { paketkennung: paket.paketkennung, inhaltsHash: paket.inhaltsHash, anzahl: paket.anzahl, uebernommen } : undefined };
    })))
    .filter((zeile) => schuljahrBeginn(zeile.schuljahr + 1) <= jetzt || zeile.paket)
    .sort((a, b) => Number(b.fristAbgelaufen) - Number(a.fristAbgelaufen) || a.bezirkName.localeCompare(b.bezirkName) || a.schuljahr - b.schuljahr);

  return (
    <div className="max-w-4xl space-y-6">
      <BerichteNavigation aktiveSeite="archiv" rolle={user.role} params={params} />
      <div>
        <p className="etikett text-primary">Getrennte Ablage</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Archivübergabe</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Vor dem Löschen wird ein minimiertes ZIP-Paket je Schulamtsbezirk und Schuljahr vorbereitet, extern abgelegt und lesbar bestätigt. Eine Änderung der Fortbildungsdaten entwertet diese Bestätigung.</p>
      </div>
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">Die externe Aufbewahrungsdauer ist noch nicht festgelegt. Die verbindliche Frist wird durch die zuständige Stelle festgelegt.</div>
      <p className={`text-sm ${loeschlaufUeberfaellig ? "text-amber-800" : "text-muted-foreground"}`}>{letzterLoeschlauf ? `Letzter Löschlauf: ${formatDatumZeit(letzterLoeschlauf)}.` : "Es liegt noch kein erfolgreicher Löschlauf vor."} {loeschlaufUeberfaellig ? "Bitte den IT-Betrieb verständigen und die Zeitsteuerung prüfen lassen. Abgelaufene Daten bleiben für reguläre Zugriffe gesperrt." : ""}</p>
      <ArchivuebergabeFormular zeilen={zeilen} darfNachfristErteilen={user.role === "RVS"} />
      {pakete.some((paket) => !gruppen.has(`${paket.bezirkId}-${paket.schuljahr}`) && paket.uebernahmen.length) ? (
        <section className="space-y-3 border-t pt-5">
          <h2 className="font-semibold">Abgeschlossene Übergaben</h2>
          <p className="text-sm text-muted-foreground">Diese Pakete sind extern übernommen; die Veranstaltungen liegen nicht mehr im laufenden Tool.</p>
          {pakete.filter((paket) => !gruppen.has(`${paket.bezirkId}-${paket.schuljahr}`) && paket.uebernahmen.length).map((paket) => (
            <div key={paket.paketkennung} className="rounded-lg border p-4 text-sm">
              <p className="font-medium">{paket.schuljahr}/{paket.schuljahr + 1} · {paket.anzahl} Fortbildungen</p>
              <p className="break-all">{paket.paketkennung}</p>
              <p>{paket.uebernahmen[0].externeAblage} · bestätigt am {formatDatumZeit(paket.uebernahmen[0].lesbarkeitBestaetigtAm)}</p>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );
}
