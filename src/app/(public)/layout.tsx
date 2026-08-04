import Link from "next/link";
import { CalendarDays, ListFilter } from "lucide-react";

const NAVIGATION = [
  { href: "/fortbildungen", label: "Alle Fortbildungen", icon: ListFilter },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
];

export default function OeffentlichesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col overflow-x-clip">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Zum Inhalt springen
      </a>

      <header className="sticky top-0 z-40 border-b-2 border-primary bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-stretch gap-x-6 px-4">
          <Link
            href="/"
            className="flex items-center gap-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* Raute statt Rundung — dasselbe Motiv wie im Seitenkopf. */}
            <span
              aria-hidden
              className="size-4 rotate-45 bg-primary"
            />
            <span className="leading-tight">
              <span className="etikett block text-[0.8rem] tracking-[0.14em]">
                Fortbildungen
              </span>
              <span className="block text-xs text-muted-foreground">
                Schulamt Memmingen-Unterallgäu
              </span>
            </span>
          </Link>

          <nav className="ml-auto flex items-stretch">
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="etikett flex items-center gap-2 border-b-2 border-transparent px-3 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main id="inhalt" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        {children}
      </main>

      <footer className="mt-16 border-t-2 border-primary bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-start gap-x-8 gap-y-4 px-4 py-8 text-sm">
          <p className="text-muted-foreground">
            Staatliches Schulamt im Landkreis Unterallgäu
            <br className="hidden sm:block" /> und in der Stadt Memmingen
          </p>

          <nav className="etikett ml-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
            <Link href="/impressum" className="hover:text-foreground">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-foreground">
              Datenschutz
            </Link>
            <a href="/api/ics" className="hover:text-foreground">
              Kalender-Abo
            </a>
            <Link href="/login" className="hover:text-foreground">
              Redaktion
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
