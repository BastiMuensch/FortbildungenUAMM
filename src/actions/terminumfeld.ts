"use server";

import { prisma } from "@/lib/prisma";
import { ERFASSER, requireRole } from "@/lib/auth";
import { organisationsformKurz } from "@/constants/fortbildung";
import { berlinIsoDatum, formatDatum, formatZeit } from "@/lib/datetime";

/**
 * Terminumfeld für die Planung.
 *
 * Bewusst OHNE fortbildungScope: Beim Anlegen muss sichtbar sein, was sonst
 * noch läuft — sonst legen zwei Referenten zwei Fortbildungen auf denselben
 * Termin, und das ist genau der Fehler, der vermieden werden soll.
 *
 * Datenschutz bleibt trotzdem gewahrt: Veröffentlichte Termine stehen ohnehin
 * öffentlich im Frontend. Fremde Entwürfe werden nur als belegter Zeitraum
 * gemeldet, ohne Titel und ohne Verlinkung.
 */

export interface UmfeldTermin {
  id: string;
  /** null bei fremden Entwürfen — dort wird nur „belegt" angezeigt. */
  titel: string | null;
  beginn: string;
  ende: string;
  organisationsform: string;
  ortName: string | null;
  istEigener: boolean;
  status: string;
}

export interface Konflikt {
  schwere: "hart" | "hinweis";
  /** "tag" = selber Kalendertag ohne Zeitüberschneidung. */
  art: "ort" | "referent" | "zeit" | "tag";
  text: string;
}

export interface TerminumfeldErgebnis {
  /** Alle Termine des angefragten Monats. */
  termine: UmfeldTermin[];
  konflikte: Konflikt[];
  /** Wie viele Hinweise aus Platzgründen nicht aufgeführt sind. */
  weitereHinweise: number;
}

