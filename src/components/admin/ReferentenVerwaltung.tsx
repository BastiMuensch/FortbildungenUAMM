"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Pencil, Trash2, UserPlus } from "lucide-react";

import { entferneReferent, speichereReferent } from "@/actions/stammdaten";
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
  _count: { fortbildungen: number };
}

export function ReferentenVerwaltung({
  referenten,
  darfLoeschen,
}: {
  referenten: ReferentZeile[];
  darfLoeschen: boolean;
}) {
  const [bearbeitet, setBearbeitet] = useState<ReferentZeile | null>(null);
  const [neuOffen, setNeuOffen] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setNeuOffen(true)}>
        <UserPlus className="size-4" aria-hidden />
        Neue Person anlegen
      </Button>

      {referenten.length === 0 ? (
        <p className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          Noch niemand angelegt.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-48">Name</TableHead>
                <TableHead className="min-w-40">Organisation</TableHead>
                <TableHead className="min-w-48">Kontakt (intern)</TableHead>
                <TableHead>Im Frontend</TableHead>
                <TableHead className="text-right">Termine</TableHead>
                <TableHead className="w-20" />
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
                  <TableCell className="text-right tabular-nums">
                    {r._count.fortbildungen}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
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
    </div>
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
