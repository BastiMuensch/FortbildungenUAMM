import { redirect } from "next/navigation";
import { liesMfaAnmeldung } from "@/lib/auth";
import { MfaAnmeldeFormular } from "@/components/admin/MfaAnmeldeFormular";
export const metadata = { title: "Zwei-Faktor-Authentifizierung", robots: { index: false, follow: false } };
export default async function MfaSeite() { if (!(await liesMfaAnmeldung())) redirect("/login"); return <main className="flex flex-1 items-center justify-center px-4 py-16"><div className="w-full max-w-sm space-y-6 border bg-card p-6 shadow-sm"><div><h1 className="text-xl font-semibold">Zwei-Faktor-Authentifizierung</h1><p className="mt-2 text-sm text-muted-foreground">Bitte bestätigen Sie die Anmeldung mit Ihrer Authenticator-App.</p></div><MfaAnmeldeFormular /></div></main>; }
