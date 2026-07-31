import Link from "next/link";
import { CalendarDays, ListFilter, Search } from "lucide-react";

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
    <div className="flex min-h-full flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-4">
          <Link href="/" className="leading-tight">
            <span className="block font-semibold tracking-tight">Fortbildungen</span>
            <span className="block text-xs text-muted-foreground">
              Schulamt Memmingen-Unterallgäu
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {NAVIGATION.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>

          <Link
            href="/fortbildungen"
            aria-label="Fortbildungen durchsuchen"
            className="ml-auto flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Search className="size-4" aria-hidden />
            <span className="hidden sm:inline">Suchen</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted-foreground">
          <span>
            Staatliches Schulamt im Landkreis Unterallgäu und in der Stadt Memmingen
          </span>
          <nav className="ml-auto flex items-center gap-4">
            <Link href="/impressum" className="underline-offset-4 hover:underline">
              Impressum
            </Link>
            <Link href="/datenschutz" className="underline-offset-4 hover:underline">
              Datenschutz
            </Link>
            <Link href="/login" className="underline-offset-4 hover:underline">
              Redaktion
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
