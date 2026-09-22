import "server-only";

import { requireRole } from "@/lib/auth";
import type { BdbEinladung } from "@/lib/bdbEinladungTypes";
import { prisma } from "@/lib/prisma";
import { zugangsLink } from "@/lib/zugang";
import { entschluesseleZugangslinkToken } from "@/lib/zugangslinkSpeicher";

/** Nur die RvS erhält erneut anzeigbare Zugangslinks, keine Token-DB-Datensätze. */
export async function ladeBdbsMitEinladung() {
  await requireRole("RVS");
  const bdbs = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "REDAKTEUR"] } },
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      bezirke: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      zugangstoken: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1,
        select: { tokenVerschluesselt: true, expiresAt: true, createdAt: true, usedAt: true, zweck: true },
      },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
  });
  const jetzt = new Date();
  return bdbs.map(({ zugangstoken, ...bdb }) => {
    const letzter = zugangstoken[0];
    let einladung: BdbEinladung | null = null;
    if (letzter) {
      let status: BdbEinladung["status"] = !bdb.isActive ? "DEAKTIVIERT"
        : letzter.usedAt ? "VERWENDET" : letzter.expiresAt <= jetzt ? "ABGELAUFEN" : "OFFEN";
      const token = status === "OFFEN" && letzter.tokenVerschluesselt
        ? entschluesseleZugangslinkToken(letzter.tokenVerschluesselt, bdb.id) : null;
      if (status === "OFFEN" && !token) status = "NICHT_ANZEIGBAR";
      einladung = {
        status, link: token ? zugangsLink(token) : null,
        gueltigBis: letzter.expiresAt.toISOString(), erstelltAm: letzter.createdAt.toISOString(),
        verwendetAm: letzter.usedAt?.toISOString() ?? null,
        zweck: letzter.zweck === "PASSWORT_RESET" ? "PASSWORT_RESET" : "EINLADUNG",
      };
    }
    return { ...bdb, einladung };
  });
}
