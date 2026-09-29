import { berlinIsoDatum } from "@/lib/datetime";

type Paketstand = {
  tag: string;
  status: string;
  abgelegtAm: Date | null;
  geloeschtAm: Date | null;
};

export type Sicherungshinweis = {
  art: "offen" | "fehler" | "erledigt";
  text: string;
};

/** Ein Download allein oder eine Bestätigung für gestern erledigt heute nicht. */
export function datensicherungsHinweis(
  konfiguriert: boolean,
  pakete: Paketstand[],
  jetzt = new Date(),
): Sicherungshinweis {
  if (!konfiguriert) return { art: "fehler", text: "Die tägliche Datensicherung ist noch nicht eingerichtet. Bitte Verschlüsselung und Sicherungsablage einrichten." };
  const heute = berlinIsoDatum(jetzt);
  const aktuell = pakete.find((paket) => paket.tag === heute);
  if (aktuell?.status === "BEREIT" && aktuell.abgelegtAm) {
    return { art: "erledigt", text: "Die Ablage des heutigen Vollbackups auf dem Regierungslaufwerk ist bestätigt." };
  }
  if (aktuell?.status === "FEHLER") {
    return { art: "fehler", text: "Das heutige Vollbackup konnte nicht erstellt werden. Bitte die Sicherung prüfen und erneut starten." };
  }
  if (aktuell?.status === "LAEUFT") {
    return { art: "offen", text: "Das heutige Vollbackup wird vorbereitet. Anschließend herunterladen, auf dem Regierungslaufwerk speichern und die Ablage bestätigen." };
  }
  const verpasst = pakete.some((paket) => paket.tag < heute && paket.status === "BEREIT" && !paket.abgelegtAm);
  return {
    art: "offen",
    text: `${aktuell?.status === "BEREIT" && !aktuell.geloeschtAm ? "Das heutige verschlüsselte Vollbackup steht bereit." : "Für heute ist noch keine Sicherung auf dem Regierungslaufwerk bestätigt."} Bitte herunterladen, über den Regierungslaptop ablegen und die Ablage bestätigen.${verpasst ? " Auch für frühere Tage fehlen Ablagebestätigungen." : ""}`,
  };
}
