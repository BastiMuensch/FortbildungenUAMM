import { ladeSchulamt } from "@/lib/schulamt";
import Link from "next/link";
import { CalendarDays, ListFilter, LogIn } from "lucide-react";

const NAVIGATION = [
  { href: "/fortbildungen", label: "Alle Fortbildungen", icon: ListFilter },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/login", label: "Redaktion", icon: LogIn, hervorheben: true },
];

export default async function OeffentlichesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schulamt = await ladeSchulamt();
  return (
    <div className="flex min-h-full flex-col overflow-x-clip">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Zum Inhalt springen
      </a>

      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-stretch gap-x-1 px-3 sm:gap-x-6 sm:px-4">
          <Link
            href="/"
            aria-label="Fortbildungen – Startseite"
            className="flex min-w-0 items-center gap-2 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-3"
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-sm sm:size-9 sm:rounded-xl"
            >
              F
            </span>
            <span className="leading-tight">
              <span className="hidden text-sm font-semibold tracking-tight text-foreground min-[360px]:block">
                Fortbildungen
              </span>
              <span className="hidden max-w-56 truncate text-xs text-muted-foreground min-[420px]:block">
                {schulamt.kurzname}
              </span>
            </span>
          </Link>

          <nav className="ml-auto flex items-stretch">
            {NAVIGATION.map(({ href, label, icon: Icon, hervorheben }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={
                  hervorheben
                    ? "my-2 ml-1 flex items-center gap-2 rounded-lg bg-primary px-2.5 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:px-3"
                    : "flex items-center gap-2 border-b-2 border-transparent px-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground sm:px-3"
                }
              >
                <Icon className="size-4" aria-hidden />
            <span className={hervorheben ? "inline" : "sr-only sm:not-sr-only"}>
                  {label}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="inhalt" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-14">
        {children}
      </main>

      <footer className="mt-16 border-t border-border bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start gap-x-8 gap-y-4 px-4 py-8 text-sm">
          <p className="text-muted-foreground">
            {schulamt.name}
          </p>

          <nav className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="/impressum" className="hover:text-foreground">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-foreground">
              Datenschutz
            </Link>
            <a href="/api/ics" className="hover:text-foreground">
              Kalender-Abo
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
