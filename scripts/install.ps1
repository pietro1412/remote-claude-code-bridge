# ============================================================
#  RCCB Installer — Remote Claude Code Bridge
#  Installer automatico per Windows (PowerShell 5.1+)
#  Eseguire come Amministratore
# ============================================================

$ErrorActionPreference = "Stop"

$RCCB_DIR = "$env:USERPROFILE\remote-claude-code-bridge"
$REPO_URL = "https://github.com/pietro1412/remote-claude-code-bridge.git"
$MIN_NODE_VERSION = 20

function Log($msg)    { Write-Host "[OK]  $msg" -ForegroundColor Green }
function Warn($msg)   { Write-Host "[!!]  $msg" -ForegroundColor Yellow }
function Err($msg)    { Write-Host "[ERR] $msg" -ForegroundColor Red }
function Info($msg)   { Write-Host "[..]  $msg" -ForegroundColor Cyan }
function Header($msg) { Write-Host "`n=== $msg ===`n" -ForegroundColor Magenta }

# Verifica admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Warn "Per installare i prerequisiti serve eseguire come Amministratore."
    Warn "Clicca destro su PowerShell -> 'Esegui come amministratore'"
    $continue = Read-Host "Vuoi continuare comunque? (s/n)"
    if ($continue -ne "s") { exit 0 }
}

# Banner
Write-Host ""
Write-Host "  ____   ____ ____ ____  " -ForegroundColor Cyan
Write-Host " |  _ \ / ___/ ___| __ ) " -ForegroundColor Cyan
Write-Host " | |_) | |  | |   |  _ \ " -ForegroundColor Cyan
Write-Host " |  _ <| |__| |___| |_) |" -ForegroundColor Cyan
Write-Host " |_| \_\\____\____|____/ " -ForegroundColor Cyan
Write-Host ""
Write-Host "  Remote Claude Code Bridge - Installer Windows" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Questo script installera automaticamente:"
Write-Host "  - Node.js 20+ (via winget)"
Write-Host "  - Git (via winget)"
Write-Host "  - Visual Studio Build Tools (per node-pty)"
Write-Host "  - Claude Code CLI"
Write-Host "  - PM2 (process manager)"
Write-Host "  - Tailscale VPN (via winget)"
Write-Host "  - RCCB (clone, build, configurazione)"
Write-Host ""

$proceed = Read-Host "Vuoi procedere? (s/n)"
if ($proceed -ne "s") {
    Write-Host "Installazione annullata."
    exit 0
}

# ------ Verifica winget ------
Header "1/8 - Verifica package manager"

$hasWinget = Get-Command winget -ErrorAction SilentlyContinue
if (-not $hasWinget) {
    Err "winget non trovato. Installa 'App Installer' dal Microsoft Store."
    Err "https://apps.microsoft.com/detail/9NBLGGH4NNS1"
    exit 1
}
Log "winget disponibile"

# ------ Git ------
Header "2/8 - Git"

$hasGit = Get-Command git -ErrorAction SilentlyContinue
if ($hasGit) {
    Log "Git gia installato: $(git --version)"
} else {
    Info "Installazione Git..."
    winget install --id Git.Git -e --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Log "Git installato"
}

# ------ Node.js ------
Header "3/8 - Node.js 20+"

$hasNode = Get-Command node -ErrorAction SilentlyContinue
$needInstall = $true

if ($hasNode) {
    $nodeVer = (node -v) -replace 'v','' -split '\.' | Select-Object -First 1
    if ([int]$nodeVer -ge $MIN_NODE_VERSION) {
        Log "Node.js gia installato: $(node -v)"
        $needInstall = $false
    } else {
        Warn "Node.js v$nodeVer trovato, serve v20+. Aggiornamento..."
    }
}

if ($needInstall) {
    Info "Installazione Node.js 20..."
    winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Log "Node.js installato: $(node -v)"
}

# ------ Build Tools ------
Header "4/8 - Visual Studio Build Tools"

Info "Installazione Visual Studio Build Tools (per compilare node-pty)..."
Info "Questo potrebbe richiedere qualche minuto..."

try {
    # Installa via npm windows-build-tools come alternativa rapida
    npm install --global windows-build-tools 2>$null
    Log "Build tools installati via npm"
} catch {
    Warn "Installazione automatica build tools fallita."
    Warn "Se node-pty non compila, scarica manualmente:"
    Warn "https://visualstudio.microsoft.com/visual-cpp-build-tools/"
    Warn "e seleziona 'Desktop development with C++'"
}

# ------ Tailscale ------
Header "5/8 - Tailscale VPN"

