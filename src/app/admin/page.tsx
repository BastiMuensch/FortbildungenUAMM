import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  FileText,
  Globe2,
  PencilLine,
  Send,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ERFASSER, fortbildungScope, requireRole } from "@/lib/auth";
import {
  darfFreigeben,
  NACHBEREITUNG_RUECKBLICK_TAGE,
} from "@/constants/fortbildung";
import { baueUrl, filterZuWhere, leseFilter, type SuchParameter } from "@/lib/filter";
import { aktuellesSchuljahr, schuljahrZeitraum } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { AdminFilterLeiste } from "@/components/admin/AdminFilterLeiste";
import { FortbildungTabelle } from "@/components/admin/FortbildungTabelle";
import { FreigabenBereich } from "@/components/admin/FreigabenBereich";
import { NachbereitungsBereich } from "@/components/admin/NachbereitungsBereich";
import { SchuljahrWahl } from "@/components/admin/SchuljahrWahl";

export const metadata = { title: "Fortbildungen verwalten" };

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  const user = await requireRole(...ERFASSER);
  const params = await searchParams;
  const filter = leseFilter(params);
  const scope = fortbildungScope(user);
  const istAdmin = darfFreigeben(user.role);
  const darfNachbereiten = user.role === "ADMIN" || user.role === "REFERENT";
  const bereichParam = Array.isArray(params.bereich) ? params.bereich[0] : params.bereich;
  const aktiverBereich =
    bereichParam === "freigaben" && istAdmin
      ? "freigaben"
      : bereichParam === "nachbereitung" && darfNachbereiten
        ? "nachbereitung"
        : null;
  const freigabenUrl = `${baueUrl("/admin", params, { bereich: "freigaben" })}#arbeitsbereich`;
  const nachbereitungUrl = `${baueUrl("/admin", params, { bereich: "nachbereitung" })}#arbeitsbereich`;
  const uebersichtUrl = baueUrl("/admin", params, { bereich: undefined });
  const where = { AND: [scope, filterZuWhere(filter)] };

  const laufendes = aktuellesSchuljahr();
  const kennzahlJahr = filter.schuljahr ?? laufendes;
  const { start, ende } = schuljahrZeitraum(kennzahlJahr);
  const jetzt = new Date();
  const nachbereitungsGrenze = new Date(
    jetzt.getTime() - NACHBEREITUNG_RUECKBLICK_TAGE * 24 * 60 * 60 * 1000,
  );

  const [fortbildungen, schlagworte, kennzahlen] = await Promise.all([
    prisma.fortbildung.findMany({
      where,
      orderBy: { beginn: "desc" },
      take: 300,
      select: {
        id: true,
        slug: true,
        titel: true,
        kurztitel: true,
        organisationsform: true,
        format: true,
        beginn: true,
        ende: true,
        maxTn: true,
        tnTatsaechlich: true,
        status: true,
        inFibs: true,
        fibsLehrgangsnummer: true,
        quelle: true,
        veranstaltungsort: { select: { name: true, ort: true, istOnline: true } },
        referenten: { select: { referent: { select: { vorname: true, nachname: true } } } },
      },
    }),
    prisma.schlagwort.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
    Promise.all([
      prisma.fortbildung.count({ where: { AND: [scope, { beginn: { gte: start, lte: ende } }] } }),
      prisma.fortbildung.count({ where: { AND: [scope, { status: "EINGEREICHT" }] } }),
      prisma.fortbildung.count({
        where: { AND: [scope, { status: "VEROEFFENTLICHT" }, { inFibs: false }, { ende: { gte: jetzt } }] },
      }),
      darfNachbereiten
        ? prisma.fortbildung.count({
            where: {
              AND: [
                scope,
                ...(user.role === "REFERENT"
                  ? [{ organisationsform: "SCHILF" }]
                  : []),
                { ende: { lt: jetzt, gte: nachbereitungsGrenze } },
                { status: { not: "ABGESAGT" } },
                user.role === "ADMIN"
                  ? {
                      OR: [
                        { tnTatsaechlich: null },
                        { teilnahmebestaetigungenReferentenVersandtAm: null },
                        { teilnahmebestaetigungenTeilnehmendeVersandtAm: null },
                      ],
                    }
                  : { tnTatsaechlich: null },
              ],
            },
          })
        : Promise.resolve(0),
      Promise.all([
        prisma.fortbildung.findFirst({ where: scope, orderBy: { beginn: "asc" }, select: { beginn: true } }),
        prisma.fortbildung.findFirst({ where: scope, orderBy: { beginn: "desc" }, select: { beginn: true } }),
      ]).then(([erste, letzte]) => vorhandeneSchuljahre(erste?.beginn, letzte?.beginn, laufendes)),
    ]),
  ]);

  const [imSchuljahr, zurFreigabe, ohneFibs, offeneMeldungen, jahrgaenge] = kennzahlen;
  const gruppen = gruppiereFortbildungen(fortbildungen);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-foreground pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user.role === "REFERENT" ? "Meine Fortbildungen" : "Fortbildungen"}
          </h1>
          <div className="mt-1.5"><SchuljahrWahl params={params} jahrgaenge={jahrgaenge} aktuell={laufendes} /></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button nativeButton={false} render={<Link href="/admin/fortbildungen/neu"><CalendarPlus className="size-4" aria-hidden />Neue Fortbildung</Link>} />
          <Button nativeButton={false} variant="outline" render={<Link href="/admin/kalender"><CalendarRange className="size-4" aria-hidden />Planungskalender</Link>} />
          <Button nativeButton={false} variant="outline" render={<a href={baueUrl("/api/admin/export", params, {})}><FileSpreadsheet className="size-4" aria-hidden />Excel</a>} />
          <Button nativeButton={false} variant="outline" title="Bericht nach SchiLf, RLFB und ALP gegliedert" render={<a href={baueUrl("/api/admin/export/pdf", params, {})}><FileText className="size-4" aria-hidden />PDF-Bericht</a>} />
        </div>
      </div>

      <WorkflowHinweis istAdmin={istAdmin} freigabenUrl={freigabenUrl} />

      <div className="grid gap-px overflow-hidden border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Kachel wert={imSchuljahr} label={`Termine im Schuljahr ${kennzahlJahr}`} icon={CalendarDays} />
        {istAdmin ? <Kachel wert={zurFreigabe} label="warten auf administrative Freigabe" icon={ShieldCheck} hervorheben={zurFreigabe > 0} aktiv={aktiverBereich === "freigaben"} href={freigabenUrl} /> : null}
        <Kachel wert={ohneFibs} label="veröffentlicht, aber nicht in FIBS" icon={Globe2} hervorheben={ohneFibs > 0} href={baueUrl("/admin", {}, { status: "VEROEFFENTLICHT", fibs: "offen" })} />
        {darfNachbereiten ? <Kachel wert={offeneMeldungen} label={user.role === "ADMIN" ? "Nachbereitungen noch offen" : "SchiLf-Teilnehmerzahlen noch offen"} icon={ClipboardCheck} hervorheben={offeneMeldungen > 0} aktiv={aktiverBereich === "nachbereitung"} href={nachbereitungUrl} /> : null}
      </div>

      {aktiverBereich ? (
        <section id="arbeitsbereich" className="scroll-mt-6 space-y-3" aria-label="Arbeitsbereich">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
            <p className="etikett text-primary">Arbeitsbereich</p>
            <Button nativeButton={false} size="sm" variant="outline" render={<Link href={uebersichtUrl}>Zur Fortbildungsübersicht</Link>} />
          </div>
          {aktiverBereich === "freigaben" ? <FreigabenBereich eingebettet /> : <NachbereitungsBereich eingebettet />}
        </section>
      ) : null}

      <AdminFilterLeiste params={params} schlagworte={schlagworte.map((s) => s.name)} />

      {fortbildungen.length === 0 ? (
        <div className="border border-l-4 border-l-primary bg-card py-16 text-center">
          <Download className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Keine Fortbildung gefunden. Filter anpassen oder <Link href="/admin/fortbildungen/neu" className="text-foreground underline underline-offset-4">neue Fortbildung anlegen</Link>.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {gruppen.map((gruppe) => (
            <section key={gruppe.id} aria-labelledby={`gruppe-${gruppe.id}`}>
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b pb-2">
                <div>
                  <p className="etikett text-primary">{gruppe.eyebrow}</p>
                  <h2 id={`gruppe-${gruppe.id}`} className="mt-0.5 text-lg font-semibold tracking-tight">
                    {gruppe.titel}<span className="ml-2 text-sm font-normal text-muted-foreground">({gruppe.fortbildungen.length})</span>
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{gruppe.beschreibung}</p>
                </div>
                {gruppe.id === "eingereicht" && istAdmin ? <Button nativeButton={false} size="sm" render={<Link href={freigabenUrl}><ShieldCheck className="size-3.5" aria-hidden />Freigaben öffnen</Link>} /> : null}
              </div>
              <FortbildungTabelle fortbildungen={gruppe.fortbildungen} />
            </section>
          ))}
        </div>
      )}

      {fortbildungen.length === 300 ? <p className="text-xs text-muted-foreground">Es werden die 300 neuesten Treffer angezeigt. Für mehr bitte den Zeitraum eingrenzen oder den Excel-Export nutzen.</p> : null}
    </div>
  );
}

