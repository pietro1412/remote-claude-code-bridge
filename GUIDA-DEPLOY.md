# Guida Deploy — Remote Claude Code Bridge (RCCB)

Questa guida ti accompagna passo-passo nel deploy di RCCB sul tuo PC fisso, per accedere a Claude Code da remoto (smartphone, portatile).

---

## 1. Prerequisiti sul PC Fisso

### Software da installare

| Software | Versione | Come installare | Verifica |
|----------|----------|-----------------|----------|
| **Node.js** | 20+ | https://nodejs.org/en/download | `node -v` |
| **Git** | qualsiasi | https://git-scm.com/downloads | `git --version` |
| **Claude Code** | ultima | `npm install -g @anthropic-ai/claude-code` | `claude --version` |
| **PM2** | ultima | `npm install -g pm2` | `pm2 --version` |
| **Tailscale** | ultima | https://tailscale.com/download | `tailscale status` |

### Su Linux (Ubuntu/Debian) — installa tutto con:

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Build tools (necessari per node-pty)
sudo apt install -y build-essential python3

# Git
sudo apt install -y git

# PM2
sudo npm install -g pm2

# Claude Code
sudo npm install -g @anthropic-ai/claude-code

# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
```

### Su Windows:

1. Scarica e installa **Node.js 20+** da https://nodejs.org
2. Scarica e installa **Git** da https://git-scm.com/downloads
3. Apri un terminale (PowerShell) e esegui:
   ```powershell
   npm install -g @anthropic-ai/claude-code
   npm install -g pm2
   ```
4. Scarica e installa **Tailscale** da https://tailscale.com/download/windows
5. Installa **Visual Studio Build Tools** (necessario per node-pty):
   - Scarica da https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Seleziona "Desktop development with C++"

---

## 2. Configurare Tailscale

### Sul PC fisso:

```bash
# Avvia Tailscale e accedi col tuo account
sudo tailscale up

# Verifica che sia connesso
tailscale status

# Prendi nota del tuo hostname (es. "fisso-pietro")
tailscale status --json | jq -r '.Self.DNSName'
```

### Sul dispositivo remoto (smartphone/portatile):

1. Installa Tailscale (App Store / Google Play / https://tailscale.com/download)
2. Accedi con lo **stesso account** usato sul PC fisso
3. Verifica la connessione: dovresti vedere il PC fisso nella lista dei dispositivi

### Verifica connettività:

Dal portatile/smartphone, pinga il PC fisso:
```bash
ping fisso-pietro   # usa il nome Tailscale del tuo PC
```

---

## 3. Clonare e installare RCCB

### Sul PC fisso:

```bash
# Clona il repository
git clone https://github.com/pietro1412/remote-claude-code-bridge.git
cd remote-claude-code-bridge

# Installa dipendenze (node-pty verrà compilato per la tua piattaforma)
npm install

# Copia il file di configurazione
cp .env.example .env

# Builda il progetto
npm run build -w shared
npm run build -w server
npx vite build client
```

### Verifica che Claude Code funzioni:

```bash
# Deve aprirsi la CLI di Claude Code
claude

# Se non sei autenticato, segui le istruzioni per inserire la API key
# Poi esci con Ctrl+C
```

---

## 4. Configurazione

### Modifica il file `.env`:

```bash
nano .env   # o usa il tuo editor preferito
```

Contenuto consigliato per produzione:

```env
# Server
PORT=3443
NODE_ENV=production

# JWT (verrà auto-generato al primo avvio se vuoto)
JWT_SECRET=

# Tailscale (opzionale, il server lo rileva automaticamente)
TAILSCALE_HOSTNAME=fisso-pietro
TAILSCALE_CERT_DIR=./certs

# Database
DB_PATH=./data/rccb.db

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Upload foto
MAX_UPLOAD_SIZE_MB=10
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
```

### (Opzionale) Certificati HTTPS Tailscale:

```bash
# Genera certificati HTTPS firmati da Tailscale
# (Richiede che MagicDNS e HTTPS siano abilitati nella console Tailscale)
chmod +x scripts/tailscale-cert.sh
./scripts/tailscale-cert.sh
```

---

## 5. Primo avvio e generazione token

### Avvia il server:

```bash
# Avvio diretto (per test)
NODE_ENV=production npm start

