# Ausführung nur auf Windows mit Administratorrechten, etwa im windows-latest-CI-Job.
# Die Prüfung erzeugt ausschließlich eine neue, GUID-gebundene lokale SMB-Freigabe.
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$Projekt = Split-Path -Parent $PSScriptRoot
$Werkzeug = Join-Path $Projekt 'ops/Uebernehme-Vollbackup.ps1'
$Kennung = [guid]::NewGuid().ToString('N')
$Freigabe = "FortbildungsportalVollbackupTest-$Kennung"
$Arbeitsordner = Join-Path ([IO.Path]::GetTempPath()) "fortbildungsportal-vollbackup-windows-test-$Kennung"
$DownloadOrdner = Join-Path ([IO.Path]::GetTempPath()) "fortbildungsportal-vollbackup-windows-download-$Kennung"
$Unc = "\\localhost\$Freigabe"
$Erstellt = $false

function Sicher-Entfernen {
    if ($Erstellt -and $Freigabe -match '^FortbildungsportalVollbackupTest-[0-9a-f]{32}$') {
        $Gefunden = Get-SmbShare -Name $Freigabe -ErrorAction SilentlyContinue
        if ($null -ne $Gefunden -and $Gefunden.Path -eq $Arbeitsordner) { Remove-SmbShare -Name $Freigabe -Force }
    }
    if ($Arbeitsordner -match 'fortbildungsportal-vollbackup-windows-test-[0-9a-f]{32}$' -and (Test-Path -LiteralPath $Arbeitsordner)) {
        Remove-Item -LiteralPath $Arbeitsordner -Recurse -Force
    }
    if ($DownloadOrdner -match 'fortbildungsportal-vollbackup-windows-download-[0-9a-f]{32}$' -and (Test-Path -LiteralPath $DownloadOrdner)) {
        Remove-Item -LiteralPath $DownloadOrdner -Recurse -Force
    }
}
function Fordere([bool] $Bedingung, [string] $Text) { if (-not $Bedingung) { throw "Prüfung fehlgeschlagen: $Text" } }
function BerlinerTag([int] $TageZurueck) {
    return [TimeZoneInfo]::ConvertTimeBySystemTimeZoneId([DateTime]::UtcNow, 'W. Europe Standard Time').Date.AddDays(-$TageZurueck).ToString('yyyy-MM-dd')
}
function Neuer-Dateiname([string] $Tag) { return "fortbildungsportal-vollbackup-$Tag-$([guid]::NewGuid().ToString()).zip.age" }
function Lege-VerwaltetesArchivAn([string] $Tag) {
    $Name = Neuer-Dateiname $Tag; $Pfad = Join-Path $Arbeitsordner $Name
    [IO.File]::WriteAllBytes($Pfad, [Text.Encoding]::UTF8.GetBytes("synthetisch-$Name"))
    $Hash = (Get-FileHash -LiteralPath $Pfad -Algorithm SHA256).Hash.ToLowerInvariant()
    $Quittung = [ordered]@{ format = 'fortbildungsportal-vollbackup-empfang-v1'; datei = $Name; sha256 = $Hash; uebernommenAm = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json -Compress
    [IO.File]::WriteAllText("$Pfad.empfang.json", $Quittung, [Text.UTF8Encoding]::new($false))
    return [pscustomobject]@{ Name = $Name; Pfad = $Pfad; Hash = $Hash }
}

try {
    $Prinzipal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
    $IstAdmin = $Prinzipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    Fordere $IstAdmin 'Administratorrechte für die isolierte SMB-Testfreigabe fehlen.'
    New-Item -ItemType Directory -Path $Arbeitsordner | Out-Null
    New-Item -ItemType Directory -Path $DownloadOrdner | Out-Null
    New-SmbShare -Name $Freigabe -Path $Arbeitsordner -FullAccess @('Administrators', $env:USERNAME) | Out-Null
    $Erstellt = $true
    $ShareInfo = Get-SmbShare -Name $Freigabe
    Fordere ($ShareInfo.Path -eq $Arbeitsordner -and $ShareInfo.Name -eq $Freigabe) 'Testfreigabe ist nicht eindeutig an das Testverzeichnis gebunden.'
    [IO.File]::WriteAllText((Join-Path $Arbeitsordner '.fortbildungsportal-vollbackup-ziel'), "test`n", [Text.UTF8Encoding]::new($false))

    # Ein heutiges, geprüftes Paket löst die Bereinigung aus.
    $Alt32 = Lege-VerwaltetesArchivAn (BerlinerTag 32)
    $Alt31 = Lege-VerwaltetesArchivAn (BerlinerTag 31)
    $Alt30 = Lege-VerwaltetesArchivAn (BerlinerTag 30)
    $Alt29 = Lege-VerwaltetesArchivAn (BerlinerTag 29)
    $QuelleName = Neuer-Dateiname (BerlinerTag 0); $Quelle = Join-Path $DownloadOrdner $QuelleName
    [IO.File]::WriteAllBytes($Quelle, [Text.Encoding]::UTF8.GetBytes('synthetisches-aktuelles-vollbackup'))
    $QuelleHash = (Get-FileHash -LiteralPath $Quelle -Algorithm SHA256).Hash
    & $Werkzeug -DownloadDatei $Quelle -ErwarteteSha256 $QuelleHash -Zielverzeichnis $Unc -Aufbewahrungstage 30 -Confirm:$false
    $ZielAktuell = Join-Path $Arbeitsordner $QuelleName
    Fordere (Test-Path -LiteralPath $ZielAktuell) 'Positive Übernahme hat das Archiv nicht angelegt.'
    Fordere (Test-Path -LiteralPath "$ZielAktuell.empfang.json") 'Positive Übernahme hat keine Quittung angelegt.'
    Fordere ((Get-FileHash -LiteralPath $ZielAktuell -Algorithm SHA256).Hash -eq $QuelleHash) 'Zielarchiv hat nicht den bestätigten Hash.'
    Fordere (-not (Test-Path -LiteralPath $Alt30.Pfad)) 'Ein 30 Tage altes Archiv wurde nicht bereinigt.'
    Fordere (Test-Path -LiteralPath $Alt29.Pfad) 'Ein 29 Tage altes Archiv wurde vorzeitig bereinigt.'
    Fordere (Test-Path -LiteralPath $ZielAktuell) 'Das aktuell übernommene Archiv wurde bereinigt.'

    # Ausfallschutz: Auch außerhalb der Frist bleiben insgesamt die zwei neuesten
    # verifizierten Archive, wenn der aktuelle Import das einzige neue Paket ist.
    Remove-Item -LiteralPath $ZielAktuell, "$ZielAktuell.empfang.json", $Alt29.Pfad, "$($Alt29.Pfad).empfang.json" -Force
    $Alt60 = Lege-VerwaltetesArchivAn (BerlinerTag 60)
    $Alt61 = Lege-VerwaltetesArchivAn (BerlinerTag 61)
    $Alt62 = Lege-VerwaltetesArchivAn (BerlinerTag 62)
    $AusfallQuelleName = Neuer-Dateiname (BerlinerTag 0); $AusfallQuelle = Join-Path $DownloadOrdner $AusfallQuelleName
    [IO.File]::WriteAllBytes($AusfallQuelle, [Text.Encoding]::UTF8.GetBytes('synthetisches-ausfallschutz-vollbackup'))
    $AusfallHash = (Get-FileHash -LiteralPath $AusfallQuelle -Algorithm SHA256).Hash
    & $Werkzeug -DownloadDatei $AusfallQuelle -ErwarteteSha256 $AusfallHash -Zielverzeichnis $Unc -Aufbewahrungstage 30 -Confirm:$false
    Fordere (Test-Path -LiteralPath $Alt60.Pfad) 'Das zweitneueste, aber 60 Tage alte verifizierte Archiv wurde nicht durch den Ausfallschutz erhalten.'
    Fordere (-not (Test-Path -LiteralPath $Alt61.Pfad)) 'Das drittneueste, 61 Tage alte Archiv wurde nicht bereinigt.'
    Fordere (-not (Test-Path -LiteralPath $Alt62.Pfad)) 'Das viertneueste, 62 Tage alte Archiv wurde nicht bereinigt.'

    $WhatIf = Join-Path $DownloadOrdner (Neuer-Dateiname (BerlinerTag 0)); [IO.File]::WriteAllBytes($WhatIf, [byte[]](1,2,3))
    $WhatIfHash = (Get-FileHash -LiteralPath $WhatIf -Algorithm SHA256).Hash
    $WhatIfAlt = Lege-VerwaltetesArchivAn (BerlinerTag 65)
    & $Werkzeug -DownloadDatei $WhatIf -ErwarteteSha256 $WhatIfHash -Zielverzeichnis $Unc -WhatIf
    Fordere (-not (Test-Path -LiteralPath (Join-Path $Arbeitsordner (Split-Path -Leaf $WhatIf)))) '-WhatIf hat eine Zielkopie angelegt.'
    Fordere (Test-Path -LiteralPath $WhatIfAlt.Pfad) '-WhatIf hat einen bestehenden Bereinigungskandidaten verändert.'

    $Fehler = $false; try { & $Werkzeug -DownloadDatei $WhatIf -ErwarteteSha256 ('0' * 64) -Zielverzeichnis $Unc -Confirm:$false } catch { $Fehler = $true }
    Fordere $Fehler 'Falscher Hash wurde akzeptiert.'
    $Fehler = $false; try { & $Werkzeug -DownloadDatei $WhatIf -ErwarteteSha256 $WhatIfHash -Zielverzeichnis $Arbeitsordner -Confirm:$false } catch { $Fehler = $true }
    Fordere $Fehler 'Lokaler Zielpfad wurde akzeptiert.'
    $Fehler = $false; try { & $Werkzeug -DownloadDatei $WhatIf -ErwarteteSha256 $WhatIfHash -Zielverzeichnis '\\?\C:\temp' -Confirm:$false } catch { $Fehler = $true }
    Fordere $Fehler 'Windows-Gerätepfad wurde akzeptiert.'
    $Unterziel = Join-Path $Arbeitsordner 'unterziel'; New-Item -ItemType Directory -Path $Unterziel | Out-Null
    $Verweis = Join-Path $Arbeitsordner 'verweis'; New-Item -ItemType Junction -Path $Verweis -Target $Unterziel | Out-Null
    $Fehler = $false; try { & $Werkzeug -DownloadDatei $WhatIf -ErwarteteSha256 $WhatIfHash -Zielverzeichnis "$Unc\verweis" -Confirm:$false } catch { $Fehler = $true }
    Fordere $Fehler 'Reparse-Point im Zielpfad wurde akzeptiert.'
    Write-Output 'Windows-Vollbackup-Prüfungen erfolgreich.'
} finally { Sicher-Entfernen }
