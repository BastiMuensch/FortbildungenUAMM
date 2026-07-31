import { requireUser } from "@/lib/auth";
import { rolleLabel, ROLLEN } from "@/constants/fortbildung";
import { formatDatumZeit } from "@/lib/datetime";
import { prisma } from "@/lib/prisma";
import { PasswortAendernFormular } from "@/components/admin/PasswortAendernFormular";

export const metadata = { title: "Eigenes Konto" };
export const dynamic = "force-dynamic";

export default async function KontoSeite() {
  const user = await requireUser();

  const konto = await prisma.user.findUnique({
    where: { id: user.id },
    select: { createdAt: true, lastLoginAt: true },
  });

  return (
    <div className="max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Eigenes Konto</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.name ? `${user.name} · ` : ""}
          {user.email}
        </p>
      </div>

      <dl className="grid gap-4 rounded-xl border bg-card p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Rolle</dt>
          <dd className="mt-0.5">{rolleLabel(user.role)}</dd>
          <dd className="mt-1 text-xs text-muted-foreground text-pretty">
            {ROLLEN.find((r) => r.value === user.role)?.beschreibung}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            Zuletzt angemeldet
          </dt>
          <dd className="mt-0.5 tabular-nums">
            {konto?.lastLoginAt ? formatDatumZeit(konto.lastLoginAt) : "—"}
          </dd>
          <dt className="mt-3 text-xs font-medium text-muted-foreground">
            Konto angelegt
          </dt>
          <dd className="mt-0.5 tabular-nums">
            {konto?.createdAt ? formatDatumZeit(konto.createdAt) : "—"}
          </dd>
        </div>
      </dl>

      <PasswortAendernFormular />
    </div>
  );
}
