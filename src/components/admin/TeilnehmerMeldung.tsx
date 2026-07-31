"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { CheckCircle2, Globe, MapPin, Pencil, Undo2 } from "lucide-react";

import {
  meldeTeilnehmerzahl,
  meldungZuruecknehmen,
} from "@/actions/nachbereitung";
import type { FormularState } from "@/lib/validation/fortbildung";
import { formatDatumZeit, formatZeitraum } from "@/lib/datetime";
import { formatLabel, organisationsformKurz } from "@/constants/fortbildung";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface MeldungsZeile {
  id: string;
  titel: string;
  organisationsform: string;
  format: string;
  beginn: Date;
  ende: Date;
  maxTn: number;
  tnTatsaechlich: number | null;
  tnBemerkung: string | null;
  tnGemeldetAm: Date | null;
  veranstaltungsort: { name: string; istOnline: boolean };
  tnGemeldetVon: { name: string | null; email: string } | null;
}

export function TeilnehmerMeldung({
  fortbildung,
}: {
  fortbildung: MeldungsZeile;
}) {
  const action = meldeTeilnehmerzahl.bind(null, fortbildung.id);
  const [state, formAction] = useActionState<FormularState, FormData>(action, {});

  const gemeldet = fortbildung.tnTatsaechlich !== null;
  const [bearbeiten, setBearbeiten] = useState(false);
  const zeigeFormular = !gemeldet || bearbeiten || state.erfolg === false;

  const fehler = state.fehler ?? {};

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5",
        gemeldet && !bearbeiten && "border-dashed",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline">
              {organisationsformKurz(fortbildung.organisationsform)}
            </Badge>
            <span className="text-muted-foreground">
              {formatLabel(fortbildung.format)}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              {fortbildung.veranstaltungsort.istOnline ? (
                <Globe className="size-3" aria-hidden />
              ) : (
                <MapPin className="size-3" aria-hidden />
              )}
              {fortbildung.veranstaltungsort.name}
            </span>
          </div>

          <h3 className="font-medium">
            <Link
              href={`/admin/fortbildungen/${fortbildung.id}`}
              className="underline-offset-4 hover:underline"
            >
              {fortbildung.titel}
            </Link>
          </h3>

          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
            {formatZeitraum(fortbildung.beginn, fortbildung.ende)} ·{" "}
            {fortbildung.maxTn} Plätze geplant
          </p>
        </div>

        {gemeldet && !bearbeiten ? (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="flex items-center justify-end gap-1.5 text-lg font-semibold tabular-nums">
                <CheckCircle2 className="size-4 text-primary" aria-hidden />
                {fortbildung.tnTatsaechlich}
              </span>
              <span className="text-xs text-muted-foreground">
                Teilnehmende
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Meldung ändern"
              title="Meldung ändern"
              onClick={() => setBearbeiten(true)}
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        ) : null}
      </div>

      {gemeldet && !bearbeiten ? (
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          {fortbildung.tnBemerkung ? `„${fortbildung.tnBemerkung}" · ` : ""}
          gemeldet am{" "}
          {fortbildung.tnGemeldetAm
            ? formatDatumZeit(fortbildung.tnGemeldetAm)
            : "—"}
          {fortbildung.tnGemeldetVon
            ? ` von ${fortbildung.tnGemeldetVon.name ?? fortbildung.tnGemeldetVon.email}`
            : ""}
        </p>
      ) : null}

      {zeigeFormular ? (
        <form action={formAction} className="mt-4 border-t pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`tn-${fortbildung.id}`}>
                Tatsächliche Teilnehmerzahl
              </Label>
              <Input
                id={`tn-${fortbildung.id}`}
                name="tnTatsaechlich"
                type="number"
                min={0}
                max={2000}
                step={1}
                required
                defaultValue={fortbildung.tnTatsaechlich ?? ""}
                className="w-32"
                aria-invalid={Boolean(fehler.tnTatsaechlich)}
              />
            </div>

            <div className="min-w-56 flex-1 space-y-1.5">
              <Label htmlFor={`bem-${fortbildung.id}`}>
                Bemerkung <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id={`bem-${fortbildung.id}`}
                name="tnBemerkung"
                maxLength={300}
                defaultValue={fortbildung.tnBemerkung ?? ""}
                placeholder="z. B. zwei kurzfristige Absagen"
                className="w-full"
              />
            </div>

            <MeldenKnopf gemeldet={gemeldet} />

            {gemeldet ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setBearbeiten(false)}
              >
                Abbrechen
              </Button>
            ) : null}
          </div>

          {fehler.tnTatsaechlich ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {fehler.tnTatsaechlich}
            </p>
          ) : null}
          {fehler._ ? (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {fehler._}
            </p>
          ) : null}
          {state.erfolg ? (
            <p className="mt-2 text-sm text-primary">{state.meldung}</p>
          ) : null}
        </form>
      ) : null}

      {gemeldet && bearbeiten ? (
        <form
          action={meldungZuruecknehmen.bind(null, fortbildung.id)}
          className="mt-3"
        >
          <Button type="submit" variant="ghost" size="sm">
            <Undo2 className="size-3.5" aria-hidden />
            Meldung ganz zurücknehmen
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function MeldenKnopf({ gemeldet }: { gemeldet: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Wird gespeichert …" : gemeldet ? "Ändern" : "Melden"}
    </Button>
  );
}
