"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, CalendarDays, ExternalLink, Files, LayoutDashboard, LogOut, Menu, Settings, Users, X } from "lucide-react";

import { logout } from "@/actions/auth";
import { Marke } from "@/components/Marke";
import { rolleLabel, type Rolle } from "@/constants/fortbildung";
import { adminBereichUrl } from "@/lib/adminNavigation";
import { fortbildungsZusatz } from "@/lib/marke";
import { cn } from "@/lib/utils";

const ALLE: Rolle[] = ["RVS", "ADMIN", "REFERENT"];
const VERWALTUNG: Rolle[] = ["RVS", "ADMIN"];

interface Eintrag {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  rollen: Rolle[];
}

const HAUPTNAVIGATION: Eintrag[] = [
  { href: "/admin", label: "Übersicht", icon: LayoutDashboard, rollen: ALLE },
  { href: "/admin/fortbildungen", label: "Fortbildungen", icon: BookOpen, rollen: ALLE },
  { href: "/admin/kalender", label: "Kalender", icon: CalendarDays, rollen: ALLE },
  { href: "/admin/katalog", label: "Berichte & Katalog", icon: Files, rollen: ALLE },
  { href: "/admin/personen", label: "Personen & Zugänge", icon: Users, rollen: VERWALTUNG },
];

const VERWALTUNGSNAVIGATION: Eintrag = {
  href: "/admin/verwaltung",
  label: "Verwaltung",
  icon: Settings,
  rollen: VERWALTUNG,
};

export function Seitenleiste({
  name,
  rolle,
  schulamtName,
  schulamtsStartseiten: _schulamtsStartseiten,
}: {
  name: string;
  rolle: Rolle;
  schulamtName: string;
  schulamtsStartseiten: Array<{ name: string; kuerzel: string }>;
}) {
  const [offen, setOffen] = useState(false);
  const [mobil, setMobil] = useState(false);
  const ausloeserRef = useRef<HTMLButtonElement>(null);
  const schliessenRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const suchparameter = useSearchParams();
  const navigationsParameter = useMemo(() => {
    const parameter = (name: "bezirk" | "schuljahr") => {
      const werte = suchparameter.getAll(name);
      return werte.length > 1 ? werte : werte[0];
    };
    return { bezirk: parameter("bezirk"), schuljahr: parameter("schuljahr") };
  }, [suchparameter]);
  const startseiteHref = adminBereichUrl("/admin", navigationsParameter);
  const oeffentlicherBereich = _schulamtsStartseiten.length === 1 ? _schulamtsStartseiten[0] : null;

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

    const vorherigerOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
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
    return () => {
      document.removeEventListener("keydown", beiTaste);
      document.body.style.overflow = vorherigerOverflow;
    };
  }, [mobil, offen, schliesseNavigation]);

  return (
    <>
      <a href="#hauptinhalt" className="sr-only fixed left-4 top-4 z-[60] rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only">
        Zum Inhalt springen
      </a>

      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <button ref={ausloeserRef} type="button" onClick={() => setOffen(true)} aria-label="Navigation öffnen" aria-controls="admin-navigation" aria-expanded={offen} className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-card transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
          <Menu className="size-4" aria-hidden />
        </button>
        <Wortmarke href={startseiteHref} zusatz={fortbildungsZusatz(schulamtName)} />
      </div>

      {offen ? <button type="button" aria-label="Navigation schließen" onClick={schliesseNavigation} className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] lg:hidden" /> : null}

      <nav
        id="admin-navigation"
        ref={navigationRef}
        aria-label="Bereiche"
        aria-hidden={mobil && !offen ? true : undefined}
        inert={mobil && !offen ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[calc(100vw-2rem)] shrink-0 flex-col border-r border-border bg-sidebar shadow-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:max-w-none lg:translate-x-0 lg:shadow-none",
          offen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-5">
          <Wortmarke href={startseiteHref} zusatz={fortbildungsZusatz(schulamtName)} onNavigate={() => setOffen(false)} />
          <button ref={schliessenRef} type="button" onClick={schliesseNavigation} aria-label="Navigation schließen" className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 lg:hidden">
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">Arbeitsbereich</p>
          <ul className="space-y-1">
            {HAUPTNAVIGATION.filter((eintrag) => eintrag.rollen.includes(rolle)).map((eintrag) => (
              <li key={eintrag.href}>
                <Punkt eintrag={eintrag} href={adminBereichUrl(eintrag.href, navigationsParameter)} onNavigate={() => setOffen(false)} />
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1 border-t border-border p-3">
          {VERWALTUNGSNAVIGATION.rollen.includes(rolle) ? <Punkt eintrag={VERWALTUNGSNAVIGATION} href={adminBereichUrl(VERWALTUNGSNAVIGATION.href, navigationsParameter)} onNavigate={() => setOffen(false)} /> : null}
          <Link href={oeffentlicherBereich ? `/${oeffentlicherBereich.kuerzel}` : "/"} onClick={() => setOffen(false)} className="flex min-h-11 items-start gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
            <ExternalLink className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0 leading-snug">{oeffentlicherBereich ? `Öffentlich · ${oeffentlicherBereich.name}` : "Öffentlicher Bereich"}</span>
          </Link>
          <Link href="/admin/konto" onClick={() => setOffen(false)} className="flex min-h-11 items-center gap-2.5 rounded-md px-3 py-2.5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{initialen(name)}</span>
            <span className="min-w-0 leading-tight"><span className="block truncate text-sm font-medium">{name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{rolleLabel(rolle)}</span></span>
          </Link>
          <form action={logout}>
            <button type="submit" className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35">
              <LogOut className="size-4 shrink-0" aria-hidden />
              Abmelden
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

function Punkt({ eintrag, href, onNavigate }: { eintrag: Eintrag; href: string; onNavigate: () => void }) {
  const pfad = usePathname();
  const aktiv = istAktiv(eintrag.href, pfad);
  const Icon = eintrag.icon;
  return <Link href={href} onClick={onNavigate} aria-current={aktiv ? "page" : undefined} className={cn("zeile relative flex min-h-11 items-start gap-2.5 rounded-md px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35", aktiv ? "bg-accent font-medium text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="mt-0.5 size-4 shrink-0" aria-hidden /><span className="min-w-0 leading-snug">{eintrag.label}</span></Link>;
}

function istAktiv(href: string, pfad: string): boolean {
  if (href === "/admin") return pfad === "/admin";
  if (href === "/admin/fortbildungen") return pfad.startsWith("/admin/fortbildungen") || pfad === "/admin/freigaben" || pfad === "/admin/nachbereitung";
  if (href === "/admin/katalog") return pfad.startsWith("/admin/katalog") || pfad.startsWith("/admin/auswertung") || pfad.startsWith("/admin/archiv");
  if (href === "/admin/personen") return pfad.startsWith("/admin/personen") || pfad.startsWith("/admin/referenten") || pfad.startsWith("/admin/bezirke");
  return pfad.startsWith(href);
}

function Wortmarke({ href, zusatz, onNavigate }: { href: string; zusatz: string; onNavigate?: () => void }) {
  return <Link href={href} onClick={onNavigate} className="min-w-0 rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35"><Marke kompakt zusatz={zusatz} className="max-w-[11.5rem]" /></Link>;
}

function initialen(name: string): string {
  const teile = name.trim().split(/\s+/).filter(Boolean);
  if (teile.length === 0) return "?";
  if (teile.length === 1) return teile[0]!.slice(0, 2).toUpperCase();
  return (teile[0]![0]! + teile[teile.length - 1]![0]!).toUpperCase();
}