function WorkflowHinweis({ istAdmin, freigabenUrl }: { istAdmin: boolean; freigabenUrl: string }) {
  const schritte = [
    { icon: PencilLine, titel: "Entwurf", text: "Fortbildung ausarbeiten" },
    { icon: Send, titel: "Einreichen", text: "zur Prüfung senden" },
    { icon: ShieldCheck, titel: "Admin-Freigabe", text: "prüfen und veröffentlichen" },
    { icon: Globe2, titel: "Öffentlich", text: "im Angebot sichtbar" },
    { icon: CheckCircle2, titel: "FIBS", text: "Anmeldung möglich" },
  ];
  return (
    <section className="border bg-card p-4" aria-labelledby="workflow-titel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="etikett text-primary">Veröffentlichungsweg</p><h2 id="workflow-titel" className="mt-0.5 font-semibold">Vom Entwurf zur Anmeldung</h2></div>
        {istAdmin ? <Button nativeButton={false} size="sm" render={<Link href={freigabenUrl}>Freigaben bearbeiten</Link>} /> : <p className="max-w-sm text-right text-xs leading-relaxed text-muted-foreground">Freigaben, Veröffentlichung und FIBS-Markierung übernimmt ausschließlich die Administration.</p>}
      </div>
      <ol className="mt-4 grid gap-2 sm:grid-cols-5">
        {schritte.map(({ icon: Icon, titel, text }, index) => (
          <li key={titel} className="flex gap-2 border bg-background p-2.5 sm:block">
            <span className="zahl flex size-6 shrink-0 items-center justify-center bg-primary text-xs font-semibold text-primary-foreground sm:mb-2">{index + 1}</span>
            <div><p className="flex items-center gap-1.5 text-xs font-semibold"><Icon className="size-3.5 text-primary" aria-hidden />{titel}</p><p className="mt-0.5 text-xs leading-snug text-muted-foreground">{text}</p></div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function gruppiereFortbildungen<T extends { status: string; inFibs: boolean }>(fortbildungen: T[]) {
  return [
    { id: "entwuerfe", eyebrow: "1. Vorbereitung", titel: "Entwürfe und zurückgewiesene Fortbildungen", beschreibung: "Noch in Arbeit oder mit Hinweisen aus der Freigabe.", fortbildungen: fortbildungen.filter((f) => f.status === "ENTWURF") },
    { id: "eingereicht", eyebrow: "2. Nächster Schritt", titel: "Zur administrativen Freigabe eingereicht", beschreibung: "Warten auf Prüfung, Veröffentlichung und den anschließenden FIBS-Schritt.", fortbildungen: fortbildungen.filter((f) => f.status === "EINGEREICHT") },
    { id: "ohne-fibs", eyebrow: "3. Veröffentlichung", titel: "Veröffentlicht, noch nicht in FIBS eingetragen", beschreibung: "Im Frontend sichtbar; die verbindliche Anmeldung ist erst nach der FIBS-Ausschreibung möglich.", fortbildungen: fortbildungen.filter((f) => f.status === "VEROEFFENTLICHT" && !f.inFibs) },
    { id: "in-fibs", eyebrow: "4. Anmeldung läuft", titel: "In FIBS eingetragen", beschreibung: "Veröffentlicht und für die Anmeldung über FIBS vorbereitet.", fortbildungen: fortbildungen.filter((f) => f.status === "VEROEFFENTLICHT" && f.inFibs) },
    { id: "abgeschlossen", eyebrow: "Abgeschlossen", titel: "Archiviert oder abgesagt", beschreibung: "Bleiben zur Dokumentation erhalten und sind nicht Teil des aktiven Angebots.", fortbildungen: fortbildungen.filter((f) => f.status === "ARCHIVIERT" || f.status === "ABGESAGT") },
  ].filter((gruppe) => gruppe.fortbildungen.length > 0);
}

function Kachel({ wert, label, icon: Icon, hervorheben, aktiv, href }: { wert: number; label: string; icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>; hervorheben?: boolean; aktiv?: boolean; href?: string }) {
  const inhalt = <div className="flex items-center gap-3"><span className="zahl min-w-9 text-2xl leading-none font-semibold">{String(wert).padStart(2, "0")}</span><span className="flex min-w-0 items-start gap-1.5 text-xs leading-snug text-muted-foreground"><Icon className={`mt-0.5 size-3.5 shrink-0 ${hervorheben ? "text-primary" : ""}`} aria-hidden />{label}</span></div>;
  const klassen = `p-3 ${aktiv ? "bg-primary/10 ring-2 ring-inset ring-primary" : hervorheben ? "bg-primary/5" : "bg-card"}`;
  return href ? <Link href={href} aria-current={aktiv ? "page" : undefined} className={`${klassen} zeile block hover:bg-accent`}>{inhalt}</Link> : <div className={klassen}>{inhalt}</div>;
}

function vorhandeneSchuljahre(erste: Date | undefined, letzte: Date | undefined, laufendes: string): string[] {
  const jahre = new Set<string>([laufendes]);
  if (erste && letzte) {
    const von = Number(aktuellesSchuljahr(erste).slice(0, 4));
    const bis = Number(aktuellesSchuljahr(letzte).slice(0, 4));
    for (let jahr = von; jahr <= bis; jahr += 1) jahre.add(`${jahr}/${jahr + 1}`);
  }
  return [...jahre].sort().reverse();
}
