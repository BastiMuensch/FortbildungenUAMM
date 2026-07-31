import Link from "next/link";
import { CalendarDays, GraduationCap, ListFilter } from "lucide-react";

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
    // overflow-x-clip, damit vollflächige Hintergründe (siehe Startseite)
    // keinen waagrechten Bildlauf auslösen.
    <div className="flex min-h-full flex-col overflow-x-clip">
      <a
        href="#inhalt"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Zum Inhalt springen
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-x-8 gap-y-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block font-semibold tracking-tight">
                Fortbildungen
              </span>
              <span className="block text-xs text-muted-foreground">
                Schulamt Memmingen-Unterallgäu
              </span>
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-1 text-sm">
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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

      <footer className="mt-16 border-t bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-8 text-sm">
          <p className="text-muted-foreground">
            Staatliches Schulamt im Landkreis Unterallgäu
            <br className="hidden sm:block" /> und in der Stadt Memmingen
          </p>

          <nav className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
            <Link href="/impressum" className="underline-offset-4 hover:text-foreground hover:underline">
              Impressum
            </Link>
            <Link href="/datenschutz" className="underline-offset-4 hover:text-foreground hover:underline">
              Datenschutz
            </Link>
            <a href="/api/ics" className="underline-offset-4 hover:text-foreground hover:underline">
              Kalender-Abo
            </a>
            <Link href="/login" className="underline-offset-4 hover:text-foreground hover:underline">
              Redaktion
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