$hasTailscale = Get-Command tailscale -ErrorAction SilentlyContinue
if ($hasTailscale) {
    Log "Tailscale gia installato"
} else {
    Info "Installazione Tailscale..."
    winget install --id Tailscale.Tailscale -e --accept-package-agreements --accept-source-agreements
    Log "Tailscale installato"
    Warn "Apri Tailscale dall'icona nel system tray e accedi col tuo account"
}

# ------ Claude Code ------
Header "6/8 - Claude Code CLI + PM2"

$hasClaude = Get-Command claude -ErrorAction SilentlyContinue
if ($hasClaude) {
    Log "Claude Code gia installato"
} else {
    Info "Installazione Claude Code..."
    npm install -g @anthropic-ai/claude-code
    Log "Claude Code installato"
}

$hasPM2 = Get-Command pm2 -ErrorAction SilentlyContinue
if ($hasPM2) {
    Log "PM2 gia installato"
} else {
    Info "Installazione PM2..."
    npm install -g pm2
    Log "PM2 installato"
}

# ------ Clone e Build RCCB ------
Header "7/8 - RCCB: clone, install, build"

if (Test-Path $RCCB_DIR) {
    Warn "Directory $RCCB_DIR gia esistente."
    $update = Read-Host "Vuoi aggiornare (git pull)? (s/n)"
    if ($update -eq "s") {
        Set-Location $RCCB_DIR
        git pull
    } else {
        Set-Location $RCCB_DIR
    }
} else {
    Info "Clonazione repository..."
    git clone $REPO_URL $RCCB_DIR
    Set-Location $RCCB_DIR
}

Info "Installazione dipendenze npm..."
npm install

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    (Get-Content ".env") -replace 'NODE_ENV=development','NODE_ENV=production' | Set-Content ".env"
    Log ".env creato (modalita produzione)"
} else {
    Log ".env gia esistente"
}

# Crea directory
New-Item -ItemType Directory -Force -Path "data","uploads","certs" | Out-Null

Info "Build del progetto..."
npm run build -w shared
npm run build -w server
npx vite build client
Log "Build completato"

Info "Esecuzione test..."
npm test -w server
Log "Test superati"

# ------ Avvio ------
Header "8/8 - Avvio server e generazione token"

Info "Avvio RCCB con PM2..."
pm2 delete rccb 2>$null
pm2 start npm --name "rccb" -- start
pm2 save

Info "Attesa avvio server (5 secondi)..."
Start-Sleep -Seconds 5

# Health check
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3443/api/health" -Method Get -ErrorAction Stop
    if ($health.status -eq "ok") {
        Log "Server avviato correttamente!"
    }
} catch {
    Warn "Il server potrebbe non essere ancora pronto. Controlla: pm2 logs rccb"
}

# Genera token
Info "Generazione token di accesso..."
try {
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:3443/api/auth/setup" -Method Post -ErrorAction Stop
    $accessToken = $tokenResponse.access_token

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  INSTALLAZIONE COMPLETATA!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Token di accesso:" -ForegroundColor White
    Write-Host "  $accessToken" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  SALVA QUESTO TOKEN! Ti serve per accedere da remoto." -ForegroundColor Yellow
    Write-Host ""

    # Salva token
    $accessToken | Out-File -FilePath "$RCCB_DIR\.access-token" -Encoding UTF8
    Log "Token salvato in $RCCB_DIR\.access-token"
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Log "Token gia generato in precedenza."
        Write-Host "  Se l'hai perso, controlla: $RCCB_DIR\.access-token"
    } else {
        Warn "Non e stato possibile generare il token automaticamente."
        Write-Host "  Esegui: Invoke-RestMethod -Uri 'http://localhost:3443/api/auth/setup' -Method Post"
    }
}

# Riepilogo
Write-Host ""
Write-Host "Riepilogo connessione:" -ForegroundColor White
Write-Host "  URL locale:    http://localhost:3443"

try {
    $tsIp = (tailscale ip -4 2>$null)
    if ($tsIp) {
        Write-Host "  URL Tailscale: http://${tsIp}:3443"
    }
} catch {}

Write-Host ""
Write-Host "Prossimi passi:" -ForegroundColor White
Write-Host "  1. Assicurati che Tailscale sia attivo (icona nel system tray)"
Write-Host "  2. Dal telefono (con Tailscale attivo), apri l'URL Tailscale"
Write-Host "  3. Inserisci il token di accesso e un nome dispositivo"
Write-Host "  4. Crea una sessione e inizia a usare Claude Code!"
Write-Host ""
Write-Host "Comandi utili:" -ForegroundColor White
Write-Host "  pm2 logs rccb      - Vedi i log in tempo reale"
Write-Host "  pm2 restart rccb   - Riavvia il server"
Write-Host "  pm2 status         - Stato del server"
Write-Host ""
