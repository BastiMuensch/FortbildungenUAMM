"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";

import { entferneReferent, speichereReferent } from "@/actions/stammdaten";
import {
  neuerZugangslink,
  richteZugangEin,
  zugangEntziehen,
  type EinladungState,
} from "@/actions/zugang";
import { formatDatumZeit } from "@/lib/datetime";
import type { FormularState } from "@/lib/validation/fortbildung";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ReferentZeile {
  id: string;
  vorname: string;
  nachname: string;
  organisation: string | null;
  email: string | null;
  telefon: string | null;
  notiz: string | null;
  oeffentlichSichtbar: boolean;
  aktiv: boolean;
  userId: string | null;
  zugang: {
    userId: string;
    aktiv: boolean;
    passwortGesetzt: boolean;
    lastLoginAt: Date | null;
  } | null;
  _count: { fortbildungen: number };
}

export function ReferentenVerwaltung({
  referenten,
  darfLoeschen,
  darfZugangVerwalten,
}: {
  referenten: ReferentZeile[];
  darfLoeschen: boolean;
  darfZugangVerwalten: boolean;
}) {
  const [bearbeitet, setBearbeitet] = useState<ReferentZeile | null>(null);
  const [zugangFuer, setZugangFuer] = useState<ReferentZeile | null>(null);
  const [neuOffen, setNeuOffen] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setNeuOffen(true)}>
        <UserPlus className="size-4" aria-hidden />
        Neue Person anlegen
      </Button>

      {referenten.length === 0 ? (
        <p className="border border-dashed py-16 text-center text-sm text-muted-foreground">
          Noch niemand angelegt.
        </p>
      ) : (
        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Name</TableHead>
                <TableHead className="min-w-40">Organisation</TableHead>
                <TableHead className="min-w-48">Kontakt (intern)</TableHead>
                <TableHead>Im Frontend</TableHead>
                <TableHead>Zugang</TableHead>
                <TableHead className="text-right">Termine</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {referenten.map((r) => (
                <TableRow key={r.id} className={r.aktiv ? undefined : "opacity-50"}>
                  <TableCell className="font-medium">
                    {r.nachname}, {r.vorname}
                    {!r.aktiv ? (
                      <Badge variant="outline" className="ml-2">
                        stillgelegt
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.organisation ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.email ?? "—"}
                    {r.telefon ? (
                      <span className="block">{r.telefon}</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {r.oeffentlichSichtbar ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <Eye className="size-3.5 text-muted-foreground" aria-hidden />
                        sichtbar
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <EyeOff className="size-3.5" aria-hidden />
                        verborgen
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ZugangsStand zugang={r.zugang} />
                  </TableCell>

                  <TableCell className="text-right zahl">
                    {r._count.fortbildungen}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {darfZugangVerwalten ? (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Registrierungslink für ${r.vorname} ${r.nachname} verwalten`}
                          title="Registrierungslink verwalten"
                          onClick={() => setZugangFuer(r)}
                        >
                          <KeyRound className="size-3.5" />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`${r.vorname} ${r.nachname} bearbeiten`}
                        onClick={() => setBearbeitet(r)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      {darfLoeschen ? (
                        <form action={entferneReferent.bind(null, r.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon-xs"
                            aria-label={`${r.vorname} ${r.nachname} entfernen`}
                            title={
                              r._count.fortbildungen > 0
                                ? "Wird stillgelegt, weil Termine daran hängen"
                                : "Wird gelöscht"
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* key erzwingt ein frisches Formular pro Person — sonst blieben die
          Werte der zuvor bearbeiteten stehen. */}
      <ReferentDialog
        key={neuOffen ? "neu-offen" : "neu"}
        offen={neuOffen}
        onOpenChange={setNeuOffen}
        referent={null}
      />
      <ReferentDialog
        key={bearbeitet?.id ?? "bearbeiten"}
        offen={bearbeitet !== null}
        onOpenChange={(offen) => !offen && setBearbeitet(null)}
        referent={bearbeitet}
      />
      <ZugangDialog
        key={`zugang-${zugangFuer?.id ?? "leer"}`}
        offen={zugangFuer !== null}
        onOpenChange={(offen) => !offen && setZugangFuer(null)}
        referent={zugangFuer}
      />
    </div>
  );
}

function ZugangsStand({ zugang }: { zugang: ReferentZeile["zugang"] }) {
  if (!zugang) {
    return <span className="text-sm text-muted-foreground">kein Zugang</span>;
  }
  if (!zugang.aktiv) {
    return <span className="text-sm text-muted-foreground">entzogen</span>;
  }
  if (!zugang.passwortGesetzt) {
    return (
      <span className="text-sm text-ferien">Einladung offen</span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-sm">
      <ShieldCheck className="size-3.5 text-primary" aria-hidden />
      aktiv
    </span>
  );
}

/**
 * Zugang einrichten oder zurücksetzen.
 *
 * Der erzeugte Link wird genau einmal angezeigt — danach existiert nur noch
 * sein Hash in der Datenbank. Er muss also sofort kopiert und weitergegeben
 * werden; einen Mailversand gibt es bewusst nicht, siehe src/lib/zugang.ts.
 */
function ZugangDialog({
  offen,
  onOpenChange,
  referent,
}: {
  offen: boolean;
  onOpenChange: (offen: boolean) => void;
  referent: ReferentZeile | null;
}) {
  const einrichten = richteZugangEin.bind(null, referent?.id ?? "");
  const [einrichtenState, einrichtenAction] = useActionState<EinladungState, FormData>(
    einrichten,
    {},
  );

  const erneuern = neuerZugangslink.bind(null, referent?.zugang?.userId ?? "");
  const [erneuernState, erneuernAction] = useActionState<EinladungState, FormData>(
    erneuern,
    {},
  );

  const state = einrichtenState.link ? einrichtenState : erneuernState;
  const hatZugang = Boolean(referent?.zugang);

  return (
    <Dialog open={offen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Zugang für {referent?.vorname} {referent?.nachname}
          </DialogTitle>
          <DialogDescription>
            {referent?.email
              ? `Die Person registriert sich über einen einmaligen Link und meldet sich danach mit ${referent.email} an.`
              : "Für einen Zugang wird zuerst eine E-Mail-Adresse gebraucht — sie ist die Anmeldekennung."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {state.link ? (
            <div className="space-y-2 border border-primary/30 bg-primary/5 p-4">
              <p className="text-sm font-medium">{state.meldung}</p>
              <p className="text-sm text-muted-foreground text-pretty">
                Diesen Link jetzt kopieren und weitergeben — er wird nur einmal
                angezeigt und ist bis zum{" "}
                {state.gueltigBis
                  ? formatDatumZeit(new Date(state.gueltigBis))
                  : "Ablaufdatum"}{" "}
                gültig.
              </p>
              <div className="flex gap-2">
                <Input readOnly value={state.link} className="w-full font-mono text-xs" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard?.writeText(state.link!)}
                >
                  <Copy className="size-3.5" aria-hidden />
                  Kopieren
                </Button>
              </div>
            </div>
          ) : null}

          {state.fehler?._ ? (
            <p role="alert" className="text-sm text-destructive">
              {state.fehler._}
            </p>
          ) : null}

          {hatZugang ? (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground text-pretty">
                {referent?.zugang?.passwortGesetzt
                  ? "Der Zugang ist eingerichtet. Ein neuer Link setzt das Passwort zurück — das bisherige bleibt gültig, bis das neue gesetzt wurde."
                  : "Die Einladung wurde noch nicht angenommen. Ein neuer Link entwertet den bisherigen."}
              </p>

              <div className="flex flex-wrap gap-2">
                <form action={erneuernAction}>
                  <Button type="submit" variant="outline">
                    <KeyRound className="size-3.5" aria-hidden />
                    {referent?.zugang?.passwortGesetzt
                      ? "Passwort zurücksetzen"
                      : "Neuen Einladungslink erzeugen"}
                  </Button>
                </form>

                {referent?.zugang?.aktiv ? (
                  <form action={zugangEntziehen.bind(null, referent.zugang.userId)}>
                    <Button type="submit" variant="destructive">
                      Zugang entziehen
                    </Button>
                  </form>
                ) : null}
              </div>
            </div>
          ) : (
            <form action={einrichtenAction}>
              <Button type="submit" disabled={!referent?.email}>
                <KeyRound className="size-3.5" aria-hidden />
                Registrierungslink erzeugen
              </Button>
            </form>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReferentDialog({
  offen,
  onOpenChange,
  referent,
}: {
  offen: boolean;
  onOpenChange: (offen: boolean) => void;
  referent: ReferentZeile | null;
}) {
  const action = speichereReferent.bind(null, referent?.id ?? null);
  const [state, formAction] = useActionState<FormularState, FormData>(action, {});
  const fehler = state.fehler ?? {};

  return (
    <Dialog open={offen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>
              {referent ? "Person bearbeiten" : "Neue Person anlegen"}
            </DialogTitle>
            <DialogDescription>
              Kontaktdaten bleiben intern. Der Name erscheint nur im Frontend,
              wenn die Sichtbarkeit gesetzt ist.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <FeldEinfach
              name="vorname"
              label="Vorname"
              pflicht
              wert={referent?.vorname}
              fehler={fehler.vorname}
            />
            <FeldEinfach
              name="nachname"
              label="Nachname"
              pflicht
              wert={referent?.nachname}
              fehler={fehler.nachname}
            />
            <FeldEinfach
              name="organisation"
              label="Organisation"
              wert={referent?.organisation ?? ""}
              fehler={fehler.organisation}
              className="sm:col-span-2"
            />
            <FeldEinfach
              name="email"
              label="E-Mail (intern)"
              typ="email"
              wert={referent?.email ?? ""}
              fehler={fehler.email}
            />
            <FeldEinfach
              name="telefon"
              label="Telefon (intern)"
              wert={referent?.telefon ?? ""}
              fehler={fehler.telefon}
            />

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notiz">Interne Notiz</Label>
              <Textarea
                id="notiz"
                name="notiz"
                rows={2}
                defaultValue={referent?.notiz ?? ""}
                className="w-full"
              />
            </div>

            <label className="flex items-start gap-2.5 sm:col-span-2">
              <Checkbox
                name="oeffentlichSichtbar"
                defaultChecked={referent?.oeffentlichSichtbar ?? true}
                className="mt-0.5"
              />
              <span className="text-sm">
                Öffentlich sichtbar
                <span className="block text-xs text-muted-foreground">
                  Name und Organisation erscheinen auf den Detailseiten im
                  Frontend. Setzt das Einverständnis der Person voraus.
                </span>
              </span>
            </label>
          </div>

          {fehler._ ? (
            <p role="alert" className="pb-2 text-sm text-destructive">
              {fehler._}
            </p>
          ) : null}
          {state.erfolg ? (
            <p className="pb-2 text-sm text-primary">{state.meldung}</p>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Schließen
            </Button>
            <SpeichernKnopf />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SpeichernKnopf() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : "Speichern"}
    </Button>
  );
}

function FeldEinfach({
  name,
  label,
  wert,
  fehler,
  pflicht,
  typ = "text",
  className,
}: {
  name: string;
  label: string;
  wert?: string;
  fehler?: string;
  pflicht?: boolean;
  typ?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label htmlFor={name}>
        {label}
        {pflicht ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        type={typ}
        defaultValue={wert}
        required={pflicht}
        className="w-full"
        aria-invalid={Boolean(fehler)}
      />
      {fehler ? (
        <p role="alert" className="text-sm text-destructive">
          {fehler}
        </p>
      ) : null}
    </div>
  );
}
