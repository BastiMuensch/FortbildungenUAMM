import "server-only";

import { prisma } from "@/lib/prisma";
import { fortbildungScope, type SessionUser } from "@/lib/auth";
import { leseFilter, type SuchParameter } from "@/lib/filter";
import { adminSchuljahr } from "@/lib/adminNavigation";
import { parseSchuljahr, schuljahrWhere } from "@/lib/schuljahr";

export type FortbildungsAufgaben = {
  alle: number;
  entwuerfe: number;
  freigaben: number;
  fibs: number;
  nachbereitung: number;
};

/**
 * Zählt die Arbeitsvorräte der Fortbildungsnavigation.
 *
 * Ausschließlich Bezirk und Schuljahr aus dem globalen Kontext wirken auf die
 * Zähler. Such- und Fachfilter gehören zur Liste, nicht zur Navigation.
 */
export async function ladeFortbildungsAufgaben(
  user: SessionUser,
  params: SuchParameter,
): Promise<FortbildungsAufgaben> {
  const jetzt = new Date();
  const filter = leseFilter(params);
  const schuljahrRoh = Array.isArray(params.schuljahr) ? params.schuljahr[0] : params.schuljahr;
  const schuljahr = adminSchuljahr(schuljahrRoh);
  const schuljahrFilter = schuljahr === "alle" ? {} : schuljahrWhere(parseSchuljahr(schuljahr)!);
  const bezirkFilter = filter.bezirk ? { bezirkId: filter.bezirk } : {};
  const scope = fortbildungScope(user);
  const basis = { AND: [scope, bezirkFilter, schuljahrFilter] };
  const istAdmin = user.role === "RVS" || user.role === "ADMIN";
  const nachbereitungsScope = istAdmin
    ? scope
    : { AND: [scope, { organisationsform: "SCHILF" }] };

  const [alle, entwuerfe, freigaben, fibs, nachbereitung] = await Promise.all([
    prisma.fortbildung.count({ where: basis }),
    prisma.fortbildung.count({ where: { AND: [basis, { status: "ENTWURF" }] } }),
    istAdmin
      ? prisma.fortbildung.count({ where: { AND: [basis, { status: "EINGEREICHT" }] } })
      : Promise.resolve(0),
    istAdmin
      ? prisma.fortbildung.count({
          where: {
            AND: [
              basis,
              { status: "VEROEFFENTLICHT" },
              { organisationsform: { not: "SCHILF" } },
              { inFibs: false },
              { ende: { gte: jetzt } },
            ],
          },
        })
      : Promise.resolve(0),
    prisma.fortbildung.count({
      where: {
        AND: [
          nachbereitungsScope,
          bezirkFilter,
          schuljahrFilter,
          { ende: { lt: jetzt } },
          { status: { in: ["VEROEFFENTLICHT", "ARCHIVIERT"] } },
          istAdmin
            ? {
                OR: [
                  { tnTatsaechlich: null },
                  { organisationsform: "SCHILF", inFibs: false },
                  { teilnahmebestaetigungenReferentenVersandtAm: null },
                  { teilnahmebestaetigungenTeilnehmendeVersandtAm: null },
                ],
              }
            : { tnTatsaechlich: null },
        ],
      },
    }),
  ]);

  return { alle, entwuerfe, freigaben, fibs, nachbereitung };
}
