#!/bin/bash
set -e

# ============================================================
#  RCCB Installer — Remote Claude Code Bridge
#  Installer automatico per Linux (Ubuntu/Debian/Fedora/Arch)
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

RCCB_DIR="$HOME/remote-claude-code-bridge"
REPO_URL="https://github.com/pietro1412/remote-claude-code-bridge.git"
MIN_NODE_VERSION=20

log()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()   { echo -e "${YELLOW}[!!]${NC} $1"; }
err()    { echo -e "${RED}[ERR]${NC} $1"; }
info()   { echo -e "${BLUE}[..]${NC} $1"; }
header() { echo -e "\n${BOLD}${CYAN}=== $1 ===${NC}\n"; }

# ------ Detect package manager ------
detect_pkg_manager() {
  if command -v apt-get &>/dev/null; then
    PKG="apt"
  elif command -v dnf &>/dev/null; then
    PKG="dnf"
  elif command -v yum &>/dev/null; then
    PKG="yum"
  elif command -v pacman &>/dev/null; then
    PKG="pacman"
  else
    err "Package manager non riconosciuto. Installa i prerequisiti manualmente."
    exit 1
  fi
}

install_pkg() {
  case $PKG in
    apt)    sudo apt-get install -y "$@" ;;
    dnf)    sudo dnf install -y "$@" ;;
    yum)    sudo yum install -y "$@" ;;
    pacman) sudo pacman -S --noconfirm "$@" ;;
  esac
}

# ------ Banner ------
echo ""
echo -e "${BOLD}${CYAN}"
echo "  ____   ____ ____ ____  "
echo " |  _ \\ / ___/ ___| __ ) "
echo " | |_) | |  | |   |  _ \\ "
echo " |  _ <| |__| |___| |_) |"
echo " |_| \\_\\\\____\\____|____/ "
echo ""
echo -e "  Remote Claude Code Bridge — Installer${NC}"
echo ""
echo "  Questo script installerà automaticamente:"
echo "  - Node.js 20+"
echo "  - Build tools (gcc, make, python3)"
echo "  - Git"
echo "  - Claude Code CLI"
echo "  - PM2 (process manager)"
echo "  - Tailscale VPN"
echo "  - RCCB (clone, build, configurazione)"
echo ""
read -p "  Vuoi procedere? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "Installazione annullata."
  exit 0
fi

detect_pkg_manager
header "1/8 — Aggiornamento sistema"

case $PKG in
  apt)    sudo apt-get update -y ;;
  dnf)    sudo dnf check-update -y || true ;;
  yum)    sudo yum check-update -y || true ;;
  pacman) sudo pacman -Sy ;;
esac
log "Sistema aggiornato"

# ------ Build tools ------
header "2/8 — Build tools (gcc, make, python3)"

if command -v gcc &>/dev/null && command -v python3 &>/dev/null; then
  log "Build tools già installati"
else
  info "Installazione build tools..."
  case $PKG in
    apt)    install_pkg build-essential python3 ;;
    dnf)    install_pkg gcc gcc-c++ make python3 ;;
    yum)    install_pkg gcc gcc-c++ make python3 ;;
    pacman) install_pkg base-devel python ;;
  esac
  log "Build tools installati"
fi

# ------ Git ------
header "3/8 — Git"

if command -v git &>/dev/null; then
  log "Git già installato: $(git --version)"
else
  info "Installazione Git..."
  install_pkg git
  log "Git installato"
fi

# ------ Node.js ------
header "4/8 — Node.js 20+"

install_node() {
  info "Installazione Node.js 20..."
  if [ "$PKG" = "apt" ]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif [ "$PKG" = "dnf" ] || [ "$PKG" = "yum" ]; then
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    install_pkg nodejs
  elif [ "$PKG" = "pacman" ]; then
    install_pkg nodejs npm
  fi
}

if command -v node &>/dev/null; then
  CURRENT_NODE=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$CURRENT_NODE" -ge "$MIN_NODE_VERSION" ]; then
    log "Node.js già installato: $(node -v)"
  else
    warn "Node.js $(node -v) trovato, ma serve v20+."
    install_node
    log "Node.js aggiornato: $(node -v)"
  fi
else
  install_node
  log "Node.js installato: $(node -v)"
fi

# ------ Tailscale ------
header "5/8 — Tailscale VPN"

if command -v tailscale &>/dev/null; then
  log "Tailscale già installato"
else
  info "Installazione Tailscale..."
  curl -fsSL https://tailscale.com/install.sh | sh
  log "Tailscale installato"
fi

# Verifica connessione
if tailscale status &>/dev/null; then
  TS_IP=$(tailscale ip -4 2>/dev/null || echo "")
  if [ -n "$TS_IP" ]; then
    log "Tailscale connesso — IP: $TS_IP"
  else
    warn "Tailscale installato ma non connesso."
    echo "  Esegui: sudo tailscale up"
  fi
else
  warn "Tailscale installato ma non attivo."
  echo "  Esegui: sudo tailscale up"
fi

# ------ Claude Code ------
header "6/8 — Claude Code CLI"

