[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'Medium')]
param(
    [Parameter(Mandatory)] [ValidateNotNullOrEmpty()] [string] $DownloadDatei,
    [Parameter(Mandatory)] [ValidatePattern('^[A-Fa-f0-9]{64}$')] [string] $ErwarteteSha256,
    [Parameter(Mandatory)] [ValidateNotNullOrEmpty()] [string] $Zielverzeichnis,
    [ValidateRange(7, 90)] [int] $Aufbewahrungstage = 30,
    [switch] $KeineBereinigung
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$DateinameMuster = '^fortbildungsportal-vollbackup-([0-9]{4}-[0-9]{2}-[0-9]{2})-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.zip\.age$'
$Marker = '.fortbildungsportal-vollbackup-ziel'
function Abbruch([string] $Text) { throw "Vollbackup-Übernahme abgebrochen: $Text" }
function Ist-ReparsePoint([System.IO.FileSystemInfo] $Eintrag) { return (($Eintrag.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) }
function Lies-Hash([string] $Pfad) { return (Get-FileHash -LiteralPath $Pfad -Algorithm SHA256).Hash.ToLowerInvariant() }
function Pruefe-Datei([string] $Pfad, [string] $Bezeichnung) {
    if (-not (Test-Path -LiteralPath $Pfad -PathType Leaf)) { Abbruch "$Bezeichnung fehlt oder ist keine reguläre Datei." }
    $Eintrag = Get-Item -LiteralPath $Pfad -Force
    if (Ist-ReparsePoint $Eintrag) { Abbruch "$Bezeichnung darf kein Reparse-Point sein." }
    return $Eintrag
}
function Pruefe-VerzeichnisPfad([string] $Pfad) {
    $Eintrag = Get-Item -LiteralPath $Pfad -Force
    while ($null -ne $Eintrag) {
        if (Ist-ReparsePoint $Eintrag) { Abbruch 'Netzwerkziel oder ein Vorfahr darf kein Reparse-Point sein.' }
        $Eintrag = $Eintrag.Parent
    }
}
function Pruefe-Netzwerkziel([string] $Pfad) {
    # Nur UNC-Serverfreigaben, keine Win32-Gerätepfade wie \\?\ oder \\.\.
    if ($pfad -match '(?i)^\\\\[^\\?.]+\\[^\\]+(?:\\.*)?$') { return }
    $wurzel = [IO.Path]::GetPathRoot($pfad)
    if ($wurzel -notmatch '^[A-Za-z]:\\$') { Abbruch 'Ziel muss ein UNC-Pfad oder ein zugeordnetes Netzlaufwerk sein.' }
    $kennung = $wurzel.TrimEnd('\\')
    $laufwerk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='$kennung'" -ErrorAction Stop
    if ($null -eq $laufwerk -or $laufwerk.DriveType -ne 4) { Abbruch 'Das angegebene Laufwerk ist kein verifiziertes Netzlaufwerk.' }
}

$Quelle = Pruefe-Datei $DownloadDatei 'Download-Datei'
if ($Quelle.Name -notmatch $DateinameMuster) { Abbruch 'Der Dateiname entspricht keinem Vollbackup-Download des Portals.' }
$QuellenTag = [DateTime]::ParseExact($Matches[1], 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None).Date
$ErwarteteSha256 = $ErwarteteSha256.ToLowerInvariant()
if ((Lies-Hash $Quelle.FullName) -ne $ErwarteteSha256) { Abbruch 'Die SHA-256-Prüfsumme des Downloads stimmt nicht mit dem Portalwert überein.' }
Pruefe-Netzwerkziel $Zielverzeichnis
if (-not (Test-Path -LiteralPath $Zielverzeichnis -PathType Container)) { Abbruch 'Das ausdrücklich angegebene Netzwerkziel existiert nicht.' }
Pruefe-VerzeichnisPfad $Zielverzeichnis
$Ziel = Get-Item -LiteralPath $Zielverzeichnis -Force
$MarkerPfad = Join-Path $Ziel.FullName $Marker
Pruefe-Datei $MarkerPfad 'Zielmarker' | Out-Null
$ZielDatei = Join-Path $Ziel.FullName $Quelle.Name
$Quittung = "$ZielDatei.empfang.json"
if ((Test-Path -LiteralPath $ZielDatei) -or (Test-Path -LiteralPath $Quittung)) { Abbruch 'Ein Backup oder eine Quittung mit diesem Namen existiert bereits; Überschreiben ist ausgeschlossen.' }

$UebernahmeErfolgreich = $false
if ($PSCmdlet.ShouldProcess($ZielDatei, 'geprüften Vollbackup-Download atomar übernehmen')) {
    $Temporar = Join-Path $Ziel.FullName ('.' + $Quelle.Name + '.' + [guid]::NewGuid().ToString('N') + '.teil')
    try {
        Copy-Item -LiteralPath $Quelle.FullName -Destination $Temporar -ErrorAction Stop
        Pruefe-Datei $Temporar 'temporäre Zielkopie' | Out-Null
        if ((Lies-Hash $Temporar) -ne $ErwarteteSha256) { Abbruch 'Die Prüfsumme der Zielkopie stimmt nicht; nichts wurde veröffentlicht.' }
        [IO.File]::Move($Temporar, $ZielDatei)
        if ((Lies-Hash $ZielDatei) -ne $ErwarteteSha256) { Abbruch 'Die Prüfsumme nach dem Umbenennen stimmt nicht.' }
        $Empfang = [ordered]@{ format = 'fortbildungsportal-vollbackup-empfang-v1'; datei = $Quelle.Name; sha256 = $ErwarteteSha256; uebernommenAm = [DateTime]::UtcNow.ToString('o') }
        $QuittungTemp = "$Quittung.$([guid]::NewGuid().ToString('N')).teil"
        [IO.File]::WriteAllText($QuittungTemp, ($Empfang | ConvertTo-Json -Compress), [Text.UTF8Encoding]::new($false))
        [IO.File]::Move($QuittungTemp, $Quittung)
        $UebernahmeErfolgreich = $true
    } finally { if (Test-Path -LiteralPath $Temporar) { Remove-Item -LiteralPath $Temporar -Force -ErrorAction SilentlyContinue } }
}

# Ein abgelehntes -WhatIf/-Confirm darf nie eine vom Kopieren unabhängige Bereinigung auslösen.
if ($UebernahmeErfolgreich -and -not $KeineBereinigung) {
    $HeuteBerlin = [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'W. Europe Standard Time').Date
    # Bei 30 Tagen bleiben heute und die 29 vorangehenden Berliner Kalendertage erhalten.
    $GrenzTag = $HeuteBerlin.AddDays(-($Aufbewahrungstage - 1))
    $Verifizierte = @([pscustomobject]@{ Archiv = $ZielDatei; Quittung = $Quittung; ServerTag = $QuellenTag })
    foreach ($QuittungsDatei in Get-ChildItem -LiteralPath $Ziel.FullName -File -Force -Filter '*.zip.age.empfang.json') {
        if (Ist-ReparsePoint $QuittungsDatei) { continue }
        $Name = $QuittungsDatei.Name -replace '\.empfang\.json$', ''
        if ($Name -notmatch $DateinameMuster -or $Name -eq $Quelle.Name) { continue }
        try { $ServerTag = [DateTime]::ParseExact($Matches[1], 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::None).Date } catch { continue }
        $Archiv = Join-Path $Ziel.FullName $Name
        try {
            $Inhalt = Get-Content -LiteralPath $QuittungsDatei.FullName -Raw | ConvertFrom-Json
            if ($Inhalt.format -ne 'fortbildungsportal-vollbackup-empfang-v1' -or $Inhalt.datei -ne $Name -or $Inhalt.sha256 -notmatch '^[a-fA-F0-9]{64}$') { continue }
            Pruefe-Datei $Archiv 'verwaltetes Archiv' | Out-Null
            if ((Lies-Hash $Archiv) -ne $Inhalt.sha256.ToLowerInvariant()) { continue }
            $Verifizierte += [pscustomobject]@{ Archiv = $Archiv; Quittung = $QuittungsDatei.FullName; ServerTag = $ServerTag }
        } catch { continue }
    }
    $Behalten = @($Verifizierte | Sort-Object ServerTag -Descending | Select-Object -First 2)
    foreach ($Alt in $Verifizierte | Where-Object { $_.ServerTag -lt $GrenzTag -and $_.Archiv -notin $Behalten.Archiv -and $_.Archiv -ne $ZielDatei }) {
        if ($PSCmdlet.ShouldProcess($Alt.Archiv, 'abgelaufenes, verifiziertes Vollbackup samt Quittung entfernen')) {
            Remove-Item -LiteralPath $Alt.Archiv -Force
            Remove-Item -LiteralPath $Alt.Quittung -Force
        }
    }
}
if ($UebernahmeErfolgreich) { Write-Output "Übernahme bestätigt. SHA-256 zum Eintragen im Portal: $ErwarteteSha256" }
