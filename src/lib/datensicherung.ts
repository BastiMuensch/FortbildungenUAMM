import "server-only";

import { createHash } from "node:crypto";
import { constants as fsKonstanten, createWriteStream, promises as fs } from "node:fs";
import { basename, resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import JSZip from "jszip";

import { prisma } from "@/lib/prisma";
import { formatZeit, toDatetimeLocalValue } from "@/lib/datetime";

const SPERRSCHLUESSEL = 824_175_901;
const PROZESS_TIMEOUT_MS = 45 * 60 * 1000;
const STANDARD_FRIST_TAGE = 30;
const METADATEN_FRIST_TAGE = 365;
const TAG_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const EMPFAENGER_FORMAT = /^age1[ac-hj-np-z02-9]+$/;


export const datensicherungAuswahl = {
  id: true, tag: true, status: true, dateiname: true, sha256: true, bytes: true,
  erstelltAm: true, abgelegtAm: true, externeAblage: true, fehler: true,
  geloeschtAm: true, heruntergeladenAm: true,
  abgelegtVon: { select: { name: true } },
} as const;

function berlinTag(zeitpunkt = new Date()): string { return toDatetimeLocalValue(zeitpunkt).split("T")[0]; }

function tageVor(tag: string, tage: number): string {
  const [jahr, monat, tagNummer] = tag.split("-").map(Number);
  return berlinTag(new Date(Date.UTC(jahr, monat - 1, tagNummer - tage, 12)));
}

function fristTage(): number {
  const wert = Number(process.env.DATENSICHERUNG_SPOOL_TAGE ?? STANDARD_FRIST_TAGE);
  return Number.isInteger(wert) && wert >= 7 && wert <= 90 ? wert : STANDARD_FRIST_TAGE;
}

export function datensicherungKonfiguriert(): boolean {
  return EMPFAENGER_FORMAT.test((process.env.DATENSICHERUNG_AGE_EMPFAENGER ?? "").trim());
}

function spoolVerzeichnis(): string { return resolve(process.env.DATENSICHERUNG_SPOOL ?? "/var/lib/fortbildungsportal/sicherungen"); }

async function sicheresSpoolVerzeichnis(): Promise<string> {
  const ordner = spoolVerzeichnis();
  await fs.mkdir(ordner, { recursive: true, mode: 0o700 });
  const info = await fs.lstat(ordner);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("SPOOL_UNSICHER");
  await fs.chmod(ordner, 0o700);
  return await fs.realpath(ordner);
}

function dateinameFuerTag(tag: string, id: string): string {
  if (!TAG_FORMAT.test(tag) || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error("UNGUELTIGER_PAKETNAME");
  return `fortbildungsportal-vollbackup-${tag}-${id}.zip.age`;
}

async function paketPfad(tag: string, id: string): Promise<string> {
  const ordner = await sicheresSpoolVerzeichnis();
  const dateiname = dateinameFuerTag(tag, id);
  const pfad = resolve(ordner, dateiname);
  if (!pfad.startsWith(`${ordner}/`) || basename(pfad) !== dateiname) throw new Error("UNSICHERER_PFAD");
  return pfad;
}

function betriebsKonfiguration(): Record<string, string> {
  const namen = ["DATABASE_URL", "JWT_SECRET", "MFA_ENCRYPTION_KEY", "APP_BASE_URL", "SESSION_COOKIE_SECURE", "APP_IMAGE", "FIBS_IMPORT_ENABLED", "FIBS_BASE_URL", "FIBS_USER_AGENT_CONTACT", "RETENTION_SCHEDULER", "CRON_SECRET", "DATENSICHERUNG_AGE_EMPFAENGER", "DATENSICHERUNG_SPOOL_TAGE", "DATENSICHERUNG_SCHEDULER"];
  return Object.fromEntries(namen.flatMap((name) => process.env[name] === undefined ? [] : [[name, process.env[name] as string]]));
}

function manifest(tag: string) {
  return { format: "fortbildungsportal-vollbackup-v1", tag, erstelltAm: new Date().toISOString(), appVersion: process.env.npm_package_version ?? "unbekannt", appImage: process.env.APP_IMAGE ?? null, verschluesselung: "age" };
}

function starteProzess(befehl: string, argumente: string[], eingabe?: Readable, umgebung?: NodeJS.ProcessEnv) {
  const kind = spawn(befehl, argumente, { stdio: ["pipe", "pipe", "pipe"], env: umgebung ?? process.env });
  const timer = setTimeout(() => {
    kind.kill("SIGTERM");
    // Ein fehlerhafter Unterprozess darf die transaktionale Advisory-Sperre
    // nicht unbegrenzt festhalten.
    setTimeout(() => kind.kill("SIGKILL"), 10_000).unref();
  }, PROZESS_TIMEOUT_MS);
  const beendet = new Promise<void>((resolvePromise, reject) => {
    kind.once("error", () => reject(new Error("PROZESS_NICHT_VERFUEGBAR")));
    kind.once("close", (code) => code === 0 ? resolvePromise() : reject(new Error("PROZESS_FEHLER")));
  }).finally(() => clearTimeout(timer));
  // Einen Handler sofort registrieren, damit ein früher Prozessfehler nicht
  // als unbehandelte Rejection erscheint, bevor die Pipelines gesammelt sind.
  void beendet.catch(() => undefined);
  // Prozessausgaben können Geheimnisse enthalten. Nicht protokollieren, aber
  // leeren, damit ein fehlerhafter Prozess nicht am vollen stderr-Puffer hängt.
  kind.stderr.resume();
  const eingabeFertig = eingabe ? pipeline(eingabe, kind.stdin).catch((error) => { kind.kill("SIGTERM"); throw error; }) : Promise.resolve();
  void eingabeFertig.catch(() => undefined);
  return { kind, beendet, eingabeFertig };
}

function pgDumpVerbindung(): { argumente: string[]; umgebung: NodeJS.ProcessEnv } {
  const roh = process.env.DATABASE_URL;
  if (!roh) throw new Error("DATENBANK_URL_FEHLT");
  let url: URL;
  try { url = new URL(roh); } catch { throw new Error("DATENBANK_URL_UNGUELTIG"); }
  if (!/^postgres(?:ql)?:$/.test(url.protocol) || !url.hostname || !url.pathname || !url.username) throw new Error("DATENBANK_URL_UNGUELTIG");
  const sslmode = url.searchParams.get("sslmode");
  const umgebung: NodeJS.ProcessEnv = { ...process.env, PGPASSWORD: decodeURIComponent(url.password) };
  if (sslmode && /^(disable|allow|prefer|require|verify-ca|verify-full)$/.test(sslmode)) umgebung.PGSSLMODE = sslmode;
  return {
    argumente: ["--format=custom", "--no-owner", "--no-privileges", "--host", url.hostname, ...(url.port ? ["--port", url.port] : []), "--username", decodeURIComponent(url.username), "--dbname", decodeURIComponent(url.pathname.slice(1))],
    umgebung,
  };
}

async function erstellePaket(tag: string, id: string): Promise<{ dateiname: string; sha256: string; bytes: bigint }> {
  const empfaenger = (process.env.DATENSICHERUNG_AGE_EMPFAENGER ?? "").trim();
  if (!EMPFAENGER_FORMAT.test(empfaenger)) throw new Error("AGE_EMPFAENGER_FEHLT");
  const pfad = await paketPfad(tag, id);
  const temporaer = `${pfad}.neu`;
  let dump: ReturnType<typeof starteProzess> | undefined;
  let age: ReturnType<typeof starteProzess> | undefined;
  let schreiben: Promise<void> | undefined;
  try {
    await fs.unlink(temporaer).catch(() => undefined);
    // Die Schemaquelle ist Bestandteil des Images. Sie wird ausschließlich im
    // verschlüsselten Archiv abgelegt und nie als temporäre Klartextdatei.
    const [schema, uebernahme, pruefung, migrationsOrdner] = await Promise.all([
      fs.readFile(resolve(process.cwd(), "prisma/schema.prisma"), "utf8"),
      fs.readFile(resolve(process.cwd(), "ops/Uebernehme-Vollbackup.ps1"), "utf8"),
      fs.readFile(resolve(process.cwd(), "ops/test-vollbackup-wiederherstellung.sh"), "utf8"),
      fs.readdir(resolve(process.cwd(), "prisma/migrations"), { withFileTypes: true }),
    ]);
    const migrationen = await Promise.all(migrationsOrdner
      .filter((eintrag) => eintrag.isDirectory() && /^\d{14}_[a-z0-9_]+$/.test(eintrag.name))
      .map(async (eintrag) => [eintrag.name, await fs.readFile(resolve(process.cwd(), "prisma/migrations", eintrag.name, "migration.sql"), "utf8")] as const));
    const verbindung = pgDumpVerbindung();
    dump = starteProzess("pg_dump", verbindung.argumente, undefined, verbindung.umgebung);
    const zip = new JSZip();
    const zeit = new Date();
    zip.file("manifest.json", `${JSON.stringify(manifest(tag))}\n`, { date: zeit });
    zip.file("betrieb.json", `${JSON.stringify(betriebsKonfiguration())}\n`, { date: zeit });
    zip.file("datenbank.dump", dump.kind.stdout, { binary: true, date: zeit });
    zip.file("prisma/schema.prisma", schema, { date: zeit });
    for (const [name, inhalt] of migrationen) zip.file(`prisma/migrations/${name}/migration.sql`, inhalt, { date: zeit });
    zip.file("werkzeuge/Uebernehme-Vollbackup.ps1", uebernahme, { date: zeit });
    zip.file("werkzeuge/test-vollbackup-wiederherstellung.sh", pruefung, { date: zeit });
    zip.file("WIEDERHERSTELLUNG.txt", "Mit einem offline verwahrten age-Identitätsschlüssel entschlüsseln. Anschließend datenbank.dump mit pg_restore in eine PostgreSQL-16-Datenbank einspielen und betrieb.json als geschützte Betriebsumgebung zurücklegen.\n", { date: zeit });
    age = starteProzess("age", ["-r", empfaenger], new Readable().wrap(zip.generateNodeStream({ streamFiles: true, compression: "DEFLATE" })));
    const ausgabe = createWriteStream(temporaer, { flags: "wx", mode: 0o600 });
    const hash = createHash("sha256");
    const pruefsumme = new Transform({ transform(teil, _kodierung, weiter) { hash.update(teil); weiter(null, teil); } });
    schreiben = pipeline(age.kind.stdout, pruefsumme, ausgabe);
    void schreiben.catch(() => undefined);
    await Promise.all([dump.beendet, age.beendet, age.eingabeFertig, schreiben]);
    const info = await fs.stat(temporaer);
    if (!info.isFile() || info.isSymbolicLink() || info.size < 1) throw new Error("PAKET_UNGUELTIG");
    await fs.rename(temporaer, pfad);
    return { dateiname: basename(pfad), sha256: hash.digest("hex"), bytes: BigInt(info.size) };
  } catch (error) {
    for (const prozess of [dump, age]) {
      prozess?.kind.stdin.destroy();
      prozess?.kind.stdout.destroy();
      prozess?.kind.kill("SIGTERM");
      setTimeout(() => prozess?.kind.kill("SIGKILL"), 10_000).unref();
    }
    await Promise.allSettled([dump?.beendet, dump?.eingabeFertig, age?.beendet, age?.eingabeFertig, schreiben].filter((wert): wert is Promise<void> => Boolean(wert)));
    await fs.unlink(temporaer).catch(() => undefined);
    throw error;
  }
}

function sichereFehlerklasse(error: unknown): string {
  const code = error instanceof Error ? error.message : "UNBEKANNTER_FEHLER";
  return ["AGE_EMPFAENGER_FEHLT", "PROZESS_NICHT_VERFUEGBAR", "PROZESS_FEHLER", "SPOOL_UNSICHER", "PAKET_UNGUELTIG"].includes(code) ? code : "SICHERUNG_FEHLGESCHLAGEN";
}

export async function erstelleTagesDatensicherung(): Promise<{ id: string } | null> {
  if (!datensicherungKonfiguriert()) throw new Error("AGE_EMPFAENGER_FEHLT");
  const resultat = await prisma.$transaction(async (tx) => {
    const sperre = await tx.$queryRaw<Array<{ gesperrt: boolean }>>`SELECT pg_try_advisory_xact_lock(${SPERRSCHLUESSEL}) AS gesperrt`;
    if (!sperre[0]?.gesperrt) return null;
    const tag = berlinTag();
    const vorhanden = await tx.datensicherung.findUnique({ where: { tag }, select: { id: true, status: true } });
    if (vorhanden?.status === "BEREIT") return { id: vorhanden.id };
    const sicherung = vorhanden ? await tx.datensicherung.update({ where: { id: vorhanden.id }, data: { status: "LAEUFT", fehler: null, geloeschtAm: null } }) : await tx.datensicherung.create({ data: { tag } });
    try {
      const paket = await erstellePaket(tag, sicherung.id);
      await tx.datensicherung.update({ where: { id: sicherung.id }, data: { status: "BEREIT", ...paket } });
      return { id: sicherung.id, fehler: null as string | null };
    } catch (error) {
      const fehler = sichereFehlerklasse(error);
      await tx.datensicherung.update({ where: { id: sicherung.id }, data: { status: "FEHLER", fehler } });
      return { id: sicherung.id, fehler };
    }
  }, { timeout: PROZESS_TIMEOUT_MS + 60_000 });
  if (resultat === null) return null;
  if (resultat.fehler) throw new Error(resultat.fehler);
  return { id: resultat.id };
}

export async function bereinigeDatensicherungen(): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const sperre = await tx.$queryRaw<Array<{ gesperrt: boolean }>>`SELECT pg_try_advisory_xact_lock(${SPERRSCHLUESSEL}) AS gesperrt`;
    if (!sperre[0]?.gesperrt) return;
    const heute = berlinTag();
    // Der heutige Berliner Kalendertag zählt mit: bei 30 Tagen bleiben heute
    // und die 29 vorangegangenen Tage erhalten.
    const loeschgrenze = tageVor(heute, fristTage() - 1);
    const metadataGrenze = tageVor(heute, METADATEN_FRIST_TAGE - 1);
    const kandidaten = await tx.datensicherung.findMany({ where: { tag: { lt: loeschgrenze }, geloeschtAm: null }, select: { id: true, tag: true } });
    for (const kandidat of kandidaten) {
      try { await fs.unlink(await paketPfad(kandidat.tag, kandidat.id)); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") continue; }
      await tx.datensicherung.update({ where: { id: kandidat.id }, data: { geloeschtAm: new Date() } });
    }
    const bekannte = await tx.datensicherung.findMany({ where: { status: "BEREIT", geloeschtAm: null }, select: { id: true, tag: true, dateiname: true } });
    const erlaubt = new Set(bekannte.map((paket) => paket.dateiname ?? dateinameFuerTag(paket.tag, paket.id)));
    const ordner = await sicheresSpoolVerzeichnis();
    const eintraege = (await fs.readdir(ordner, { withFileTypes: true })).slice(0, 1_000);
    const paketMuster = /^fortbildungsportal-vollbackup-\d{4}-\d{2}-\d{2}-[0-9a-f-]{36}\.zip\.age(?:\.neu)?$/i;
    for (const eintrag of eintraege) {
      if (!eintrag.isFile() || !paketMuster.test(eintrag.name)) continue;
      const istTemporaer = eintrag.name.endsWith(".neu");
      const finalerName = istTemporaer ? eintrag.name.slice(0, -4) : eintrag.name;
      if (istTemporaer || !erlaubt.has(finalerName)) await fs.unlink(resolve(ordner, eintrag.name)).catch(() => undefined);
    }
    await tx.datensicherung.deleteMany({ where: { geloeschtAm: { not: null }, tag: { lt: metadataGrenze } } });
  });
}