# Oppure con PM2 (consigliato per produzione)
pm2 start npm --name "rccb" -- start
pm2 save
pm2 startup   # genera il comando per avvio automatico al boot
```

### Genera il token di accesso:

Dal PC fisso (o da qualsiasi dispositivo sulla rete Tailscale):

```bash
curl -X POST http://localhost:3443/api/auth/setup
```

Risposta:
```json
{
  "access_token": "a1b2c3d4e5f6...lunga-stringa-hex",
  "message": "Save this token securely. You will need it to log in from your devices."
}
```

**IMPORTANTE:** Salva questo token! Ti servirà per accedere da smartphone/portatile. Viene generato una sola volta.

---

## 6. Connessione dal dispositivo remoto

### Da smartphone (PWA):

1. Assicurati che Tailscale sia attivo sul telefono
2. Apri il browser e vai a: `http://NOME-TAILSCALE-PC:3443`
   - Esempio: `http://fisso-pietro:3443`
   - Oppure usa l'IP Tailscale: `http://100.x.x.x:3443`
3. Inserisci il **token di accesso** generato al punto 5
4. Inserisci un **nome dispositivo** (es. "iPhone Pietro")
5. Clicca "Accedi"

### Installare come app (PWA):

- **Android Chrome:** Menu (⋮) → "Aggiungi a schermata Home"
- **iOS Safari:** Condividi (↑) → "Aggiungi a Home"
- **Desktop Chrome:** Icona installa nella barra indirizzi

### Da portatile:

Stessa procedura: apri `http://NOME-TAILSCALE-PC:3443` nel browser.

---

## 7. Utilizzo quotidiano

### Creare una sessione Claude Code:

1. Clicca sul nome della sessione nella barra superiore (o "RCCB" se è la prima volta)
2. Clicca "+ Nuova Sessione"
3. Inserisci:
   - **Nome:** es. "fantacontratti"
   - **Directory:** il path del progetto sul PC fisso, es. `/home/pietro/fantacontratti`
4. Claude Code si avvia e l'output appare nel terminale

### Interazione:

- **Scrivi** nella barra input in basso e premi Invio
- **Voce:** premi il microfono per dettare (italiano di default)
- **Foto:** premi la fotocamera per inviare screenshot/foto
- **Approva/Rifiuta:** quando Claude chiede conferma, appaiono i pulsanti
- **Ctrl+C:** premi il pulsante quadrato giallo per interrompere

### Gestione sessioni:

- Puoi avere **più sessioni attive** contemporaneamente
- Clicca sul nome nella barra superiore per cambiare sessione
- "Termina" per chiudere una sessione

---

## 8. Manutenzione

### Aggiornare RCCB:

```bash
cd remote-claude-code-bridge
git pull
npm install
npm run build -w shared && npm run build -w server && npx vite build client
pm2 restart rccb
```

### Monitorare:

```bash
# Logs in tempo reale
pm2 logs rccb

# Stato del server
curl http://localhost:3443/api/health

# Stato PM2
pm2 status
```

### Backup:

```bash
# Il database è in ./data/rccb.db
# I file uploadati sono in ./uploads/
cp data/rccb.db data/rccb.db.backup
```

---

## 9. Troubleshooting

| Problema | Soluzione |
|----------|-----------|
| `node-pty` non si installa | Installa build tools: `sudo apt install build-essential python3` (Linux) o Visual Studio Build Tools (Windows) |
| Server non raggiungibile da remoto | Verifica che Tailscale sia attivo su entrambi i dispositivi: `tailscale status` |
| "Authentication required" | Il token JWT è scaduto (7 giorni). Rifai il login con il token di accesso originale |
| Claude Code non si avvia | Verifica che `claude` funzioni dal terminale del PC fisso |
| Upload foto fallisce | Controlla che la directory `./uploads/` esista e sia scrivibile |
| PM2 non riparte al boot | Esegui `pm2 startup` e copia il comando che ti suggerisce |
| Porta 3443 occupata | Cambia `PORT` nel `.env` oppure trova il processo: `lsof -i :3443` |

---

## 10. Architettura di rete

```
Smartphone (Tailscale)                PC Fisso (Tailscale)
┌──────────────┐                     ┌─────────────────────┐
│ Browser PWA  │                     │ RCCB Server (:3443) │
│ React + xterm│◄──── VPN ──────────►│ Express + Socket.io │
│ Socket.io    │   (WireGuard)       │ node-pty → claude   │
│ Speech/Camera│   (encrypted)       │ SQLite, JWT auth    │
└──────────────┘                     └─────────────────────┘

Nessuna porta esposta su internet.
Tutto il traffico passa dentro la VPN Tailscale (WireGuard).
```

---

## Quick Start (TL;DR)

```bash
# Sul PC fisso:
git clone https://github.com/pietro1412/remote-claude-code-bridge.git
cd remote-claude-code-bridge
npm install
cp .env.example .env
npm run build -w shared && npm run build -w server && npx vite build client
pm2 start npm --name "rccb" -- start
curl -X POST http://localhost:3443/api/auth/setup
# → Salva il token!

# Dal telefono (con Tailscale attivo):
# Apri http://NOME-PC-TAILSCALE:3443
# Inserisci il token → Sei dentro!
```
