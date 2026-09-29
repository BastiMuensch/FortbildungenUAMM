/* eslint-disable @typescript-eslint/no-require-imports -- isolierter Shell-Protokolltest. */
const assert = require("node:assert/strict");
const { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");
const { createHash } = require("node:crypto");

const projekt = join(__dirname, "..");
const arbeit = mkdtempSync(join(tmpdir(), "fortbildungs-backup-test-"));
const bin = join(arbeit, "bin"); mkdirSync(bin);
const log = join(arbeit, "aufrufe.log");
const schreibe = (name, inhalt) => { const datei = join(bin, name); writeFileSync(datei, `#!/usr/bin/env bash\n${inhalt}`); chmodSync(datei, 0o755); };
schreibe("docker", 'echo "docker $*" >> "$MOCK_LOG"\n[[ "$1 $2" == "compose version" ]] && exit 0\n[[ "$*" == *" exec "* ]] && exit "${DOCKER_DUMP_EXIT:-0}"\nexit 0');
schreibe("age", 'echo "age $*" >> "$MOCK_LOG"\nif [[ "$1" == -d ]]; then [[ "${AGE_FAIL:-0}" == 1 ]] && exit 7; printf dump; exit 0; fi\nfor ((i=1;i<=$#;i++)); do [[ "${!i}" == -o ]] && { j=$((i+1)); cat > "${!j}"; exit 0; }; done\nexit 0');
schreibe("pg_restore", 'echo "pg_restore $*" >> "$MOCK_LOG"\ncat >/dev/null\n[[ "$*" == *"--file=/dev/null"* ]] && exit 0\nexit "${PG_RESTORE_EXIT:-0}"');
schreibe("psql", "exit 0");
const empfaenger = join(arbeit, "empfaenger.txt"); writeFileSync(empfaenger, "age1test"); chmodSync(empfaenger, 0o600);
const identitaet = join(arbeit, "identitaet.txt"); writeFileSync(identitaet, "AGE-SECRET-KEY-TEST"); chmodSync(identitaet, 0o600);
const basis = { PATH: `${bin}:${process.env.PATH}`, MOCK_LOG: log, BACKUP_AGE_EMPFAENGERDATEI: empfaenger, BACKUP_AGE_IDENTITAETSDATEI: identitaet };
const ausfuehren = (script, args, env) => spawnSync("bash", [join(projekt, script), ...args], { cwd: projekt, env: { ...process.env, ...basis, ...env }, encoding: "utf8" });
try {
  const fehlendesZiel = join(arbeit, "nicht-eingehaengt");
  let ergebnis = ausfuehren("ops/sichere-postgres-sicherung.sh", [], { BACKUP_ZIEL: fehlendesZiel });
  assert.notEqual(ergebnis.status, 0); assert.equal(existsSync(fehlendesZiel), false, "Mount-Ausfall darf keine lokale Ersatzablage anlegen");

  const ziel = join(arbeit, "backup"); mkdirSync(ziel); writeFileSync(join(ziel, ".fortbildungsportal-backup-ziel"), "bereit\n");
  ergebnis = ausfuehren("ops/sichere-postgres-sicherung.sh", [], { BACKUP_ZIEL: ziel, DOCKER_DUMP_EXIT: "9" });
  assert.notEqual(ergebnis.status, 0); assert.match(ergebnis.stderr, /keine Sicherung veröffentlicht/);
  assert.equal(readFileSync(log, "utf8").includes("-U fortbildungen"), true, "pg_dump muss als Datenbankrolle laufen");
  assert.equal(existsSync(join(ziel, ".fortbildungsportal-backup.lock")), false, "Sperre wird nach Fehlschlag entfernt");

  const dump = join(ziel, "probe.dump.age"); writeFileSync(dump, "verschluesselt");
  writeFileSync(`${dump}.sha256`, `${createHash("sha256").update("verschluesselt").digest("hex")}  probe.dump.age\n`);
  const restoreEnv = { BACKUP_ZIEL: ziel, RESTORE_DATABASE: "fortbildungen_test", RESTORE_PGUSER: "test", ICH_BESTAETIGE_TESTWIEDERHERSTELLUNG: "JA" };
  ergebnis = ausfuehren("ops/test-wiederherstellung.sh", [dump], { ...restoreEnv, AGE_FAIL: "1" });
  assert.notEqual(ergebnis.status, 0); assert.match(ergebnis.stderr, /Archivprüfung/);
  ergebnis = ausfuehren("ops/test-wiederherstellung.sh", [dump], { ...restoreEnv, PG_RESTORE_EXIT: "8" });
  assert.notEqual(ergebnis.status, 0); assert.match(ergebnis.stderr, /Einzeltransaktion/);
  assert.equal(readFileSync(log, "utf8").includes("--single-transaction"), true, "Restore muss atomar angefordert werden");
  // Beide stat-Varianten auch auf dem jeweils anderen Betriebssystem prüfen.
  // Fehlgeschlagene Aufrufe können bereits stdout geschrieben haben.
  schreibe("stat", 'if [[ "$STAT_VARIANTE:$1" == "gnu:-c" || "$STAT_VARIANTE:$1" == "bsd:-f" ]]; then printf "%s\\n" "$STAT_RECHTE"; else printf "Dateisystemdaten statt Dateirechte\\n"; exit 1; fi');
  for (const variante of ["gnu", "bsd"]) {
    const statEnv = { STAT_VARIANTE: variante, STAT_RECHTE: "600" };
    ergebnis = ausfuehren("ops/sichere-postgres-sicherung.sh", [], { ...statEnv, BACKUP_ZIEL: ziel, DOCKER_DUMP_EXIT: "9" });
    assert.match(ergebnis.stderr, /keine Sicherung veröffentlicht/, `${variante}: 0600 muss bis zum Dump gelangen`);
    ergebnis = ausfuehren("ops/test-wiederherstellung.sh", [dump], { ...restoreEnv, ...statEnv, AGE_FAIL: "1" });
    assert.match(ergebnis.stderr, /Archivprüfung/, `${variante}: 0600 muss bis zur Archivprüfung gelangen`);
    ergebnis = ausfuehren("ops/sichere-postgres-sicherung.sh", [], { ...statEnv, STAT_RECHTE: "644", BACKUP_ZIEL: ziel });
    assert.notEqual(ergebnis.status, 0);
    assert.match(ergebnis.stderr, /Empfängerdatei braucht restriktive Rechte/);
    ergebnis = ausfuehren("ops/test-wiederherstellung.sh", [dump], { ...restoreEnv, ...statEnv, STAT_RECHTE: "644" });
    assert.notEqual(ergebnis.status, 0);
    assert.match(ergebnis.stderr, /Privater Schlüssel braucht 0400 oder 0600/);
  }
  console.log("Backup-Protokollprüfungen erfolgreich.");
} finally { rmSync(arbeit, { recursive: true, force: true }); }
