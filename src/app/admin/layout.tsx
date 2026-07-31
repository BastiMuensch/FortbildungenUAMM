import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Download,
  FileText,
  LogOut,
  MapPin,
  Tags,
  Users,
} from "lucide-react";

import { getSessionUser } from "@/lib/auth";
import { logout } from "@/actions/auth";
import { rolleLabel } from "@/constants/fortbildung";
import { Button } from "@/components/ui/button";

export const metadata = {
  robots: { index: false, follow: false },
};

const NAVIGATION = [
  { href: "/admin", label: "Fortbildungen", icon: CalendarDays, nurAdmin: false },
  { href: "/admin/referenten", label: "Referenten", icon: Users, nurAdmin: false },
  { href: "/admin/schlagworte", label: "Schlagworte", icon: Tags, nurAdmin: false },
  { href: "/admin/orte", label: "Orte", icon: MapPin, nurAdmin: false },
  { href: "/admin/import", label: "FIBS-Import", icon: Download, nurAdmin: false },
  { href: "/admin/texte", label: "Rechtstexte", icon: FileText, nurAdmin: true },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // proxy.ts hat das Cookie bereits oberflächlich geprüft. Hier wird gegen die
  // Datenbank geprüft, damit ein deaktivierter Zugang sofort greift.
  const user = await getSessionUser();
  if (!user) redirect("/login?weiter=/admin");

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link href="/admin" className="font-semibold tracking-tight">
            Fortbildungen{" "}
            <span className="text-muted-foreground font-normal">UAMM</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {NAVIGATION.filter(
              (eintrag) => !eintrag.nurAdmin || user.role === "ADMIN",
            ).map(({ href, label, icon: Icon }) => (
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

          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">
              {user.name ?? user.email}
              <span className="ml-1.5 text-xs">({rolleLabel(user.role)})</span>
            </span>
            <Link
              href="/"
              className="text-muted-foreground underline-offset-4 hover:underline"
            >
              Frontend
            </Link>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                <LogOut className="size-4" aria-hidden />
                Abmelden
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
