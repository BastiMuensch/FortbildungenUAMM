import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDatumZeit } from "@/lib/datetime";
import { UnterschriftsFormular } from "@/components/admin/UnterschriftsFormular";

export const metadata = { title: "Unterschriften" };
export const dynamic = "force-dynamic";

export default async function UnterschriftenSeite() {
  const person = await requireRole("RVS", "ADMIN");
  const bdbs = await prisma.user.findMany({
    where: { role: "ADMIN", ...(person.role === "RVS" ? {} : { id: person.id }) },
    select: {
      id: true, name: true, isActive: true,
      bezirke: { select: { name: true }, orderBy: { name: "asc" } },
      bdbUnterschrift: { select: { bildPng: true, aktualisiertAm: true } },
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
  });
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <Link href="/admin/verwaltung" className="text-sm text-muted-foreground underline">Zur Verwaltung</Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">Unterschriften</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Hinterlegte BdB-Unterschriften erscheinen auf den Teilnahmebescheinigungen freigegebener und archivierter SchiLf
          in den zugeordneten Schulamtsbezirken. Berechtigte Referierende können diese PDFs ebenfalls herunterladen.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Laden Sie eine eng zugeschnittene Unterschrift als PNG oder JPEG hoch, möglichst mit transparentem oder weißem Hintergrund.
          Ohne hinterlegtes Bild bleibt das Unterschriftsfeld frei. Die PDF enthält eine Bild-Unterschrift ohne digitales Zertifikat.
        </p>
      </header>
      {bdbs.length ? bdbs.map((bdb) => (
        <UnterschriftsFormular
          key={bdb.id}
          userId={bdb.id}
          name={bdb.name ?? "BdB ohne Namen"}
          bezirke={bdb.bezirke.map((bezirk) => bezirk.name).join(", ")}
          aktiv={bdb.isActive}
          bild={bdb.bdbUnterschrift ? `data:image/png;base64,${Buffer.from(bdb.bdbUnterschrift.bildPng).toString("base64")}` : null}
          aktualisiertAm={bdb.bdbUnterschrift ? formatDatumZeit(bdb.bdbUnterschrift.aktualisiertAm) : null}
        />
      )) : <p className="rounded-xl border p-5 text-sm text-muted-foreground">Es sind noch keine BdB-Konten angelegt.</p>}
    </div>
  );
}
