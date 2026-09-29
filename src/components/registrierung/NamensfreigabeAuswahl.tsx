import Link from "next/link";
import { NAMENSFREIGABE_TEXT, NAMENSFREIGABE_VERSION } from "@/constants/fortbildung";

export function NamensfreigabeAuswahl({
  vorausgewaehlt = false,
  fehler,
}: {
  vorausgewaehlt?: boolean;
  fehler?: string;
}) {
  return (
    <fieldset className="space-y-3 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">Öffentliche Namensanzeige · freiwillig</legend>
      <input type="hidden" name="namensfreigabeVersion" value={NAMENSFREIGABE_VERSION} />
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="namensfreigabe"
          defaultChecked={vorausgewaehlt}
          className="mt-1 size-4 shrink-0 accent-primary"
          aria-describedby="namensfreigabe-erklaerung"
          aria-invalid={Boolean(fehler)}
        />
        <span>Ich möchte mit meinem Vor- und Nachnamen öffentlich bei meinen Fortbildungen erscheinen.</span>
      </label>
      <p id="namensfreigabe-erklaerung" className="text-sm leading-relaxed text-muted-foreground">{NAMENSFREIGABE_TEXT}</p>
      <p className="text-sm text-muted-foreground">
        Ohne Zustimmung erscheinen nur die Organisationskennzeichnungen. Weitere Angaben zum Verantwortlichen und zu Ihren Rechten finden Sie in den <Link href="/datenschutz" target="_blank" rel="noopener noreferrer" className="underline">Datenschutzhinweisen</Link>.
      </p>
      {fehler ? <p role="alert" className="text-sm text-destructive">{fehler}</p> : null}
    </fieldset>
  );
}
