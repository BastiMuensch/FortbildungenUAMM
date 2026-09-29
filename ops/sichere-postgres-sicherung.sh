#!/usr/bin/env bash
# Erzeugt ausschließlich eine verschlüsselte PostgreSQL-Sicherung.
# Benötigt: Docker Compose und age. Der private Entschlüsselungsschlüssel
# gehört nicht auf den Produktionsserver.
set -euo pipefail
umask 077

fehler() { printf '%s\n' "Fehler: $*" >&2; exit 1; }
brauch() { command -v "$1" >/dev/null 2>&1 || fehler "Programm fehlt: $1"; }
sha256() { shasum -a 256 "$1" | awk '{print $1}'; }

SCRIPT_ORDNER=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJEKT_ORDNER=$(cd "$SCRIPT_ORDNER/.." && pwd)
cd "$PROJEKT_ORDNER"

: "${BACKUP_ZIEL:?BACKUP_ZIEL muss ein absoluter, separat berechtigter Regierungslaufwerk-Pfad sein}"
: "${BACKUP_AGE_EMPFAENGERDATEI:?BACKUP_AGE_EMPFAENGERDATEI muss eine age-Empfängerdatei sein}"
[[ "$BACKUP_ZIEL" = /* ]] || fehler "BACKUP_ZIEL muss absolut sein"
[[ -f "$BACKUP_AGE_EMPFAENGERDATEI" && -r "$BACKUP_AGE_EMPFAENGERDATEI" ]] || fehler "Empfängerdatei nicht lesbar"
# GNU-stat und BSD-stat verwenden unterschiedliche Optionen. Ausgabe eines
# fehlgeschlagenen Versuchs verwerfen: GNU-stat kann dabei Dateisystemdaten liefern.
if ! DATEIRECHTE=$(stat -c '%a' "$BACKUP_AGE_EMPFAENGERDATEI" 2>/dev/null); then
  DATEIRECHTE=$(stat -f '%OLp' "$BACKUP_AGE_EMPFAENGERDATEI")
fi
[[ "$DATEIRECHTE" =~ ^(400|440|600|640)$ ]] || fehler "Empfängerdatei braucht restriktive Rechte (z. B. 0400)"

brauch docker
brauch age
brauch shasum
docker compose version >/dev/null
age -R "$BACKUP_AGE_EMPFAENGERDATEI" </dev/null >/dev/null 2>&1 || fehler "age-Empfängerdatei ist ungültig"

# Das Ziel wird niemals angelegt: Bei einem ausgefallenen Netzlaufwerk würde
# mkdir sonst unbemerkt eine lokale Ersatzablage auf dem Server erzeugen.
[[ -d "$BACKUP_ZIEL" && ! -L "$BACKUP_ZIEL" && -w "$BACKUP_ZIEL" ]] || fehler "Backup-Ziel fehlt, ist ein Symlink oder nicht beschreibbar"
[[ -f "$BACKUP_ZIEL/.fortbildungsportal-backup-ziel" ]] || fehler "Backup-Zielmarker fehlt; das freigegebene Laufwerk ist vermutlich nicht eingehängt"

SPERRPFAD="$BACKUP_ZIEL/.fortbildungsportal-backup.lock"
if ! mkdir "$SPERRPFAD" 2>/dev/null; then
  fehler "Eine Sicherung läuft bereits oder eine alte Sperre muss geprüft werden: $SPERRPFAD"
fi
AUFRAEUMEN() { rmdir "$SPERRPFAD" 2>/dev/null || true; }
trap AUFRAEUMEN EXIT HUP INT TERM

DB_DIENST=${BACKUP_DB_DIENST:-db}
DB_NAME=${BACKUP_DB_NAME:-fortbildungen_uamm}
DB_USER=${BACKUP_PGUSER:-fortbildungen}
ZEIT=$(date -u +%Y%m%dT%H%M%SZ)
DATEINAME="fortbildungsportal-${DB_NAME}-${ZEIT}.dump.age"
ZIELDATEI="$BACKUP_ZIEL/$DATEINAME"
MANIFEST="$BACKUP_ZIEL/${DATEINAME}.sha256"

[[ ! -e "$ZIELDATEI" && ! -e "$MANIFEST" ]] || fehler "Zieldatei existiert bereits"
ARBEIT=$(mktemp -d "$BACKUP_ZIEL/.fortbildungs-backup.XXXXXX") || fehler "Sicheres temporäres Verzeichnis im Backup-Ziel konnte nicht angelegt werden"
TEMPDAT="$ARBEIT/$DATEINAME"
TEMPMANIFEST="$ARBEIT/${DATEINAME}.sha256"
AUFRAEUMEN() { rm -rf "$ARBEIT"; rmdir "$SPERRPFAD" 2>/dev/null || true; }
trap AUFRAEUMEN EXIT HUP INT TERM

# Der unverschlüsselte Dump existiert nur als Pipeline zwischen pg_dump und age.
if ! docker compose exec -T "$DB_DIENST" pg_dump --format=custom --no-owner --no-privileges -U "$DB_USER" --dbname="$DB_NAME" \
  | age -R "$BACKUP_AGE_EMPFAENGERDATEI" -o "$TEMPDAT"; then
  fehler "Sicherung oder Verschlüsselung fehlgeschlagen; keine Sicherung veröffentlicht"
fi

[[ -s "$TEMPDAT" ]] || fehler "Verschlüsselte Sicherung ist leer"
printf '%s  %s\n' "$(sha256 "$TEMPDAT")" "$DATEINAME" > "$TEMPMANIFEST"
chmod 600 "$TEMPDAT" "$TEMPMANIFEST"
mv -n "$TEMPDAT" "$ZIELDATEI"
[[ ! -e "$TEMPDAT" && -f "$ZIELDATEI" ]] || fehler "Zieldatei wurde zwischenzeitlich belegt"
mv -n "$TEMPMANIFEST" "$MANIFEST"
[[ ! -e "$TEMPMANIFEST" && -f "$MANIFEST" ]] || { rm -f "$ZIELDATEI"; fehler "Prüfsummenmanifest wurde zwischenzeitlich belegt"; }

printf 'Sicherung erstellt: %s\nPrüfsumme: %s\n' "$ZIELDATEI" "$MANIFEST"
