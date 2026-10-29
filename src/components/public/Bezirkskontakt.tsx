import { Mail, MessageSquare } from "lucide-react";
import { bezirksKontaktLink } from "@/lib/bezirkskontakt";
import type { OeffentlicherBezirk } from "@/lib/oeffentlicherBereich";

export function Bezirkskontakt({ bezirk }: { bezirk: OeffentlicherBezirk }) {
  return <section id="kontakt" aria-labelledby="kontakt-titel" className="scroll-mt-28 rounded-2xl border border-border bg-card px-5 py-7 sm:px-8">
    <p className="text-sm font-medium text-primary">Ihr BdB im Schulamtsbezirk {bezirk.name}</p>
    <h2 id="kontakt-titel" className="mt-2 text-2xl font-semibold tracking-tight">Kontakt & Fortbildungsanfragen</h2>
    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Sie haben eine Frage oder wünschen sich eine Fortbildung für Ihr Kollegium? Wenden Sie sich an Ihren BdB – auch für eine SchiLf an Ihrer Schule.</p>
    {bezirk.kontaktEmail ? <>
      <a href={`mailto:${encodeURIComponent(bezirk.kontaktEmail)}`} className="mt-4 inline-block max-w-full break-all text-sm font-medium text-primary underline underline-offset-4">{bezirk.kontaktEmail}</a>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a href={bezirksKontaktLink(bezirk.kontaktEmail, bezirk.name)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Mail className="size-4 shrink-0" aria-hidden />Kontakt aufnehmen</a>
        <a href={bezirksKontaktLink(bezirk.kontaktEmail, bezirk.name, true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><MessageSquare className="size-4 shrink-0" aria-hidden />Fortbildung anfragen</a>
      </div>
      <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted-foreground">Die Schaltflächen öffnen Ihr E-Mail-Programm. Ergänzen Sie die Nachricht und senden Sie sie dort ab. Falls sich kein E-Mail-Programm öffnet, kopieren Sie die Adresse in Ihren E-Mail-Dienst. Eine Fortbildungsanfrage ist noch keine Anmeldung.</p>
    </> : <p className="mt-4 text-sm text-muted-foreground">Für diesen Bezirk ist noch keine öffentliche Kontaktadresse hinterlegt.</p>}
  </section>;
}
