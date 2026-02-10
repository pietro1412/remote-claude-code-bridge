# RCCB Development Status

## FASE 1: Server Core
- [x] 1.1 Setup progetto TypeScript monorepo
- [x] 1.2 Express con helmet, cors, rate-limit
- [x] 1.3 Modulo Tailscale: detect IP, bind, certificati HTTPS
- [x] 1.4 Database SQLite: schema sessioni, tokens, migrations
- [x] 1.5 Auth: generazione JWT, middleware Express + Socket.io
- [x] 1.6 PTY Manager: spawn Claude Code con node-pty
- [x] 1.7 Output Parser: detect stato Claude Code
- [x] 1.8 Socket.io server: tutti gli event handlers

## FASE 2: Client PWA
- [x] 2.1 Setup React + Vite + Tailwind
- [x] 2.2 AuthScreen: login con token
- [x] 2.3 Terminal component con xterm.js
- [x] 2.4 InputBar: testo + invio
- [x] 2.5 Socket.io client: connessione + reconnect automatico
- [x] 2.6 SessionList: lista, crea, resume, kill sessioni
- [x] 2.7 StatusBar: connessione, costo, sessione attiva
- [x] 2.8 Approve/Reject buttons con detection automatica prompt
- [x] 2.9 PhotoUpload: camera + gallery + preview + invio
- [x] 2.10 VoiceInput: Web Speech API con visualizzazione live

## FASE 3: Sicurezza e Robustezza
- [x] 3.1 Input sanitization completa (XSS, path traversal, control chars, base64 validation)
- [x] 3.2 Rate limiting granulare (login 5/15min, upload 10/min, socket 60/min, API 100/min)
- [x] 3.3 Reconnection handling (Socket.io auto-reconnect + buffer replay)
- [x] 3.4 Output buffering (buffer 1000 lines, replay on connect)
- [x] 3.5 Health check endpoint (sessions, memory, system metrics)
- [x] 3.6 Logging strutturato con pino (all critical operations)

## FASE 4: PWA e Polish
- [x] 4.1 Service Worker per caching assets
- [x] 4.2 manifest.json per installazione
- [x] 4.3 Notifiche browser quando Claude Code chiede input
- [x] 4.4 Responsive design (mobile-first, safe areas, touch-friendly)
- [x] 4.5 Dark mode / Light mode con persistenza
- [x] 4.6 Script setup.sh + start.sh + tailscale-cert.sh

## FASE 5: Testing e Deploy
- [x] 5.1 Test unitari server: sanitize (24), output-parser (10), jwt (5), rate-limiter (6)
- [x] 5.2 45 test totali, tutti passati
- [x] 5.3 Test sicurezza: auth bypass, injection, path traversal, rate limiting
- [x] 5.4 Dockerfile multi-stage + docker-compose.yml
- [x] 5.5 Docker compose con volumi per data, uploads, certs
