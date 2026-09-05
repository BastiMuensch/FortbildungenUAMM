"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  LogOut,
  MapPin,
  Menu,
  ShieldCheck,
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
  /** Zahl neben dem Eintrag. */
  zaehler?: "offeneMeldungen" | "offeneFreigaben";
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
        href: "/admin/kalender",
        label: "Planungskalender",
        icon: CalendarRange,
        rollen: ALLE,
      },
      {
        href: "/admin/freigaben",
        label: "Freigaben",
        icon: ShieldCheck,
        rollen: REDAKTION,
        zaehler: "offeneFreigaben",
      },
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
  offeneFreigaben,
}: {
  name: string;
  rolle: Rolle;
  offeneMeldungen: number;
  offeneFreigaben: number;
}) {
  const [offen, setOffen] = useState(false);

  return (
    <>
      {/* Kopfzeile nur auf schmalen Bildschirmen */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b-2 border-primary bg-card px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOffen(true)}
          aria-label="Navigation öffnen"
          className="flex size-9 items-center justify-center border transition-colors hover:bg-accent"
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
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r-2 border-primary bg-card transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          offen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b-2 border-foreground px-4 py-4">
          <Wortmarke />
          <button
            type="button"
            onClick={() => setOffen(false)}
            aria-label="Navigation schließen"
            className="flex size-8 items-center justify-center transition-colors hover:bg-accent lg:hidden"
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
                <p className="etikett mb-1.5 px-3 text-muted-foreground">
                  {gruppe.titel}
                </p>
                <ul className="space-y-0.5">
                  {sichtbar.map((eintrag) => (
                    <li key={eintrag.href}>
                      <Punkt
                        eintrag={eintrag}
                        zaehler={{ offeneMeldungen, offeneFreigaben }}
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
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            Frontend ansehen
          </Link>

          <Link
            href="/admin/konto"
            className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-accent"
          >
            <span className="zahl flex size-7 shrink-0 items-center justify-center bg-primary text-xs font-semibold text-primary-foreground">
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
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
  zaehler,
  onNavigate,
}: {
  eintrag: Eintrag;
  zaehler: { offeneMeldungen: number; offeneFreigaben: number };
  onNavigate: () => void;
}) {
  const pfad = usePathname();

  // "/admin" ist die Übersicht und darf nicht bei jedem Unterpfad aktiv sein.
  const aktiv =
    eintrag.href === "/admin"
      ? pfad === "/admin" || pfad.startsWith("/admin/fortbildungen")
      : pfad.startsWith(eintrag.href);

  const zahl = eintrag.zaehler ? zaehler[eintrag.zaehler] : 0;
  const Icon = eintrag.icon;

  return (
    <Link
      href={eintrag.href}
      onClick={onNavigate}
      aria-current={aktiv ? "page" : undefined}
      className={cn(
        "zeile flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm",
        aktiv
          ? "border-l-primary bg-primary/10 font-semibold text-primary"
          : "border-l-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{eintrag.label}</span>
      {zahl > 0 ? (
        <span
          title={`${zahl} offen`}
          className="zahl flex min-w-5 items-center justify-center bg-ferien px-1.5 text-xs font-semibold text-white"
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
      <span aria-hidden className="size-3.5 shrink-0 rotate-45 bg-primary" />
      <span className="leading-tight">
        <span className="etikett block text-[0.8rem] tracking-[0.14em]">
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