if command -v claude &>/dev/null; then
  log "Claude Code già installato"
else
  info "Installazione Claude Code..."
  sudo npm install -g @anthropic-ai/claude-code
  log "Claude Code installato"
fi

# ------ PM2 ------
if command -v pm2 &>/dev/null; then
  log "PM2 già installato"
else
  info "Installazione PM2..."
  sudo npm install -g pm2
  log "PM2 installato"
fi

# ------ Clone e build RCCB ------
header "7/8 — RCCB: clone, install, build"

if [ -d "$RCCB_DIR" ]; then
  warn "Directory $RCCB_DIR già esistente."
  read -p "  Vuoi aggiornare (pull)? (s/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Ss]$ ]]; then
    cd "$RCCB_DIR"
    git pull
  else
    cd "$RCCB_DIR"
  fi
else
  info "Clonazione repository..."
  git clone "$REPO_URL" "$RCCB_DIR"
  cd "$RCCB_DIR"
fi

info "Installazione dipendenze npm..."
npm install

info "Creazione file .env..."
if [ ! -f .env ]; then
  cp .env.example .env
  # Imposta produzione
  sed -i 's/NODE_ENV=development/NODE_ENV=production/' .env
  log ".env creato (modalità produzione)"
else
  log ".env già esistente, non sovrascritto"
fi

info "Creazione directory dati..."
mkdir -p data uploads certs

info "Build del progetto..."
npm run build -w shared
npm run build -w server
npx vite build client
log "Build completato"

info "Esecuzione test..."
npm test -w server
log "Test superati"

# ------ Avvio e setup ------
header "8/8 — Avvio server e generazione token"

info "Avvio RCCB con PM2..."
pm2 delete rccb 2>/dev/null || true
cd "$RCCB_DIR"
pm2 start npm --name "rccb" -- start
pm2 save

# Attendi che il server sia pronto
info "Attesa avvio server..."
sleep 3

# Health check
HEALTH=$(curl -s http://localhost:3443/api/health 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  log "Server avviato correttamente!"
else
  warn "Il server potrebbe non essere ancora pronto. Controlla: pm2 logs rccb"
fi

# Genera token
info "Generazione token di accesso..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3443/api/auth/setup 2>/dev/null || echo "")

if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
  ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

  echo ""
  echo -e "${BOLD}${GREEN}============================================${NC}"
  echo -e "${BOLD}${GREEN}  INSTALLAZIONE COMPLETATA!${NC}"
  echo -e "${BOLD}${GREEN}============================================${NC}"
  echo ""
  echo -e "  ${BOLD}Token di accesso:${NC}"
  echo -e "  ${CYAN}${ACCESS_TOKEN}${NC}"
  echo ""
  echo -e "  ${YELLOW}SALVA QUESTO TOKEN! Ti serve per accedere da remoto.${NC}"
  echo ""

  # Salva token in un file locale
  echo "$ACCESS_TOKEN" > "$RCCB_DIR/.access-token"
  chmod 600 "$RCCB_DIR/.access-token"
  log "Token salvato anche in $RCCB_DIR/.access-token"
else
  if echo "$TOKEN_RESPONSE" | grep -q "already completed"; then
    log "Token già generato in precedenza."
    echo "  Se l'hai perso, controlla: $RCCB_DIR/.access-token"
  else
    warn "Non è stato possibile generare il token automaticamente."
    echo "  Esegui manualmente: curl -X POST http://localhost:3443/api/auth/setup"
  fi
fi

# Configura PM2 per avvio al boot
info "Configurazione avvio automatico al boot..."
pm2 startup 2>/dev/null | tail -1 | grep "sudo" | bash 2>/dev/null || true
pm2 save

# Riepilogo
TS_IP=$(tailscale ip -4 2>/dev/null || echo "N/D")
TS_HOST=$(tailscale status --json 2>/dev/null | grep -o '"DNSName":"[^"]*"' | head -1 | cut -d'"' -f4 | sed 's/\.$//' || echo "N/D")

echo ""
echo -e "${BOLD}Riepilogo connessione:${NC}"
echo -e "  URL locale:    http://localhost:3443"
echo -e "  URL Tailscale: http://${TS_IP}:3443"
if [ "$TS_HOST" != "N/D" ] && [ -n "$TS_HOST" ]; then
  echo -e "  URL hostname:  http://${TS_HOST}:3443"
fi
echo ""
echo -e "${BOLD}Prossimi passi:${NC}"
echo "  1. Assicurati che Tailscale sia attivo: sudo tailscale up"
echo "  2. Dal telefono (con Tailscale attivo), apri: http://${TS_IP}:3443"
echo "  3. Inserisci il token di accesso e un nome dispositivo"
echo "  4. Crea una sessione e inizia a usare Claude Code!"
echo ""
echo -e "${BOLD}Comandi utili:${NC}"
echo "  pm2 logs rccb      — Vedi i log in tempo reale"
echo "  pm2 restart rccb   — Riavvia il server"
echo "  pm2 status         — Stato del server"
echo ""
