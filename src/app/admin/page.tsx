import Link from "next/link";
import { redirect } from "next/navigation";
import { istEinrichtungOffen } from "@/lib/schulamt";
import {
  CalendarDays,
  CalendarPlus,
  ChevronDown,
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
  if (user.role === "ADMIN" && await istEinrichtungOffen()) redirect("/admin/einrichtung");
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
  const fibsAktiv =
    aktiverBereich === null &&
    filter.status === "VEROEFFENTLICHT" &&
    filter.fibs === "offen-ausschreibung";
  const freigabenUrl = `${baueUrl("/admin", params, { bereich: "freigaben" })}#arbeitsbereich`;
  const nachbereitungUrl = `${baueUrl("/admin", params, { bereich: "nachbereitung" })}#arbeitsbereich`;
  const fibsUrl = `${baueUrl(
    "/admin",
    params,
    fibsAktiv
      ? { status: undefined, fibs: undefined }
      : {
          status: "VEROEFFENTLICHT",
          fibs: "offen-ausschreibung",
          bereich: undefined,
        },
  )}#fortbildungslisten`;
  const uebersichtUrl = baueUrl(
    "/admin",
    params,
    fibsAktiv
      ? { bereich: undefined, status: undefined, fibs: undefined }
      : { bereich: undefined },
  );
  const uebersichtAktiv = aktiverBereich === null && !fibsAktiv;
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
        where: {
          AND: [
            scope,
            { status: "VEROEFFENTLICHT" },
            { organisationsform: { not: "SCHILF" } },
            { inFibs: false },
            { ende: { gte: jetzt } },
          ],
        },
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
                { status: { in: ["VEROEFFENTLICHT", "ARCHIVIERT"] } },
                user.role === "ADMIN"
                  ? {
                      OR: [
                        { tnTatsaechlich: null },
                        { teilnahmebestaetigungenReferentenVersandtAm: null },
                        { teilnahmebestaetigungenTeilnehmendeVersandtAm: null },
                        { organisationsform: "SCHILF", inFibs: false },
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
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm text-muted-foreground">Verwaltung · {kennzahlJahr}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
            {user.role === "REFERENT" ? "Meine Fortbildungen" : "Fortbildungen"}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">Planen, freigeben und nachbereiten – alles an einem Ort.</p>
          <div className="mt-3"><SchuljahrWahl params={params} jahrgaenge={jahrgaenge} aktuell={laufendes} /></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button nativeButton={false} render={<Link href="/admin/fortbildungen/neu"><CalendarPlus className="size-4" aria-hidden />Neue Fortbildung</Link>} />
          <details className="group relative">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent [&::-webkit-details-marker]:hidden">
              <Download className="size-4" aria-hidden />Export<ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="absolute right-0 z-10 mt-2 grid min-w-48 gap-1 rounded-xl border bg-popover p-1.5 text-sm shadow-lg">
              <a className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent" href={baueUrl("/api/admin/export", params, {})}><FileSpreadsheet className="size-4" aria-hidden />Excel exportieren</a>
              <a className="flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-accent" title="Bericht nach SchiLf, RLFB und ALP gegliedert" href={baueUrl("/api/admin/export/pdf", params, {})}><FileText className="size-4" aria-hidden />PDF-Bericht</a>
            </div>
          </details>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kachel
          wert={imSchuljahr}
          label={`Termine im Schuljahr ${kennzahlJahr}`}
          icon={CalendarDays}
          href={uebersichtUrl}
          aktiv={uebersichtAktiv}
        />
        {istAdmin ? (
          <Kachel
            wert={zurFreigabe}
            label="Freigaben offen"
            icon={ShieldCheck}
            hervorheben={zurFreigabe > 0}
            aktiv={aktiverBereich === "freigaben"}
            href={freigabenUrl}
          />
        ) : null}
        <Kachel
          wert={ohneFibs}
          label="FIBS-Ausschreibung offen"
          icon={Globe2}
          hervorheben={ohneFibs > 0}
          aktiv={fibsAktiv}
          href={fibsUrl}
        />
        {darfNachbereiten ? (
          <Kachel
            wert={offeneMeldungen}
            label={
              user.role === "ADMIN"
                ? "Nachbereitungen offen"
                : "SchiLf-Zahlen offen"
            }
            icon={ClipboardCheck}
            hervorheben={offeneMeldungen > 0}
            aktiv={aktiverBereich === "nachbereitung"}
            href={nachbereitungUrl}
          />
        ) : null}
      </div>

      <WorkflowHinweis istAdmin={istAdmin} freigabenUrl={freigabenUrl} />

      {aktiverBereich ? (
        <section id="arbeitsbereich" className="scroll-mt-6 space-y-3" aria-label="Arbeitsbereich">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
            <p className="etikett text-primary">Arbeitsbereich</p>
            <Button nativeButton={false} size="sm" variant="outline" render={<Link href={uebersichtUrl}>Zur Fortbildungsübersicht</Link>} />
          </div>
          {aktiverBereich === "freigaben" ? <FreigabenBereich eingebettet /> : <NachbereitungsBereich eingebettet />}
        </section>
      ) : null}

      <div id="fortbildungslisten" className="scroll-mt-6">
        <AdminFilterLeiste params={params} schlagworte={schlagworte.map((s) => s.name)} />
      </div>

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
                    {gruppe.titel}
                    <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full border border-border bg-muted px-1.5 py-0.5 align-middle text-xs font-medium leading-none text-muted-foreground">
                      <span className="sr-only">Anzahl: </span>{gruppe.fortbildungen.length}
                    </span>
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
    { icon: CheckCircle2, titel: "FIBS", text: "Anmeldung oder SchiLf-Nachtrag" },
  ];
  return (
    <details className="group rounded-2xl border bg-card px-4 py-3 shadow-sm" aria-labelledby="workflow-titel">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <div><p className="text-sm font-semibold">Veröffentlichungsweg</p><p className="mt-0.5 text-xs text-muted-foreground">Vom Entwurf zur Anmeldung</p></div>
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-4 border-t pt-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="workflow-titel" className="text-sm font-semibold">Die fünf Schritte</h2>
          {istAdmin ? <Button nativeButton={false} size="sm" render={<Link href={freigabenUrl}>Freigaben bearbeiten</Link>} /> : <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">Freigaben, Veröffentlichung und FIBS-Markierung übernimmt die Administration.</p>}
        </div>
        <ol className="mt-3 grid gap-2 sm:grid-cols-5">
          {schritte.map(({ icon: Icon, titel, text }, index) => (
            <li key={titel} className="flex gap-2 rounded-xl border bg-background p-2.5 sm:block">
              <span className="zahl flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground sm:mb-2">{index + 1}</span>
              <div><p className="flex items-center gap-1.5 text-xs font-semibold"><Icon className="size-3.5 shrink-0 text-primary" aria-hidden />{titel}</p><p className="mt-0.5 text-xs leading-snug text-muted-foreground">{text}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted-foreground">SchiLf wird üblicherweise erst nach dem Termin in FIBS nachgetragen.</p>
      </div>
    </details>
  );
}

function gruppiereFortbildungen<
  T extends { status: string; inFibs: boolean; organisationsform: string },
>(fortbildungen: T[]) {
  return [
    { id: "entwuerfe", eyebrow: "Vorbereitung", titel: "Entwürfe", beschreibung: "Noch in Bearbeitung.", fortbildungen: fortbildungen.filter((f) => f.status === "ENTWURF") },
    { id: "eingereicht", eyebrow: "Nächster Schritt", titel: "Zur Freigabe", beschreibung: "Warten auf administrative Prüfung.", fortbildungen: fortbildungen.filter((f) => f.status === "EINGEREICHT") },
    { id: "ohne-fibs", eyebrow: "Veröffentlichung", titel: "FIBS-Ausschreibung offen", beschreibung: "RLFB und ALP warten auf den FIBS-Schritt.", fortbildungen: fortbildungen.filter((f) => f.status === "VEROEFFENTLICHT" && !f.inFibs && f.organisationsform !== "SCHILF") },
    { id: "schilf-nachtrag", eyebrow: "SchiLf", titel: "FIBS-Nachtrag", beschreibung: "Nach dem Termin in FIBS vermerken.", fortbildungen: fortbildungen.filter((f) => f.status === "VEROEFFENTLICHT" && !f.inFibs && f.organisationsform === "SCHILF") },
    { id: "in-fibs", eyebrow: "FIBS", titel: "In FIBS eingetragen", beschreibung: "Ausschreibung oder Nachtrag erledigt.", fortbildungen: fortbildungen.filter((f) => f.status === "VEROEFFENTLICHT" && f.inFibs) },
    { id: "abgeschlossen", eyebrow: "Abgeschlossen", titel: "Archiviert oder abgesagt", beschreibung: "Zur Dokumentation erhalten.", fortbildungen: fortbildungen.filter((f) => f.status === "ARCHIVIERT" || f.status === "ABGESAGT") },
  ].filter((gruppe) => gruppe.fortbildungen.length > 0);
}

function Kachel({
  wert,
  label,
  icon: Icon,
  hervorheben,
  aktiv,
  href,
}: {
  wert: number;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  hervorheben?: boolean;
  aktiv?: boolean;
  href?: string;
}) {
  const inhalt = (
    <div className="grid h-[140px] grid-rows-[1.25rem_1fr_2.5rem] p-4 max-[360px]:h-[160px] max-[360px]:grid-rows-[1.25rem_1fr_3.75rem] sm:h-[160px] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <Icon className={`size-5 shrink-0 ${aktiv ? "text-primary-foreground" : "text-primary"}`} aria-hidden />
        {hervorheben && !aktiv ? <span className="size-2 shrink-0 rounded-full bg-ferien" aria-label="Offene Aufgabe" /> : null}
      </div>
      <p className={`zahl self-end text-3xl leading-none font-semibold sm:text-4xl ${aktiv ? "text-primary-foreground" : "text-foreground"}`}>{String(wert).padStart(2, "0")}</p>
      <p className={`min-h-10 pt-2 text-sm leading-snug ${aktiv ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
    </div>
  );
  const klassen = `rounded-2xl border shadow-sm transition-colors ${aktiv ? "border-primary bg-primary shadow-md" : "border-border bg-card"}`;

  return href ? (
    <Link
      href={href}
      aria-current={aktiv ? "page" : undefined}
      className={`${klassen} block ${aktiv ? "hover:bg-primary/90" : "hover:bg-accent"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
    >
      {inhalt}
    </Link>
  ) : (
    <div className={klassen}>{inhalt}</div>
  );
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
