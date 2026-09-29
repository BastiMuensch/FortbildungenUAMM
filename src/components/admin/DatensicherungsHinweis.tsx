"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ladeTagesSicherungshinweis } from "@/actions/datensicherung";
import type { Sicherungshinweis } from "@/lib/datensicherungsHinweis";

/** Bleibt auch über Mitternacht und nach Änderungen anderer RvS-Konten aktuell. */
export function DatensicherungsHinweis() {
  const pfad = usePathname();
  const [hinweis, setHinweis] = useState<Sicherungshinweis | null>(null);
  useEffect(() => {
    if (pfad === "/admin/datensicherung") return;
    let aktiv = true;
    let laeuft = false;
    const aktualisieren = async () => {
      if (laeuft || document.visibilityState === "hidden") return;
      laeuft = true;
      try {
        const neu = await ladeTagesSicherungshinweis();
        if (aktiv) setHinweis(neu);
      } catch {
        if (aktiv) setHinweis({ art: "fehler", text: "Der Sicherungsstand konnte nicht geladen werden. Bitte den Stand unter Datensicherung prüfen." });
      } finally { laeuft = false; }
    };
    void aktualisieren();
    const intervall = window.setInterval(() => void aktualisieren(), 5 * 60 * 1000);
    const beiSichtbarkeit = () => void aktualisieren();
    document.addEventListener("visibilitychange", beiSichtbarkeit);
    window.addEventListener("datensicherung-bestaetigt", beiSichtbarkeit);
    return () => { aktiv = false; window.clearInterval(intervall); document.removeEventListener("visibilitychange", beiSichtbarkeit); window.removeEventListener("datensicherung-bestaetigt", beiSichtbarkeit); };
  }, [pfad]);
  if (pfad === "/admin/datensicherung" || !hinweis || hinweis.art === "erledigt") return null;
  return <aside aria-label="Tägliche Datensicherung" className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
    <p className="font-semibold">Tägliche Datensicherung der Regierung</p>
    <p className="mt-1" role="status">{hinweis.text}</p>
    <Link href="/admin/datensicherung" className="mt-2 inline-block font-medium underline underline-offset-4">Zur Datensicherung</Link>
  </aside>;
}
