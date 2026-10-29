import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { letzterLauf } from "@/lib/retention";
import { formatDatumZeit } from "@/lib/datetime";
import { SystemtextFormular } from "@/components/admin/SystemtextFormular";
import { DATENSCHUTZERKLAERUNG_ENTWURF } from "@/constants/datenschutz";

export const metadata = { title: "Rechtstexte" };
export const dynamic = "force-dynamic";

export default async function TextePage() {
  await requireRole("RVS");

  const [texte, letzteBereinigung] = await Promise.all([
    prisma.systemSetting.findMany({
      where: { id: { in: ["impressum", "datenschutz"] } },
    }),
    letzterLauf(),
  ]);

  const wert = (id: string) => texte.find((t) => t.id === id)?.value ?? "";

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Rechtstexte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Impressum und Datenschutzerklärung, wie sie im öffentlichen Bereich
          erscheinen. Markdown ist erlaubt (## Überschrift, **fett**, Listen mit -).
        </p>
      </div>

      <SystemtextFormular
        id="impressum"
        ueberschrift="Impressum"
        wert={wert("impressum")}
      />

      <SystemtextFormular
        id="datenschutz"
        ueberschrift="Datenschutzerklärung"
        wert={wert("datenschutz")}
        vorlage={DATENSCHUTZERKLAERUNG_ENTWURF}
      />

      <section className="border bg-muted/30 p-5">
        <h2 className="text-sm font-semibold">Löschlauf</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Fortbildungs- und Auswertungsdaten werden nach 400 vollständigen
          Kalendertagen nach Schuljahresende für den regulären Zugriff gesperrt.
          Die Löschung setzt eine bestätigte externe Archivübernahme voraus.
          Anwendungs- und FIBS-Importprotokolle werden nach 365 Tagen gelöscht.
          Für Konten, Nachweise, Serverprotokolle und Sicherungen gelten gesonderte Regeln.
        </p>
        <p className="mt-2 text-sm">
          Zuletzt gelaufen:{" "}
          <span className="zahl">
            {letzteBereinigung ? formatDatumZeit(letzteBereinigung) : "noch nie"}
          </span>
        </p>
      </section>
    </div>
  );
}
