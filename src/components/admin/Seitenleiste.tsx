"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  LogOut,
  MapPin,
  Menu,
  Tags,
  Users,
  X,
} from "lucide-react";

import { logout } from "@/actions/auth";
import { rolleLabel, type Rolle } from "@/constants/fortbildung";
import { cn } from "@/lib/utils";

const ALLE: Rolle[] = ["ADMIN", "REDAKTEUR", "REFERENT"];
const REDAKTION: Rolle[] = ["ADMIN", "REDAKTEUR"];
const NUR_ADMIN: Rolle[] = ["ADMIN"];

interface Eintrag {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  rollen: Rolle[];
  /** Zahl neben dem Eintrag, etwa offene Meldungen. */
  zaehler?: "offeneMeldungen";
}

/**
 * Die Bereiche sind nach Arbeitsweise gruppiert, nicht alphabetisch:
 * Was täglich gebraucht wird, steht oben; Stammdaten werden gelegentlich
 * gepflegt; Systemthemen selten.
 */
const GRUPPEN: Array<{ titel: string; eintraege: Eintrag[] }> = [
  {
    titel: "Arbeit",
    eintraege: [
      { href: "/admin", label: "Fortbildungen", icon: CalendarDays, rollen: ALLE },
      {
        href: "/admin/nachbereitung",
        label: "Nachbereitung",
        icon: ClipboardCheck,
        rollen: ALLE,
        zaehler: "offeneMeldungen",
      },
    ],
  },
  {
    titel: "Stammdaten",
    eintraege: [
      { href: "/admin/referenten", label: "Referenten", icon: Users, rollen: REDAKTION },
      { href: "/admin/schlagworte", label: "Schlagworte", icon: Tags, rollen: REDAKTION },
      { href: "/admin/orte", label: "Orte", icon: MapPin, rollen: REDAKTION },
    ],
  },
  {
    titel: "System",
    eintraege: [
      { href: "/admin/import", label: "FIBS-Import", icon: Download, rollen: REDAKTION },
      { href: "/admin/texte", label: "Rechtstexte", icon: FileText, rollen: NUR_ADMIN },
    ],
  },
];

export function Seitenleiste({
  name,
  rolle,
  offeneMeldungen,
}: {
  name: string;
  rolle: Rolle;
  offeneMeldungen: number;
}) {
  const [offen, setOffen] = useState(false);

  return (
    <>
      {/* Kopfzeile nur auf schmalen Bildschirmen */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOffen(true)}
          aria-label="Navigation öffnen"
          className="flex size-9 items-center justify-center rounded-lg border transition-colors hover:bg-accent"
        >
          <Menu className="size-4" aria-hidden />
        </button>
        <Wortmarke />
      </div>

      {/* Abdunkelung hinter der ausgeklappten Leiste */}
      {offen ? (
        <button
          type="button"
          aria-label="Navigation schließen"
          onClick={() => setOffen(false)}
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
        />
      ) : null}

      <nav
        aria-label="Bereiche"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r bg-card transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          offen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <Wortmarke />
          <button
            type="button"
            onClick={() => setOffen(false)}
            aria-label="Navigation schließen"
            className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-accent lg:hidden"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-3">
          {GRUPPEN.map((gruppe) => {
            const sichtbar = gruppe.eintraege.filter((e) => e.rollen.includes(rolle));
            if (sichtbar.length === 0) return null;

            return (
              <div key={gruppe.titel}>
                <p className="mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {gruppe.titel}
                </p>
                <ul className="space-y-0.5">
                  {sichtbar.map((eintrag) => (
                    <li key={eintrag.href}>
                      <Punkt
                        eintrag={eintrag}
                        offeneMeldungen={offeneMeldungen}
                        onNavigate={() => setOffen(false)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="space-y-1 border-t p-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            Frontend ansehen
          </Link>

          <Link
            href="/admin/konto"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {initialen(name)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm">{name}</span>
              <span className="block text-xs text-muted-foreground">
                {rolleLabel(rolle)}
              </span>
            </span>
          </Link>

          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4 shrink-0" aria-hidden />
              Abmelden
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

function Punkt({
  eintrag,
  offeneMeldungen,
  onNavigate,
}: {
  eintrag: Eintrag;
  offeneMeldungen: number;
  onNavigate: () => void;
}) {
  const pfad = usePathname();

  // "/admin" ist die Übersicht und darf nicht bei jedem Unterpfad aktiv sein.
  const aktiv =
    eintrag.href === "/admin"
      ? pfad === "/admin" || pfad.startsWith("/admin/fortbildungen")
      : pfad.startsWith(eintrag.href);

  const zahl = eintrag.zaehler === "offeneMeldungen" ? offeneMeldungen : 0;
  const Icon = eintrag.icon;

  return (
    <Link
      href={eintrag.href}
      onClick={onNavigate}
      aria-current={aktiv ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
        aktiv
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{eintrag.label}</span>
      {zahl > 0 ? (
        <span
          title={`${zahl} offene Meldungen`}
          className="flex min-w-5 items-center justify-center rounded-full bg-ferien px-1.5 text-xs font-medium text-white tabular-nums"
        >
          {zahl}
        </span>
      ) : null}
    </Link>
  );
}

function Wortmarke() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <GraduationCap className="size-4" aria-hidden />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-tight">
          Fortbildungen
        </span>
        <span className="block text-xs text-muted-foreground">
          Schulamt UAMM
        </span>
      </span>
    </Link>
  );
}

function initialen(name: string): string {
  const teile = name.trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return "?";
  if (teile.length === 1) return teile[0]!.slice(0, 2).toUpperCase();
  return (teile[0]![0]! + teile[teile.length - 1]![0]!).toUpperCase();
}
