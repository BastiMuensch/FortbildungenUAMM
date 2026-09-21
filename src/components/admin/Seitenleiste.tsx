"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CalendarRange,
  Download,
  ExternalLink,
  FileText,
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
}

const GRUPPEN: Array<{ titel: string; eintraege: Eintrag[] }> = [
  {
    titel: "Arbeit",
    eintraege: [
      { href: "/admin", label: "Fortbildungen", icon: CalendarDays, rollen: ALLE },
      { href: "/admin/kalender", label: "Planungskalender", icon: CalendarRange, rollen: ALLE },
      { href: "/admin/katalog", label: "Fortbildungskatalog", icon: BookOpen, rollen: ALLE },
      { href: "/admin/auswertung", label: "Auswertung", icon: BarChart3, rollen: ALLE },
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

export function Seitenleiste({ name, rolle }: { name: string; rolle: Rolle }) {
  const [offen, setOffen] = useState(false);
  const [mobil, setMobil] = useState(false);
  const ausloeserRef = useRef<HTMLButtonElement>(null);
  const schliessenRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);

  const schliesseNavigation = useCallback(() => {
    setOffen(false);
    window.requestAnimationFrame(() => ausloeserRef.current?.focus());
  }, []);

  useEffect(() => {
    const abfrage = window.matchMedia("(max-width: 1023px)");
    const aktualisieren = () => {
      setMobil(abfrage.matches);
      if (!abfrage.matches) setOffen(false);
    };
    aktualisieren();
    abfrage.addEventListener("change", aktualisieren);
    return () => abfrage.removeEventListener("change", aktualisieren);
  }, []);

  useEffect(() => {
    if (!mobil || !offen) return;

    const beiTaste = (ereignis: KeyboardEvent) => {
      if (ereignis.key === "Escape") {
        ereignis.preventDefault();
        schliesseNavigation();
        return;
      }

      if (ereignis.key !== "Tab") return;
      const fokusierbare = Array.from(
        navigationRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((element) => element.tabIndex >= 0 && !element.hasAttribute("inert"));
      const erstes = fokusierbare[0];
      const letztes = fokusierbare.at(-1);

      if (!erstes || !letztes) return;
      if (ereignis.shiftKey && document.activeElement === erstes) {
        ereignis.preventDefault();
        letztes.focus();
      } else if (!ereignis.shiftKey && document.activeElement === letztes) {
        ereignis.preventDefault();
        erstes.focus();
      }
    };

    document.addEventListener("keydown", beiTaste);
    window.requestAnimationFrame(() => schliessenRef.current?.focus());
    return () => document.removeEventListener("keydown", beiTaste);
  }, [mobil, offen, schliesseNavigation]);

  return (
    <>
      <a
        href="#hauptinhalt"
        className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only"
      >
        Zum Inhalt springen
      </a>

      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          ref={ausloeserRef}
          type="button"
          onClick={() => setOffen(true)}
          aria-label="Navigation öffnen"
          aria-controls="admin-navigation"
          aria-expanded={offen}
          className="flex size-9 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"
        >
          <Menu className="size-4" aria-hidden />
        </button>
        <Wortmarke />
      </div>

      {offen ? (
        <button
          type="button"
          aria-label="Navigation schließen"
          onClick={schliesseNavigation}
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <nav
        id="admin-navigation"
        ref={navigationRef}
        aria-label="Bereiche"
        aria-hidden={mobil && !offen ? true : undefined}
        inert={mobil && !offen ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-border bg-sidebar shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          offen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Wortmarke onNavigate={() => setOffen(false)} />
          <button
            ref={schliessenRef}
            type="button"
            onClick={schliesseNavigation}
            aria-label="Navigation schließen"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 lg:hidden"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {GRUPPEN.map((gruppe) => {
            const sichtbar = gruppe.eintraege.filter((eintrag) => eintrag.rollen.includes(rolle));
            if (sichtbar.length === 0) return null;

            return (
              <section key={gruppe.titel} aria-label={gruppe.titel}>
                <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">{gruppe.titel}</p>
                <ul className="space-y-1">
                  {sichtbar.map((eintrag) => (
                    <li key={eintrag.href}>
                      <Punkt eintrag={eintrag} onNavigate={() => setOffen(false)} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="space-y-1 border-t border-border p-3">
          <Link href="/" onClick={() => setOffen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ExternalLink className="size-4 shrink-0" aria-hidden />
            Frontend ansehen
          </Link>

          <Link href="/admin/konto" onClick={() => setOffen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors hover:bg-muted">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initialen(name)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium">{name}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{rolleLabel(rolle)}</span>
            </span>
          </Link>

          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <LogOut className="size-4 shrink-0" aria-hidden />
              Abmelden
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

function Punkt({ eintrag, onNavigate }: { eintrag: Eintrag; onNavigate: () => void }) {
  const pfad = usePathname();
  const aktiv = eintrag.href === "/admin" ? pfad === "/admin" || pfad.startsWith("/admin/fortbildungen") : pfad.startsWith(eintrag.href);
  const Icon = eintrag.icon;

  return (
    <Link
      href={eintrag.href}
      onClick={onNavigate}
      aria-current={aktiv ? "page" : undefined}
      className={cn(
        "zeile relative flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
        aktiv
          ? "bg-accent font-medium text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{eintrag.label}</span>
    </Link>
  );
}

function Wortmarke({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary shadow-sm">
        <span className="size-2.5 rotate-45 border border-primary-foreground/90" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-[-0.01em] text-primary">Fortbildungen</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">Schulamt UAMM</span>
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
