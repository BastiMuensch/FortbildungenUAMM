import type { Prisma } from "@prisma/client";

/** Minimaler Sitzungsanteil für die rein deterministischen Bereichsfilter. */
export interface BereichsUser {
  id: string;
  role: string;
  referentId: string | null;
  bezirkIds: string[];
}

/** Bereichsfilter für Fortbildungen. Unbekannte Rollen erhalten keinen Treffer. */
export function fortbildungScope(user: BereichsUser): Prisma.FortbildungWhereInput {
  if (user.role === "RVS") return {};
  if (user.role === "ADMIN" || user.role === "REDAKTEUR") return { bezirkId: { in: user.bezirkIds } };
  if (user.role !== "REFERENT") return { id: { in: [] } };
  return { AND: [
    { bezirkId: { in: user.bezirkIds } },
    { OR: [
      { createdById: user.id },
      ...(user.referentId ? [{ referenten: { some: { referentId: user.referentId } } }] : []),
    ] },
  ] };
}

/** Bereichsfilter für Referenten. Unbekannte Rollen erhalten keinen Treffer. */
export function referentScope(user: BereichsUser): Prisma.ReferentWhereInput {
  if (user.role === "RVS") return {};
  if (!["ADMIN", "REDAKTEUR", "REFERENT"].includes(user.role)) return { id: { in: [] } };
  return { bezirke: { some: { id: { in: user.bezirkIds } } } };
}

/** Bereichsfilter für Bezirke. Unbekannte Rollen erhalten keinen Treffer. */
export function bezirkScope(user: BereichsUser): Prisma.BezirkWhereInput {
  if (user.role === "RVS") return {};
  if (!["ADMIN", "REDAKTEUR", "REFERENT"].includes(user.role)) return { id: { in: [] } };
  return { id: { in: user.bezirkIds } };
}
