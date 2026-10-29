import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { prisma } from "@/lib/prisma";
import { hatOffeneRechtstextAngaben } from "@/lib/validation/systemtext";

/**
 * Rendert einen redaktionell gepflegten Text aus SystemSetting. Ein mitgelieferter
 * Standardtext ersetzt fehlende Inhalte und die ursprünglichen Seed-Platzhalter.
 *
 * Der Inhalt kommt als Markdown und wird von react-markdown gerendert — ohne
 * `rehype-raw`, HTML im Markdown wird also nicht ausgeführt.
 */
export async function SystemtextSeite({
  id,
  ueberschrift,
  standardtext,
}: {
  id: string;
  ueberschrift: string;
  standardtext?: string;
}) {
  const eintrag = await prisma.systemSetting.findUnique({ where: { id } });
  const gespeichert = eintrag?.value.trim();
  const inhalt = standardtext && (!gespeichert || /Platzhalter\s*[—–-]/i.test(gespeichert))
    ? standardtext
    : gespeichert;

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">{ueberschrift}</h1>

      {inhalt && hatOffeneRechtstextAngaben(inhalt) ? (
        <aside className="mb-6 rounded-lg border border-border bg-muted/50 p-4 text-sm">
          <p className="font-semibold">Entwurf – Angaben werden noch vervollständigt</p>
          <p className="mt-1 text-muted-foreground">
            Die mit [OFFEN: …] gekennzeichneten Betriebsangaben sind noch nicht
            abschließend festgelegt. Dieser Text ist noch keine vollständige Datenschutzerklärung.
          </p>
        </aside>
      ) : null}

      {inhalt ? (
        <div className="beschreibung min-w-0 break-words">
          <Markdown remarkPlugins={[remarkGfm]}>{inhalt}</Markdown>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Für diese Seite ist noch kein Text hinterlegt.
        </p>
      )}
    </article>
  );
}
