/* eslint-disable @typescript-eslint/no-require-imports -- eigenständiger Betriebswerkzeugtest. */
const assert = require("node:assert/strict");
const { mkdtempSync, readFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const projekt = join(__dirname, "..");
const quelle = readFileSync(join(projekt, "src/lib/datensicherung.ts"), "utf8");

// Regressionen für die sicherheitsrelevanten Verträge, auch ohne laufende DB.
assert.match(quelle, /pgDumpVerbindung\(\)/, "pg_dump muss die Prisma-URL vor der Übergabe zerlegen");
assert.doesNotMatch(quelle, /--dbname", process\.env\.DATABASE_URL/, "Die Prisma-URL mit ?schema darf nie direkt an libpq gehen");
assert.match(quelle, /PGPASSWORD: decodeURIComponent\(url\.password\)/, "Das Datenbankpasswort gehört in die Prozessumgebung, nicht in argv");
assert.match(quelle, /O_NOFOLLOW/, "Downloads müssen symbolische Links ablehnen");
assert.match(quelle, /fristTage\(\) - 1/, "Die Aufbewahrung zählt den heutigen Berliner Tag mit");
assert.match(quelle, /toDatetimeLocalValue/, "Kalendertage müssen über die Berlin-Helfer gebildet werden");
assert.match(quelle, /age\.eingabeFertig/, "Ein Fehler im ZIP-Stream muss den age-Lauf fehlschlagen lassen");

// Wenn age verfügbar ist, prüfen wir die echte Verschlüsselungs-Pipeline und
// einen absichtlich fehlerhaften Empfänger. In der Entwicklungsumgebung ohne
// age bleibt der Quellvertrags-Test trotzdem reproduzierbar.
if (spawnSync("age-keygen", ["--version"], { encoding: "utf8" }).status === 0) {
  const arbeit = mkdtempSync(join(tmpdir(), "fortbildungs-age-test-"));
  try {
    const identitaet = join(arbeit, "identitaet.txt");
    assert.equal(spawnSync("age-keygen", ["-o", identitaet], { encoding: "utf8" }).status, 0);
    const empfaenger = readFileSync(identitaet, "utf8").split("\n").find((zeile) => zeile.startsWith("# public key: ")).slice("# public key: ".length);
    const geheim = "vollbackup-klartext-darf-nur-im-verschluesselten-stream-sein";
    const verschluesselt = spawnSync("age", ["-r", empfaenger], { input: geheim });
    assert.equal(verschluesselt.status, 0, verschluesselt.stderr.toString());
    assert.equal(verschluesselt.stdout.includes(Buffer.from(geheim)), false, "age-Ausgabe darf keinen Klartext enthalten");
    const entschluesselt = spawnSync("age", ["-d", "-i", identitaet], { input: verschluesselt.stdout, encoding: "utf8" });
    assert.equal(entschluesselt.status, 0, entschluesselt.stderr);
    assert.equal(entschluesselt.stdout, geheim);
    assert.notEqual(spawnSync("age", ["-r", "age1ungueltig"], { input: geheim, encoding: "utf8" }).status, 0, "Ungültiger Empfänger muss den Prozessfehler liefern");
  } finally { rmSync(arbeit, { recursive: true, force: true }); }
} else {
  process.stdout.write("age ist lokal nicht installiert; Verschlüsselungs-Prozessprüfung übersprungen.\n");
}

process.stdout.write("Datensicherungsprüfungen erfolgreich.\n");
