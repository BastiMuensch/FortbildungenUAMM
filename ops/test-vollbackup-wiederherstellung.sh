#!/usr/bin/env bash
# Entschlüsselt ein Vollbackup ausschließlich für eine ausdrücklich bestätigte lokale Testdatenbank.
set -euo pipefail
umask 077
fehler() { printf '%s\n' "Fehler: $*" >&2; exit 1; }
brauch() { command -v "$1" >/dev/null 2>&1 || fehler "Programm fehlt: $1"; }

: "${BACKUP_AGE_IDENTITAETSDATEI:?Privater age-Schlüssel muss gesetzt sein}"
: "${RESTORE_DATABASE:?Lokale Testdatenbank muss gesetzt sein}"
: "${RESTORE_PGUSER:?Testdatenbankrolle muss gesetzt sein}"
: "${ERWARTETE_SHA256:?SHA-256 aus dem Portal muss gesetzt sein}"
: "${ICH_BESTAETIGE_LOKALE_TESTWIEDERHERSTELLUNG:?Setze ausdrücklich JA}"
[[ "$ICH_BESTAETIGE_LOKALE_TESTWIEDERHERSTELLUNG" == JA ]] || fehler 'Bestätigung fehlt'
[[ "$RESTORE_DATABASE" =~ (^|[_-])test([_-]|$) ]] || fehler 'RESTORE_DATABASE muss eindeutig eine Testdatenbank sein'
RESTORE_PGHOST=${RESTORE_PGHOST:-127.0.0.1}
[[ "$RESTORE_PGHOST" == 127.0.0.1 || "$RESTORE_PGHOST" == localhost || "$RESTORE_PGHOST" == ::1 ]] || fehler 'Nur localhost ist zulässig. Ein getrenntes Testsystem richtet die Betriebsstelle selbst ein.'
[[ -r "$BACKUP_AGE_IDENTITAETSDATEI" && ! -L "$BACKUP_AGE_IDENTITAETSDATEI" ]] || fehler 'Privater age-Schlüssel nicht sicher lesbar'
DATEI=${1:?Aufruf: test-vollbackup-wiederherstellung.sh <fortbildungsportal-vollbackup-….zip.age>}
[[ "$ERWARTETE_SHA256" =~ ^[a-fA-F0-9]{64}$ ]] || fehler 'SHA-256 aus dem Portal ist ungültig'
[[ -f "$DATEI" && ! -L "$DATEI" && "$(basename "$DATEI")" =~ ^fortbildungsportal-vollbackup-[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.zip\.age$ ]] || fehler 'Ungültige Vollbackup-Datei'
brauch age; brauch unzip; brauch python3; brauch pg_restore; brauch psql
if command -v shasum >/dev/null 2>&1; then
    TATSAECHLICHE_SHA256=$(shasum -a 256 "$DATEI" | awk '{print $1}')
elif command -v sha256sum >/dev/null 2>&1; then
    TATSAECHLICHE_SHA256=$(sha256sum "$DATEI" | awk '{print $1}')
else
    fehler 'Programm fehlt: shasum oder sha256sum'
fi
[[ "$(printf '%s' "$TATSAECHLICHE_SHA256" | tr '[:upper:]' '[:lower:]')" == "$(printf '%s' "$ERWARTETE_SHA256" | tr '[:upper:]' '[:lower:]')" ]] || fehler 'Chiffrearchiv-Prüfsumme stimmt nicht mit dem Portalwert überein'
ARBEIT=$(mktemp -d "${TMPDIR:-/tmp}/fortbildungsportal-vollrestore.XXXXXX") || fehler 'Geschütztes temporäres Verzeichnis nicht möglich'
chmod 700 "$ARBEIT"
aufraeumen() { rm -rf "$ARBEIT"; }
trap aufraeumen EXIT HUP INT TERM
ZIP="$ARBEIT/backup.zip"
age -d -i "$BACKUP_AGE_IDENTITAETSDATEI" -o "$ZIP" "$DATEI" || fehler 'Entschlüsselung fehlgeschlagen'
python3 - "$ZIP" "$ARBEIT" "$(basename "$DATEI")" <<'PY'
import datetime, json, pathlib, re, shutil, stat, sys, zipfile
z, out, filename = map(pathlib.Path, sys.argv[1:])
name_match = re.fullmatch(r'fortbildungsportal-vollbackup-(\d{4}-\d{2}-\d{2})-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.zip\.age', filename.name, re.I)
if not name_match: raise SystemExit('Ungültiger Vollbackup-Dateiname')
tag = name_match.group(1)
required = {'datenbank.dump', 'betrieb.json', 'manifest.json', 'prisma/schema.prisma', 'werkzeuge/Uebernehme-Vollbackup.ps1', 'werkzeuge/test-vollbackup-wiederherstellung.sh', 'WIEDERHERSTELLUNG.txt'}
def allowed(name):
    if name in required: return True
    if name in {'prisma/', 'prisma/migrations/', 'werkzeuge/'}: return True
    return bool(re.fullmatch(r'prisma/migrations/\d{14}_[a-z0-9_]+/(?:|migration\.sql)', name))
with zipfile.ZipFile(z) as archive:
    names = [info.filename for info in archive.infolist()]
    if not required.issubset(names) or len(names) != len(set(names)):
        raise SystemExit('Archiv enthält erforderliche oder eindeutige Einträge nicht')
    total = 0
    for info in archive.infolist():
        name = info.filename
        p = pathlib.PurePosixPath(name)
        art = (info.external_attr >> 16) & 0o170000
        if art == stat.S_IFLNK or p.is_absolute() or '..' in p.parts or '\\' in name or not allowed(name):
            raise SystemExit('Unsicherer oder nicht erlaubter Archivpfad')
        if info.file_size > 2 * 1024**3 or info.compress_size > 2 * 1024**3:
            raise SystemExit('Archiveintrag ist zu groß')
        total += info.file_size
        if total > 4 * 1024**3: raise SystemExit('Entschlüsseltes Archiv ist zu groß')
    manifest = json.loads(archive.read('manifest.json'))
    manifest_keys = {'format', 'tag', 'erstelltAm', 'appVersion', 'appImage', 'verschluesselung'}
    if set(manifest) != manifest_keys or manifest.get('format') != 'fortbildungsportal-vollbackup-v1' or manifest.get('tag') != tag or manifest.get('verschluesselung') != 'age' or not isinstance(manifest.get('appVersion'), str) or not (isinstance(manifest.get('appImage'), str) or manifest.get('appImage') is None):
        raise SystemExit('Manifest ist kein gültiges Vollbackup-v1')
    try: datetime.datetime.fromisoformat(manifest['erstelltAm'].replace('Z', '+00:00'))
    except (KeyError, TypeError, ValueError): raise SystemExit('Manifestzeit ist ungültig')
    betrieb = json.loads(archive.read('betrieb.json'))
    erforderliche_betriebsschluessel = {'DATABASE_URL', 'JWT_SECRET', 'MFA_ENCRYPTION_KEY'}
    if not isinstance(betrieb, dict) or not erforderliche_betriebsschluessel.issubset(betrieb) or any(not isinstance(k, str) or not isinstance(v, str) for k, v in betrieb.items()):
        raise SystemExit('betrieb.json ist keine zulässige Laufzeitkonfiguration')
    for info in archive.infolist():
        name = info.filename
        target = out / pathlib.PurePosixPath(name)
        if name.endswith('/'):
            target.mkdir(mode=0o700, parents=True, exist_ok=True)
            continue
        target.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        with archive.open(info) as source, open(target, 'xb') as dest: shutil.copyfileobj(source, dest, 1024 * 1024)
PY
pg_restore --list "$ARBEIT/datenbank.dump" >/dev/null || fehler 'Datenbank-Dump ist kein lesbares PostgreSQL-Archiv'
export PGHOST="$RESTORE_PGHOST" PGPORT="${RESTORE_PGPORT:-5432}" PGUSER="$RESTORE_PGUSER"
psql --set=ON_ERROR_STOP=1 --dbname="$RESTORE_DATABASE" --command='SELECT 1' >/dev/null
pg_restore --exit-on-error --single-transaction --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE" "$ARBEIT/datenbank.dump" || fehler 'Wiederherstellung der Testdatenbank fehlgeschlagen'
psql --set=ON_ERROR_STOP=1 --dbname="$RESTORE_DATABASE" --command='SELECT current_database()' >/dev/null
printf '%s\n' 'Wiederherstellungsprobe erfolgreich. betrieb.json wurde nicht in eine Live-Konfiguration übernommen.'
