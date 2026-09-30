import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  FileSpreadsheet,
  Globe2,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ERFASSER, fortbildungScope, requireRole } from "@/lib/auth";
import { istEinrichtungOffen } from "@/lib/schulamt";
import { darfFreigeben } from "@/constants/fortbildung";
import { baueUrl, leseFilter, type SuchParameter } from "@/lib/filter";
import { adminBereichUrl, adminSchuljahr } from "@/lib/adminNavigation";
import { parseSchuljahr, schuljahrWhere } from "@/lib/schuljahr";
import { formatDatum } from "@/lib/datetime";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Arbeitsübersicht" };
export const dynamic = "force-dynamic";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<SuchParameter>;
}) {
  const user = await requireRole(...ERFASSER);
  if (user.role === "RVS" && await istEinrichtungOffen()) redirect("/admin/einrichtung");
  const istAdmin = darfFreigeben(user.role);
  const darfNachbereiten = istAdmin || user.role === "REFERENT";
  const params = await searchParams;
  const bereich = Array.isArray(params.bereich) ? params.bereich[0] : params.bereich;
  const lokaleFilter = ["q", "von", "bis", "organisationsform", "format", "schulart", "niveaustufe", "kb", "schlagwort", "status", "fibs"];
  if (lokaleFilter.some((name) => {
    const wert = params[name];
    return Array.isArray(wert) ? Boolean(wert[0]) : Boolean(wert);
  })) redirect(baueUrl("/admin/fortbildungen", params, { bereich: undefined }));
  if (bereich === "freigaben" && istAdmin) redirect(baueUrl("/admin/freigaben", params, { bereich: undefined }));
  if (bereich === "nachbereitung" && darfNachbereiten) redirect(baueUrl("/admin/nachbereitung", params, { bereich: undefined }));

  const jetzt = new Date();
  const filter = leseFilter(params);
  const schuljahrRoh = Array.isArray(params.schuljahr) ? params.schuljahr[0] : params.schuljahr;
  const schuljahr = adminSchuljahr(schuljahrRoh);
  const schuljahrFilter = schuljahr === "alle" ? {} : schuljahrWhere(parseSchuljahr(schuljahr)!);
  const scope = fortbildungScope(user);
  const kontextFilter = filter.bezirk ? { bezirkId: filter.bezirk } : {};
  const basis = { AND: [scope, kontextFilter, schuljahrFilter] };
  const nachbereitungBereich = istAdmin ? scope : { AND: [scope, { organisationsform: "SCHILF" }] };

  const [freigaben, fibs, nachbereitungen, naechsterTermin] = await Promise.all([
    istAdmin ? prisma.fortbildung.count({ where: { AND: [basis, { status: "EINGEREICHT" }] } }) : Promise.resolve(0),
    istAdmin ? prisma.fortbildung.count({
      where: { AND: [basis, { status: "VEROEFFENTLICHT" }, { organisationsform: { not: "SCHILF" } }, { inFibs: false }, { ende: { gte: jetzt } }] },
    }) : Promise.resolve(0),
    darfNachbereiten
      ? prisma.fortbildung.count({
          where: {
            AND: [
              nachbereitungBereich,
              kontextFilter,
              schuljahrFilter,
              { ende: { lt: jetzt } },
              { status: { in: ["VEROEFFENTLICHT", "ARCHIVIERT"] } },
              istAdmin
                ? { OR: [{ tnTatsaechlich: null }, { organisationsform: "SCHILF", inFibs: false }, { teilnahmebestaetigungenReferentenVersandtAm: null }, { teilnahmebestaetigungenTeilnehmendeVersandtAm: null }] }
                : { tnTatsaechlich: null },
            ],
          },
        })
      : Promise.resolve(0),
    prisma.fortbildung.findFirst({
      where: { AND: [basis, { beginn: { gte: jetzt } }, { status: "VEROEFFENTLICHT" }] },
      orderBy: { beginn: "asc" },
      select: { id: true, titel: true, beginn: true, bezirk: { select: { name: true } } },
    }),
  ]);
  const freigabenUrl = adminBereichUrl("/admin/freigaben", params);
  const fibsUrl = baueUrl("/admin/fortbildungen", params, { ansicht: "fibs", bereich: undefined, status: undefined, fibs: undefined });
  const nachbereitungUrl = adminBereichUrl("/admin/nachbereitung", params);
  const katalogUrl = adminBereichUrl("/admin/katalog", params);

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etikett text-primary">Arbeitsübersicht</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Was steht an?</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Offene Arbeit im gewählten Bereich und Schuljahr.</p>
        </div>
        <Button nativeButton={false} render={<Link href={adminBereichUrl("/admin/fortbildungen/neu", params)}><CalendarPlus className="size-4" aria-hidden />Neue Fortbildung</Link>} />
      </div>

      <section aria-labelledby="aufgaben" className="overflow-hidden rounded-xl border bg-card">
        <h2 id="aufgaben" className="sr-only">Offene Aufgaben</h2>
        {istAdmin ? <Arbeitszeile icon={ShieldCheck} anzahl={freigaben} titel="Freigaben prüfen" text="Eingereichte Ausschreibungen bearbeiten" href={freigabenUrl} /> : null}
        {istAdmin ? <Arbeitszeile icon={Globe2} anzahl={fibs} titel="In FIBS ausschreiben" text="Offene RLFB- und ALP-Ausschreibungen" href={fibsUrl} /> : null}
        {darfNachbereiten ? <Arbeitszeile icon={ClipboardCheck} anzahl={nachbereitungen} titel={istAdmin ? "Fortbildungen nachbereiten" : "SchiLf-Zahlen nachtragen"} text={istAdmin ? "Teilnehmerzahlen, Bestätigungen und SchiLf-Nachträge" : "Vergangene eigene oder zugeordnete SchiLf"} href={nachbereitungUrl} letzte /> : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5">
          <p className="etikett text-primary">Jahreskatalog</p>
          <h2 className="mt-1 font-semibold">Katalog vorbereiten</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gewählter Bezirk und Schuljahr werden übernommen.</p>
          <Button className="mt-4" nativeButton={false} variant="outline" render={<Link href={katalogUrl}><FileSpreadsheet className="size-4" aria-hidden />Jahreskatalog öffnen</Link>} />
        </section>
        <section className="rounded-xl border bg-card p-5">
          <p className="etikett text-primary">Nächster Termin</p>
          {naechsterTermin ? (
            <Link href={`/admin/fortbildungen/${naechsterTermin.id}?zurueck=${encodeURIComponent(adminBereichUrl("/admin", params))}`} className="mt-2 block rounded-md outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring">
              <p className="font-semibold">{naechsterTermin.titel}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="size-4" aria-hidden />{formatDatum(naechsterTermin.beginn)} · {naechsterTermin.bezirk.name}</p>
            </Link>
          ) : <p className="mt-2 text-sm text-muted-foreground">Im gewählten Bereich steht kein weiterer veröffentlichter Termin an.</p>}
        </section>
      </div>
    </div>
  );
}

function Arbeitszeile({
  icon: Icon,
  anzahl,
  titel,
  text,
  href,
  letzte = false,
}: {
  icon: typeof ShieldCheck;
  anzahl: number;
  titel: string;
  text: string;
  href: string;
  letzte?: boolean;
}) {
  return (
    <Link href={href} className={`flex items-center gap-3 p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${letzte ? "" : "border-b"}`}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{anzahl}</span>
      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 flex-1"><span className="block font-medium">{titel}</span><span className="block text-sm text-muted-foreground">{text}</span></span>
      <span aria-hidden className="text-muted-foreground">→</span>
    </Link>
  );
}