export async function ladeTerminumfeld(eingabe: {
  /** ISO-Zeitpunkte; leer, solange noch kein Datum gewählt ist. */
  beginn: string | null;
  ende: string | null;
  ortId: string | null;
  referentIds: string[];
  /** Beim Bearbeiten: die eigene ID, damit man nicht mit sich selbst kollidiert. */
  ausserId: string | null;
}): Promise<TerminumfeldErgebnis> {
  const user = await requireRole(...ERFASSER);

  const beginn = eingabe.beginn ? new Date(eingabe.beginn) : null;
  const ende = eingabe.ende ? new Date(eingabe.ende) : beginn;

  if (!beginn || Number.isNaN(beginn.getTime())) {
    return { termine: [], konflikte: [], weitereHinweise: 0 };
  }

  // Der Kalender zeigt den Monat des Beginns, großzügig gerundet, damit auch
  // die angrenzenden Tage des Rasters gefüllt sind.
  const monatsStart = new Date(
    Date.UTC(beginn.getUTCFullYear(), beginn.getUTCMonth() - 1, 20),
  );
  const monatsEnde = new Date(
    Date.UTC(beginn.getUTCFullYear(), beginn.getUTCMonth() + 1, 10),
  );

  // Abgesagte und archivierte Termine belegen nichts.
  const relevant = {
    status: { notIn: ["ABGESAGT", "ARCHIVIERT"] },
    ...(eingabe.ausserId ? { id: { not: eingabe.ausserId } } : {}),
  };

  const treffer = await prisma.fortbildung.findMany({
    where: {
      AND: [relevant, { beginn: { lte: monatsEnde } }, { ende: { gte: monatsStart } }],
    },
    orderBy: { beginn: "asc" },
    select: {
      id: true,
      titel: true,
      beginn: true,
      ende: true,
      organisationsform: true,
      status: true,
      createdById: true,
      veranstaltungsortId: true,
      veranstaltungsort: { select: { name: true, istOnline: true } },
      referenten: { select: { referentId: true } },
    },
  });

  const eigener = (f: (typeof treffer)[number]) =>
    f.createdById === user.id ||
    (user.referentId !== null &&
      f.referenten.some((r) => r.referentId === user.referentId));

  const termine: UmfeldTermin[] = treffer.map((f) => {
    const mein = eigener(f);
    // Fremde Entwürfe sind noch nicht öffentlich — nur der belegte Zeitraum
    // wird gemeldet, nicht wovon er handelt.
    const verbergen = !mein && f.status === "ENTWURF";

    return {
      id: f.id,
      titel: verbergen ? null : f.titel,
      beginn: f.beginn.toISOString(),
      ende: f.ende.toISOString(),
      organisationsform: f.organisationsform,
      ortName: verbergen ? null : f.veranstaltungsort.name,
      istEigener: mein,
      status: f.status,
    };
  });

  // --- Konflikte ----------------------------------------------------------
  const bis = ende && !Number.isNaN(ende.getTime()) && ende > beginn ? ende : beginn;

  // Ausschlaggebend ist der Kalendertag, nicht nur die Uhrzeit: Zwei
  // Fortbildungen am selben Tag konkurrieren auch dann um dieselben
  // Lehrkräfte, wenn die eine vormittags und die andere nachmittags läuft.
  const eigeneTage = new Set(tageZwischen(beginn, bis));

  const betroffen = treffer
    .map((f) => ({
      f,
      gemeinsameTage: tageZwischen(f.beginn, f.ende).filter((t) =>
        eigeneTage.has(t),
      ),
      zeitueberschneidung: f.beginn < bis && f.ende > beginn,
    }))
    .filter((eintrag) => eintrag.gemeinsameTage.length > 0);

  const konflikte: Konflikt[] = [];

  for (const { f, zeitueberschneidung } of betroffen) {
    const wann = `${formatDatum(f.beginn)}, ${formatZeit(f.beginn)}-${formatZeit(f.ende)}`;
    const wie = organisationsformKurz(f.organisationsform);
    const name =
      !eigener(f) && f.status === "ENTWURF"
        ? "ein Entwurf einer anderen Person"
        : `„${f.titel}“`;

    // Ein Online-Ort lässt sich beliebig oft parallel belegen — nur echte
    // Räume kollidieren.
    const gleicherOrt =
      Boolean(eingabe.ortId) &&
      f.veranstaltungsortId === eingabe.ortId &&
      !f.veranstaltungsort.istOnline;

    const gleicherReferent = f.referenten.some((r) =>
      eingabe.referentIds.includes(r.referentId),
    );

    if (gleicherOrt && zeitueberschneidung) {
      konflikte.push({
        schwere: "hart",
        art: "ort",
        text: `Der Ort ${f.veranstaltungsort.name} ist zu dieser Zeit bereits belegt: ${name} (${wie}, ${wann}).`,
      });
      continue;
    }

    if (gleicherReferent) {
      konflikte.push({
        schwere: "hart",
        art: "referent",
        text: zeitueberschneidung
          ? `Eine der gewählten Referentinnen oder Referenten leitet zeitgleich bereits ${name} (${wie}, ${wann}).`
          : `Eine der gewählten Referentinnen oder Referenten leitet am selben Tag bereits ${name} (${wie}, ${wann}).`,
      });
      continue;
    }

    if (gleicherOrt) {
      konflikte.push({
        schwere: "hinweis",
        art: "ort",
        text: `Am selben Ort findet an diesem Tag bereits ${name} statt (${wie}, ${wann}).`,
      });
      continue;
    }

    konflikte.push({
      schwere: "hinweis",
      art: zeitueberschneidung ? "zeit" : "tag",
      text: zeitueberschneidung
        ? `Zeitgleich läuft ${name} (${wie}, ${wann}) — beide Angebote konkurrieren um dieselben Lehrkräfte.`
        : `Am selben Tag läuft bereits ${name} (${wie}, ${wann}).`,
    });
  }

  // Harte Konflikte zuerst; Zeitüberschneidungen wiegen schwerer als bloße
  // Tagesgleichheit.
  const hart = konflikte.filter((k) => k.schwere === "hart");
  const hinweise = konflikte
    .filter((k) => k.schwere === "hinweis")
    .sort((a, b) => rang(a.art) - rang(b.art));

  // Eine Liste mit zwanzig Zeilen liest niemand mehr — der Rest wird gezählt.
  const gezeigt = hinweise.slice(0, 4);

  return {
    termine,
    konflikte: [...hart, ...gezeigt],
    weitereHinweise: hinweise.length - gezeigt.length,
  };
}

function rang(art: Konflikt["art"]): number {
  return art === "zeit" ? 0 : art === "ort" ? 1 : 2;
}

/** Alle Kalendertage (Berliner Zeit), die ein Zeitraum berührt. */
function tageZwischen(von: Date, bis: Date): string[] {
  const start = berlinIsoDatum(von);
  const schluss = berlinIsoDatum(bis);
  if (start === schluss) return [start];

  const tage: string[] = [];
  let aktuell = new Date(`${start}T12:00:00Z`);
  const grenze = new Date(`${schluss}T12:00:00Z`);

  for (let i = 0; aktuell <= grenze && i < 60; i += 1) {
    tage.push(aktuell.toISOString().slice(0, 10));
    aktuell = new Date(aktuell.getTime() + 24 * 60 * 60 * 1000);
  }

  return tage;
}
