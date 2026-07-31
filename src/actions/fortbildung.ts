"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/auth";
import { auditLog } from "@/lib/audit";
import { sanitizeBeschreibung, htmlZuText } from "@/lib/sanitize";
import { bildeSlug } from "@/lib/queries";
import { PFLICHT_SCHLAGWORTE, type FortbildungStatus } from "@/constants/fortbildung";
import {
  FortbildungSchema,
  formDataZuEingabe,
  zuFeldFehlern,
  type FormularState,
} from "@/lib/validation/fortbildung";

/**
 * Anlegen und Ändern einer Fortbildung.
 *
 * `id` wird über `.bind()` vorgegeben (siehe FortbildungForm) — leer bedeutet
 * "neu anlegen".
 */
export async function saveFortbildung(
  id: string | null,
  _bisher: FormularState,
  formData: FormData,
): Promise<FormularState> {
  let user;
  try {
    user = await requireRole("ADMIN", "REDAKTEUR");
  } catch (error) {
    if (error instanceof AuthError) return { fehler: { _: error.message } };
    throw error;
  }

  const geparst = FortbildungSchema.safeParse(formDataZuEingabe(formData));
  if (!geparst.success) {
    return { fehler: zuFeldFehlern(geparst.error) };
  }

  const daten = geparst.data;

  // --- Ort prüfen und mit dem Format abgleichen ------------------------------
  const ort = await prisma.veranstaltungsort.findUnique({
    where: { id: daten.veranstaltungsortId },
    select: { id: true, istOnline: true, aktiv: true },
  });

  if (!ort || !ort.aktiv) {
    return { fehler: { veranstaltungsortId: "Dieser Veranstaltungsort existiert nicht mehr." } };
  }

  const formatFehler = pruefeFormatUndOrt(daten.format, ort.istOnline);
  if (formatFehler) return { fehler: formatFehler };

  // --- Kompetenzcodes gegen den Rahmen prüfen -------------------------------
  const gueltigeCodes = await bekannteKompetenzCodes(daten.kompetenzen);
  const unbekannt = daten.kompetenzen.filter((code) => !gueltigeCodes.has(code));
  if (unbekannt.length > 0) {
    return {
      fehler: {
        kompetenzen: `Unbekannte Kompetenz(en): ${unbekannt.join(", ")}. Bitte die Seite neu laden.`,
      },
    };
  }

  const schlagwortIds = await schlagworteAufloesen(daten.schlagworte);
  const referentIds = await pruefeReferenten(daten.referenten);

  const beschreibungHtml = sanitizeBeschreibung(daten.beschreibungHtml);
  const beschreibungText = htmlZuText(beschreibungHtml);

  const basisDaten = {
    titel: daten.titel,
    kurztitel: daten.kurztitel,
    beschreibungHtml,
    beschreibungText,
    organisationsform: daten.organisationsform,
    maxTn: daten.maxTn,
    format: daten.format,
    beginn: daten.beginn,
    ende: daten.ende,
    veranstaltungsortId: daten.veranstaltungsortId,
    schularten: daten.schularten,
    fach: daten.fach,
    niveaustufe: daten.niveaustufe ?? null,
    fibsLehrgangsnummer: daten.fibsLehrgangsnummer,
    fibsUrl: daten.fibsUrl,
    status: daten.status,
  };

  const verknuepfungen = {
    schlagworte: {
      create: schlagwortIds.map((schlagwortId) => ({ schlagwortId })),
    },
    kompetenzen: {
      create: daten.kompetenzen.map((kompetenzCode) => ({ kompetenzCode })),
    },
    referenten: {
      create: referentIds.map((referentId) => ({ referentId })),
    },
  };

  let fortbildungId: string;

  if (id) {
    const bestehend = await prisma.fortbildung.findUnique({
      where: { id },
      select: { id: true, titel: true, beginn: true, slug: true },
    });
    if (!bestehend) return { fehler: { _: "Diese Fortbildung existiert nicht mehr." } };

    // Verknüpfungen komplett ersetzen: Die Auswahl im Formular ist der neue
    // Sollzustand, ein Diff wäre hier nur mehr Code ohne Gewinn.
    await prisma.$transaction([
      prisma.fortbildungSchlagwort.deleteMany({ where: { fortbildungId: id } }),
      prisma.fortbildungKompetenz.deleteMany({ where: { fortbildungId: id } }),
      prisma.fortbildungReferent.deleteMany({ where: { fortbildungId: id } }),
      prisma.fortbildung.update({
        where: { id },
        data: {
          ...basisDaten,
          // Slug nur nachziehen, wenn sich Titel oder Datum geändert haben —
          // sonst würden bereits geteilte Links ins Leere laufen.
          ...(bestehend.titel !== daten.titel ||
          bestehend.beginn.getTime() !== daten.beginn.getTime()
            ? { slug: bildeSlug(daten.titel, daten.beginn, bestehend.id) }
            : {}),
          ...verknuepfungen,
        },
      }),
    ]);

    fortbildungId = id;
    await auditLog({
      userId: user.id,
      aktion: "UPDATE",
      entitaet: "Fortbildung",
      entitaetId: id,
      details: { titel: daten.titel, status: daten.status },
    });
  } else {
    const angelegt = await prisma.fortbildung.create({
      data: {
        ...basisDaten,
        // Platzhalter, weil der Slug die ID braucht, die es erst nach dem
        // Insert gibt. Wird direkt darunter ersetzt.
        slug: `neu-${crypto.randomUUID()}`,
        createdById: user.id,
        quelle: "MANUELL",
        ...verknuepfungen,
      },
      select: { id: true },
    });

    await prisma.fortbildung.update({
      where: { id: angelegt.id },
      data: { slug: bildeSlug(daten.titel, daten.beginn, angelegt.id) },
    });

    fortbildungId = angelegt.id;
    await auditLog({
      userId: user.id,
      aktion: "CREATE",
      entitaet: "Fortbildung",
      entitaetId: fortbildungId,
      details: { titel: daten.titel, status: daten.status },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/fortbildungen");
  revalidatePath("/kalender");

  redirect(`/admin/fortbildungen/${fortbildungId}?gespeichert=1`);
}

// ---------------------------------------------------------------------------
// Weitere Aktionen der Listenansicht
// ---------------------------------------------------------------------------

export async function statusAendern(id: string, status: FortbildungStatus) {
  const user = await requireRole("ADMIN", "REDAKTEUR");

  await prisma.fortbildung.update({ where: { id }, data: { status } });
  await auditLog({
    userId: user.id,
    aktion: "UPDATE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { status },
  });

  revalidatePath("/admin");
  revalidatePath("/fortbildungen");
  revalidatePath("/kalender");
}

/**
 * Kopie anlegen. Wiederkehrende Formate sind der Alltagsfall — ohne diese
 * Funktion tippt das Medienteam denselben Lehrgang jedes Halbjahr neu.
 */
export async function duplizieren(id: string) {
  const user = await requireRole("ADMIN", "REDAKTEUR");

  const quelle = await prisma.fortbildung.findUnique({
    where: { id },
    include: { schlagworte: true, kompetenzen: true, referenten: true },
  });
  if (!quelle) return;

  const kopie = await prisma.fortbildung.create({
    data: {
      titel: `${quelle.titel} (Kopie)`,
      kurztitel: quelle.kurztitel,
      beschreibungHtml: quelle.beschreibungHtml,
      beschreibungText: quelle.beschreibungText,
      organisationsform: quelle.organisationsform,
      maxTn: quelle.maxTn,
      format: quelle.format,
      beginn: quelle.beginn,
      ende: quelle.ende,
      veranstaltungsortId: quelle.veranstaltungsortId,
      schularten: quelle.schularten,
      fach: quelle.fach,
      niveaustufe: quelle.niveaustufe,
      // FIBS-Nummer bewusst NICHT kopieren: Sie gehört zu genau einem Termin.
      status: "ENTWURF",
      quelle: "MANUELL",
      createdById: user.id,
      slug: `kopie-${crypto.randomUUID()}`,
      schlagworte: {
        create: quelle.schlagworte.map((s) => ({ schlagwortId: s.schlagwortId })),
      },
      kompetenzen: {
        create: quelle.kompetenzen.map((k) => ({ kompetenzCode: k.kompetenzCode })),
      },
      referenten: {
        create: quelle.referenten.map((r) => ({
          referentId: r.referentId,
          rolle: r.rolle,
        })),
      },
    },
    select: { id: true },
  });

  await prisma.fortbildung.update({
    where: { id: kopie.id },
    data: { slug: bildeSlug(`${quelle.titel} Kopie`, quelle.beginn, kopie.id) },
  });

  await auditLog({
    userId: user.id,
    aktion: "CREATE",
    entitaet: "Fortbildung",
    entitaetId: kopie.id,
    details: { kopieVon: id },
  });

  redirect(`/admin/fortbildungen/${kopie.id}`);
}

export async function loeschen(id: string) {
  const user = await requireRole("ADMIN");

  const fortbildung = await prisma.fortbildung.findUnique({
    where: { id },
    select: { titel: true },
  });

  await prisma.fortbildung.delete({ where: { id } });
  await auditLog({
    userId: user.id,
    aktion: "DELETE",
    entitaet: "Fortbildung",
    entitaetId: id,
    details: { titel: fortbildung?.titel },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------

/**
 * eSession und Präsenz müssen zum Ort passen. Ohne diese Prüfung landen
 * Online-Termine mit Schuladresse im Kalender — der häufigste Fehler beim
 * Abtippen aus der bisherigen Tabelle.
 */
function pruefeFormatUndOrt(
  format: string,
  ortIstOnline: boolean,
): Record<string, string> | null {
  if (format === "ESESSION" && !ortIstOnline) {
    return {
      veranstaltungsortId:
        'Eine eSession braucht den Veranstaltungsort "Online".',
    };
  }
  if (format === "PRAESENZ" && ortIstOnline) {
    return {
      veranstaltungsortId:
        'Für eine Präsenzveranstaltung bitte einen konkreten Ort statt "Online" wählen.',
    };
  }
  return null;
}

async function bekannteKompetenzCodes(codes: string[]): Promise<Set<string>> {
  if (codes.length === 0) return new Set();

  const treffer = await prisma.digCompKompetenz.findMany({
    where: { code: { in: codes }, aktiv: true },
    select: { code: true },
  });
  return new Set(treffer.map((t) => t.code));
}

/**
 * Schlagwort-Namen zu IDs auflösen und neue Begriffe anlegen.
 *
 * Die Pflicht-Schlagworte werden hier serverseitig ergänzt. Im Formular sind
 * sie zwar als nicht entfernbare Chips gesetzt, aber ein manipulierter Request
 * käme ohne sie an — und genau dann wären die Einträge in der späteren
 * FIBS-Suche nicht mehr auffindbar.
 */
async function schlagworteAufloesen(namen: string[]): Promise<string[]> {
  const eindeutig = new Map<string, string>();

  for (const name of [...PFLICHT_SCHLAGWORTE, ...namen]) {
    const bereinigt = name.trim();
    if (bereinigt) eindeutig.set(bereinigt.toLowerCase(), bereinigt);
  }

  const ids: string[] = [];

  for (const name of eindeutig.values()) {
    const schlagwort = await prisma.schlagwort.upsert({
      where: { name },
      update: {},
      create: {
        name,
        istPflicht: (PFLICHT_SCHLAGWORTE as readonly string[]).includes(name),
      },
      select: { id: true },
    });
    ids.push(schlagwort.id);
  }

  return ids;
}

async function pruefeReferenten(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];

  const vorhanden = await prisma.referent.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });
  return vorhanden.map((r) => r.id);
}
