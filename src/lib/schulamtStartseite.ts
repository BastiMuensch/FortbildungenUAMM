import "server-only";

import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { istGueltigesSchulamtKuerzel } from "@/lib/schulamtKuerzel";

/**
 * Löst eine öffentliche Schulamtsadresse auf. Inaktive und unbekannte
 * Schulämter verhalten sich bewusst wie nicht vorhandene Seiten.
 */
export async function ladeOeffentlichenBezirk(kuerzel: string): Promise<{
  id: string;
  name: string;
  kuerzel: string;
}> {
  if (!istGueltigesSchulamtKuerzel(kuerzel)) notFound();

  const bezirk = await prisma.bezirk.findFirst({
    where: { kuerzel, aktiv: true },
    select: { id: true, name: true, kuerzel: true },
  });

  if (!bezirk) notFound();
  return bezirk;
}
