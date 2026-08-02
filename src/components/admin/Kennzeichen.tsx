import { CheckCircle2, CircleDashed, Clock, FileEdit, Globe2, XCircle } from "lucide-react";

import { statusLabel } from "@/constants/fortbildung";
import { cn } from "@/lib/utils";

/**
 * Die beiden Kennzeichen, an denen im Redaktionsbereich alles hängt:
 * Wo steht die Fortbildung im Freigabeprozess, und ist sie in FIBS?
 *
 * Bewusst als eigene Bausteine, damit sie in Tabelle, Detailseite und
 * Freigabe-Warteschlange identisch aussehen.
 */

const STATUS_STIL: Record<
  string,
  { klasse: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ENTWURF: { klasse: "bg-muted text-muted-foreground", icon: FileEdit },
  EINGEREICHT: { klasse: "bg-ferien-weich text-ferien", icon: Clock },
  VEROEFFENTLICHT: { klasse: "bg-primary/10 text-primary", icon: CheckCircle2 },
  ABGESAGT: { klasse: "bg-destructive/10 text-destructive", icon: XCircle },
  ARCHIVIERT: { klasse: "bg-muted text-muted-foreground", icon: CircleDashed },
};

export function StatusKennzeichen({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const stil = STATUS_STIL[status] ?? STATUS_STIL.ENTWURF!;
  const Icon = stil.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        stil.klasse,
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {statusLabel(status)}
    </span>
  );
}

/**
 * FIBS-Kennzeichen.
 *
 * Zeigt in beide Richtungen an: Ein fehlender Eintrag ist genauso eine
 * Information wie ein vorhandener — und der häufigere Fehler ist der
 * vergessene Eintrag, deshalb ist „nicht in FIBS" die auffälligere Variante.
 */
export function FibsKennzeichen({
  inFibs,
  lehrgangsnummer,
  className,
  ausfuehrlich = false,
}: {
  inFibs: boolean;
  lehrgangsnummer?: string | null;
  className?: string;
  ausfuehrlich?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        inFibs
          ? "bg-primary/10 text-primary"
          : "bg-ferien-weich text-ferien",
        className,
      )}
      title={
        inFibs
          ? lehrgangsnummer
            ? `In FIBS ausgeschrieben, Lehrgangsnummer ${lehrgangsnummer}`
            : "In FIBS ausgeschrieben"
          : "Noch nicht in FIBS ausgeschrieben"
      }
    >
      <Globe2 className="size-3" aria-hidden />
      {inFibs ? "in FIBS" : "nicht in FIBS"}
      {ausfuehrlich && inFibs && lehrgangsnummer ? (
        <span className="font-normal opacity-80">· {lehrgangsnummer}</span>
      ) : null}
    </span>
  );
}