export async function ladeDatensicherungsUebersicht() {
  const pakete = await prisma.datensicherung.findMany({ orderBy: { tag: "desc" }, select: datensicherungAuswahl });
  const heute = berlinTag();
  const loeschgrenze = tageVor(heute, fristTage() - 1);
  return { heute, konfiguriert: datensicherungKonfiguriert(), automatikAktiv: process.env.DATENSICHERUNG_SCHEDULER !== "off", fristTage: fristTage(), pakete: pakete.map((paket) => ({ ...paket, bytes: paket.bytes === null ? null : Number(paket.bytes), abgelegtVonName: paket.abgelegtVon?.name ?? null, abgelegtVon: undefined, abgelaufen: paket.tag < loeschgrenze })) };
}

export async function oeffneDatensicherung(id: string): Promise<{ stream: Readable; dateiname: string; sha256: string; bytes: number } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const paket = await prisma.datensicherung.findUnique({ where: { id }, select: { tag: true, status: true, dateiname: true, sha256: true, bytes: true, geloeschtAm: true } });
  const abgelaufen = paket ? paket.tag < tageVor(berlinTag(), fristTage() - 1) : true;
  if (!paket || abgelaufen || paket.status !== "BEREIT" || paket.geloeschtAm || !paket.dateiname || !paket.sha256 || paket.bytes === null || paket.dateiname !== dateinameFuerTag(paket.tag, id)) return null;
  try {
    const pfad = await paketPfad(paket.tag, id);
    const datei = await fs.open(pfad, fsKonstanten.O_RDONLY | fsKonstanten.O_NOFOLLOW);
    try {
      const info = await datei.stat();
      if (!info.isFile() || BigInt(info.size) !== paket.bytes) { await datei.close(); return null; }
      // FileHandle hält den Descriptor bis zum Stream-Ende selbst fest.
      const stream = datei.createReadStream({ autoClose: true });
      return { stream, dateiname: paket.dateiname, sha256: paket.sha256, bytes: info.size };
    } catch (error) { await datei.close().catch(() => undefined); throw error; }
  } catch { return null; }
}

let schedulerGestartet = false;
export function starteDatensicherungsScheduler(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (schedulerGestartet) return;
  schedulerGestartet = true;
  const pruefen = async () => {
    try {
      await bereinigeDatensicherungen();
      // Der 06:00-Lauf wird beim nächsten Stundenintervall bzw. nach einem
      // Neustart nachgeholt. Vor sechs Uhr wird kein neues Tagespaket erzeugt.
      if (process.env.DATENSICHERUNG_SCHEDULER !== "off" && Number(formatZeit(new Date()).slice(0, 2)) >= 6) await erstelleTagesDatensicherung();
    } catch (error) { console.error("[Datensicherung] fehlgeschlagen:", sichereFehlerklasse(error)); }
  };
  void pruefen();
  setInterval(() => void pruefen(), 60 * 60 * 1000).unref();
}
