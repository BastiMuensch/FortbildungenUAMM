#!/usr/bin/env bash
# Prüft eine verschlüsselte Sicherung und stellt sie ausschließlich in eine
# ausdrücklich bestätigte, lokale Testdatenbank wieder her.
set -euo pipefail
umask 077

fehler() { printf '%s\n' "Fehler: $*" >&2; exit 1; }
brauch() { command -v "$1" >/dev/null 2>&1 || fehler "Programm fehlt: $1"; }
sha256() { shasum -a 256 "$1" | awk '{print $1}'; }

: "${BACKUP_ZIEL:?BACKUP_ZIEL muss dem freigegebenen Backup-Pfad entsprechen}"
: "${BACKUP_AGE_IDENTITAETSDATEI:?BACKUP_AGE_IDENTITAETSDATEI muss ein getrennt verwahrter privater age-Schlüssel sein}"
: "${RESTORE_DATABASE:?RESTORE_DATABASE muss eine lokale Testdatenbank sein}"
: "${RESTORE_PGUSER:?RESTORE_PGUSER muss gesetzt sein}"
: "${ICH_BESTAETIGE_TESTWIEDERHERSTELLUNG:?Setze ICH_BESTAETIGE_TESTWIEDERHERSTELLUNG=JA}"

[[ "$ICH_BESTAETIGE_TESTWIEDERHERSTELLUNG" == JA ]] || fehler "Bestätigung fehlt"
[[ "$BACKUP_ZIEL" = /* ]] || fehler "BACKUP_ZIEL muss absolut sein"
[[ -d "$BACKUP_ZIEL" && ! -L "$BACKUP_ZIEL" ]] || fehler "BACKUP_ZIEL fehlt oder ist ein Symlink"
BACKUP_ZIEL=$(cd -P "$BACKUP_ZIEL" && pwd)
[[ "$RESTORE_DATABASE" =~ (^|[_-])test([_-]|$) ]] || fehler "RESTORE_DATABASE muss eindeutig als Testdatenbank gekennzeichnet sein"
RESTORE_PGHOST=${RESTORE_PGHOST:-127.0.0.1}
[[ "$RESTORE_PGHOST" == 127.0.0.1 || "$RESTORE_PGHOST" == localhost || "$RESTORE_PGHOST" == ::1 ]] || fehler "Wiederherstellung ist nur auf localhost erlaubt"
[[ -f "$BACKUP_AGE_IDENTITAETSDATEI" && -r "$BACKUP_AGE_IDENTITAETSDATEI" ]] || fehler "Privater age-Schlüssel nicht lesbar"
[[ $(stat -f '%OLp' "$BACKUP_AGE_IDENTITAETSDATEI" 2>/dev/null || stat -c '%a' "$BACKUP_AGE_IDENTITAETSDATEI") =~ ^(400|600)$ ]] || fehler "Privater Schlüssel braucht 0400 oder 0600"

brauch age
brauch pg_restore
brauch psql
brauch shasum
DATEI=${1:?Aufruf: test-wiederherstellung.sh <datei.dump.age>}
[[ "$DATEI" = /* && -f "$DATEI" && ! -L "$DATEI" ]] || fehler "Backup muss eine reguläre Datei sein"
DATEI_ORDNER=$(cd -P "$(dirname "$DATEI")" && pwd)
[[ "$DATEI_ORDNER" == "$BACKUP_ZIEL" ]] || fehler "Backup muss unmittelbar unter BACKUP_ZIEL liegen"
DATEI="$DATEI_ORDNER/$(basename "$DATEI")"
[[ "$DATEI" == *.dump.age ]] || fehler "Erwartet wird eine .dump.age-Datei"
MANIFEST="${DATEI}.sha256"
[[ -f "$MANIFEST" ]] || fehler "Prüfsummenmanifest fehlt"
ERWARTETE_PRUEFSUMME=$(awk -v datei="$(basename "$DATEI")" '$2 == datei { print $1 }' "$MANIFEST")
[[ "$ERWARTETE_PRUEFSUMME" =~ ^[0-9a-fA-F]{64}$ ]] || fehler "Prüfsummenmanifest ist ungültig"
[[ "$(sha256 "$DATEI")" == "$ERWARTETE_PRUEFSUMME" ]] || fehler "Prüfsumme stimmt nicht; Wiederherstellung abgebrochen"

# Vor dem destruktiven Restore wird das vollständige entschlüsselte Archiv
# gelesen. Direktes Streaming vermeidet FIFO-Ausgabeprobleme von age; mit
# pipefail schlägt auch ein vorzeitiger Leser/SIGPIPE zuverlässig fehl.
if ! age -d -i "$BACKUP_AGE_IDENTITAETSDATEI" "$DATEI" | pg_restore --file=/dev/null; then
  fehler "Entschlüsselung oder Archivprüfung ist fehlgeschlagen"
fi

# Der Zielname und localhost-Schutz verhindern den Einsatz gegen Produktion.
export PGHOST="$RESTORE_PGHOST"
export PGPORT="${RESTORE_PGPORT:-5432}"
export PGUSER="$RESTORE_PGUSER"
psql --set=ON_ERROR_STOP=1 --dbname="$RESTORE_DATABASE" --command='SELECT 1' >/dev/null
if ! age -d -i "$BACKUP_AGE_IDENTITAETSDATEI" "$DATEI" \
  | pg_restore --exit-on-error --single-transaction --clean --if-exists --no-owner --no-privileges --dbname="$RESTORE_DATABASE"; then
  fehler "Wiederherstellung fehlgeschlagen; die Testdatenbank wurde dank Einzeltransaktion nicht teilweise wiederhergestellt"
fi
psql --set=ON_ERROR_STOP=1 --dbname="$RESTORE_DATABASE" --command='SELECT current_database(), now()' >/dev/null
printf 'Wiederherstellungsprobe erfolgreich: %s nach %s\n' "$DATEI" "$RESTORE_DATABASE"
