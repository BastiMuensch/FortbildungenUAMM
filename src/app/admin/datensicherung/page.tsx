import { CheckCircle2, CircleAlert, Clock3, Download, FolderCheck, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { ladeDatensicherungsUebersicht } from "@/lib/datensicherung";
import { formatDatum, formatDatumZeit } from "@/lib/datetime";
import { DatensicherungsAblageFormular, TagesDatensicherungErstellen } from "@/components/admin/DatensicherungsFormular";

export const metadata = { title: "Datensicherung" };
export const dynamic = "force-dynamic";
type Sicherung = Awaited<ReturnType<typeof ladeDatensicherungsUebersicht>>["pakete"][number];

function dateigroesse(bytes: number): string {
  const megabytes = bytes >= 1024 * 1024;
  return `${(bytes / (megabytes ? 1024 * 1024 : 1024)).toLocaleString("de-DE", { maximumFractionDigits: 1 })} ${megabytes ? "MiB" : "KiB"}`;
}

function Sicherungskarte({ paket, heute = false }: { paket: Sicherung; heute?: boolean }) {
  const verfuegbar = paket.status === "BEREIT" && !paket.geloeschtAm && !paket.abgelaufen;
  const fehlgeschlagen = paket.status === "FEHLER";
  const bestaetigt = Boolean(paket.abgelegtAm);
  const status = fehlgeschlagen ? "Erstellung fehlgeschlagen" : paket.status === "LAEUFT" ? "Wird vorbereitet" : bestaetigt ? "Ablage bestätigt" : "Auf dem Netzlaufwerk ablegen";
  return <article className="rounded-xl border bg-card p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-semibold">{heute ? "Heutige Sicherung" : formatDatum(new Date(`${paket.tag}T12:00:00Z`))}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{paket.status === "BEREIT" ? `Erstellt am ${formatDatumZeit(paket.erstelltAm)}` : paket.status === "LAEUFT" ? "Die verschlüsselte Datei wird erstellt." : "Es steht keine fertige Datei bereit."}{paket.bytes !== null ? ` · ${dateigroesse(paket.bytes)}` : ""}</p>
      </div>
      <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${fehlgeschlagen ? "bg-destructive/10 text-destructive" : bestaetigt ? "bg-primary/10 text-primary" : "bg-muted text-foreground"}`}>
        {fehlgeschlagen ? <CircleAlert aria-hidden className="size-3.5 shrink-0" /> : bestaetigt ? <CheckCircle2 aria-hidden className="size-3.5 shrink-0" /> : <Clock3 aria-hidden className="size-3.5 shrink-0" />}{status}
      </span>
    </div>
    {fehlgeschlagen ? <p className="mt-4 text-sm text-destructive">Bitte das Betriebsteam informieren oder die Erstellung erneut starten. Die Konfiguration und der verfügbare Speicherplatz müssen geprüft werden.</p> : null}
    {paket.status === "BEREIT" && paket.sha256 ? <>
      {!verfuegbar ? <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Die Serverkopie steht nicht mehr zum Download bereit. Eine fehlende Bestätigung kann anhand der vorhandenen Netzlaufwerkkopie nachgetragen werden.</p> : null}
      {verfuegbar ? <a download className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground" href={`/api/admin/datensicherung/download?id=${encodeURIComponent(paket.id)}`}><Download aria-hidden className="size-4 shrink-0" />Verschlüsseltes Vollbackup herunterladen</a> : null}
      <details className="mt-4 rounded-lg border p-3" open={!bestaetigt}>
        <summary className="cursor-pointer text-sm font-medium">Datei und Prüfsumme vergleichen</summary>
        <p className="mt-3 break-all text-xs text-muted-foreground">{paket.dateiname}</p>
        <p className="mt-2 text-xs text-muted-foreground">Erwartete SHA-256-Prüfsumme</p>
        <p className="mt-1 select-all break-all rounded bg-muted p-3 font-mono text-xs leading-relaxed">{paket.sha256}</p>
      </details>
      {paket.abgelegtAm ? <div className="mt-4 flex items-start gap-2 text-sm"><FolderCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /><p className="min-w-0 break-words">Gespeichert: {paket.externeAblage}<span className="mt-1 block text-muted-foreground">Bestätigt am {formatDatumZeit(paket.abgelegtAm)}{paket.abgelegtVonName ? ` durch ${paket.abgelegtVonName}` : ""}.</span></p></div> : <DatensicherungsAblageFormular id={paket.id} />}
    </> : null}
  </article>;
}

export default async function DatensicherungsSeite() {
  await requireRole("RVS");
  const stand = await ladeDatensicherungsUebersicht();
  const heute = stand.pakete.find((paket) => paket.tag === stand.heute);
  const vorherige = stand.pakete.filter((paket) => paket.tag !== stand.heute);
  const offene = vorherige.filter((paket) => paket.status === "BEREIT" && !paket.abgelegtAm && !paket.geloeschtAm && !paket.abgelaufen);
  const verlauf = vorherige.filter((paket) => !offene.includes(paket));
  return <div className="max-w-4xl space-y-7">
    <header>
      <p className="etikett text-primary">Regierung von Schwaben</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Datensicherung</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Alle Bezirke in einer verschlüsselten Datei sichern. Auf dem Regierungslaufwerk ablegen, prüfen und hier bestätigen.</p>
    </header>
    {!stand.konfiguriert ? <div role="alert" className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">Einrichtung durch das Betriebsteam erforderlich</p><p className="mt-1 leading-relaxed">Der öffentliche Verschlüsselungsschlüssel und die geschützte Serverablage müssen eingerichtet werden. Der private Entschlüsselungsschlüssel bleibt getrennt verwahrt.</p></div></div> : null}
    {stand.konfiguriert && !stand.automatikAktiv ? <p role="status" className="rounded-xl border bg-card p-4 text-sm"><strong>Automatische Erstellung ausgeschaltet.</strong> Aktuell lassen sich Sicherungen nur manuell erstellen. Das Betriebsteam kann den täglichen Sicherungsplan aktivieren.</p> : null}
    <section aria-labelledby="ablauf-titel">
      <h2 id="ablauf-titel" className="text-lg font-semibold">In drei Schritten erledigt</h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-3">
        {[ ["Herunterladen", stand.automatikAktiv ? "Die heutige Sicherung wird ab 06:00 Uhr automatisch vorbereitet." : "Die heutige Sicherung bei Bedarf erstellen und herunterladen."], ["Auf dem Netzlaufwerk speichern", "Über den VPN-Laptop ablegen und die Prüfsumme der Kopie prüfen."], ["Ablage bestätigen", "Danach ist der Tageshinweis für alle Regierungskonten erledigt."] ].map(([titel, text], i) => <li key={titel} className="flex items-start gap-3 rounded-xl border bg-card p-4 sm:block"><span aria-hidden className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{i + 1}</span><div className="min-w-0"><h3 className="text-sm font-semibold sm:mt-3">{titel}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p></div></li>)}
      </ol>
    </section>
    <section aria-labelledby="heute-titel" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="heute-titel" className="text-lg font-semibold">Heute · {formatDatum(new Date(`${stand.heute}T12:00:00Z`))}</h2><TagesDatensicherungErstellen key={stand.heute} konfiguriert={stand.konfiguriert} bereit={heute?.status === "BEREIT" && !heute.geloeschtAm} laeuft={heute?.status === "LAEUFT"} /></div>
      {heute ? <Sicherungskarte paket={heute} heute /> : <div className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">Für heute liegt noch kein Vollbackup vor. Nach der Einrichtung erfolgt die Erstellung täglich ab 06:00 Uhr; bei Bedarf können Sie sie hier starten.</div>}
    </section>
    {offene.length ? <section className="space-y-3" aria-labelledby="offen-titel"><h2 id="offen-titel" className="text-lg font-semibold">Noch nicht bestätigte Ablagen <span className="font-normal text-muted-foreground">({offene.length})</span></h2><p className="text-sm text-muted-foreground">Für diese früheren Sicherungen fehlt die Ablagebestätigung. Bereits gespeicherte Kopien können Sie nachträglich bestätigen.</p>{offene.map((paket) => <details key={paket.id} className="rounded-xl border bg-card"><summary className="cursor-pointer px-4 py-3 text-sm font-medium">{formatDatum(new Date(`${paket.tag}T12:00:00Z`))} · Ablage offen</summary><div className="p-3 pt-0"><Sicherungskarte paket={paket} /></div></details>)}</section> : null}
    {verlauf.length ? <details className="rounded-xl border bg-card p-4 sm:p-5"><summary className="cursor-pointer font-semibold">Frühere Sicherungen und Nachweise ({verlauf.length})</summary><p className="mt-2 text-sm text-muted-foreground">Ablagebestätigungen und nicht mehr verfügbare Serverkopien.</p><div className="mt-4 space-y-3">{verlauf.map((paket) => <details key={paket.id} className="rounded-lg border"><summary className="cursor-pointer px-4 py-3 text-sm">{formatDatum(new Date(`${paket.tag}T12:00:00Z`))} · {paket.status === "FEHLER" ? "Erstellung fehlgeschlagen" : paket.abgelegtAm ? "Ablage bestätigt" : paket.status === "LAEUFT" ? "Vorbereitung" : "Serverkopie nicht verfügbar"}</summary><div className="p-3 pt-0"><Sicherungskarte paket={paket} /></div></details>)}</div></details> : null}
    <details className="rounded-xl border bg-card p-4 sm:p-5">
      <summary className="cursor-pointer font-semibold">Ablagehilfe und Informationen für das Betriebsteam</summary>
      <div className="mt-4 space-y-4 text-sm leading-relaxed">
        <p>Die Windows-Ablagehilfe kopiert die Datei auf das freigegebene Netzlaufwerk, prüft die Kopie und kann dort alte, von ihr verwaltete Sicherungen bereinigen. Zielordner und Frist richtet das Betriebsteam einmalig ein. Die tägliche Ausführung erfolgt durch die zuständige Person oder eine eingerichtete Windows-Aufgabe.</p>
        <div className="flex flex-wrap gap-3"><a download className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 font-medium" href="/api/admin/datensicherung/werkzeuge?datei=windows"><Download aria-hidden className="size-4 shrink-0" />Windows-Ablagehilfe</a><a download className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 font-medium" href="/api/admin/datensicherung/werkzeuge?datei=wiederherstellung"><Download aria-hidden className="size-4 shrink-0" />Werkzeug zur Wiederherstellungsprobe</a></div>
        <p className="text-muted-foreground">Serverkopien werden nach {stand.fristTage} Tagen automatisch entfernt. Das Portal hat keinen Zugriff auf das Netzlaufwerk. Dort übernimmt die Ablagehilfe die Bereinigung nach der eingerichteten Frist. Der tägliche Hinweis erscheint im Portal; Zuständigkeit und Vertretung müssen feststehen.</p>
      </div>
    </details>
    <details className="rounded-xl border bg-card p-4 sm:p-5">
      <summary className="cursor-pointer font-semibold">Was ist gesichert und wie bleibt es geschützt?</summary>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p className="flex items-start gap-2"><ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" /><span>Das Vollbackup enthält die gesamte Anwendungsdatenbank mit Konten, Referenten, Veranstaltungen aller Bezirke, Protokollen und Einwilligungsnachweisen sowie Betriebseinstellungen und Anwendungsschlüsseln. Es bleibt beim Download und auf dem Netzlaufwerk verschlüsselt.</span></p>
        <p>Für die Wiederherstellung müssen die passende Anwendungsversion und die Servereinrichtung verfügbar bleiben. Das Vollbackup enthält kein Abbild des Betriebssystems. Der private Entschlüsselungsschlüssel gehört in die getrennte Notfallablage.</p>
        <p>Das Schuljahresarchiv ist davon unabhängig. Eine Ablagebestätigung belegt die Kopie und ihre Prüfsumme. Die Wiederherstellung wird gesondert auf einem geschützten Testsystem erprobt.</p>
      </div>
    </details>
  </div>;
}
