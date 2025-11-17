# 🌐 Ngrok Tunnel Setup - Guida per iOS/Condivisione

Questa guida spiega come esporre il backend tramite ngrok per permettere a dispositivi iOS o ad amici di accedere all'API.

## 📋 Prerequisiti

- Account ngrok gratuito: https://dashboard.ngrok.com/signup
- Authtoken ngrok (ottienilo da: https://dashboard.ngrok.com/get-started/your-authtoken)

## 🚀 Setup Iniziale (Una Sola Volta)

### 1. Configura l'authtoken di ngrok

Apri il terminale ed esegui:

```bash
npx ngrok config add-authtoken TUO_TOKEN_QUI
```

Sostituisci `TUO_TOKEN_QUI` con il token dal dashboard ngrok.

## 🎯 Come Usare Ngrok

### Opzione 1: Avvia il server con ngrok (Consigliato)

```bash
npm run dev:ngrok
```

Questo comando:
- Avvia il server backend sulla porta 3000
- Crea automaticamente un tunnel ngrok
- Mostra l'URL pubblico nel terminale

**Output di esempio:**
```
=================================
✅ NGROK TUNNEL ACTIVE
=================================
Public URL: https://abc123.ngrok-free.app
Local URL:  http://localhost:3000
=================================

📱 MOBILE APP SETUP:
Update mobile/src/services/api.service.ts
Change API_BASE_URL to: 'https://abc123.ngrok-free.app/api'
=================================
```

### Opzione 2: Avvia il server normalmente (senza ngrok)

```bash
npm run dev
```

## 📱 Configurazione App Mobile

### Per il tuo iPhone o per condividere con un amico:

1. **Copia l'URL pubblico** mostrato nel terminale (es: `https://abc123.ngrok-free.app`)

2. **Modifica il file API service:**

   File: `mobile/src/services/api.service.ts`

   Cambia questa riga:
   ```typescript
   const API_BASE_URL = 'http://192.168.1.14:3000/api';
   ```

   Con:
   ```typescript
   const API_BASE_URL = 'https://abc123.ngrok-free.app/api';
   ```
   ⚠️ **IMPORTANTE**: Usa l'URL che vedi nel TUO terminale, non questo di esempio!

3. **Riavvia l'app mobile** su Expo

## 🔍 Verifica che Funzioni

Testa l'API con curl o nel browser:

```bash
# Sostituisci con il TUO URL ngrok
curl https://abc123.ngrok-free.app/health
```

Dovresti ricevere:
```json
{"status":"ok","timestamp":"2025-11-13T..."}
```

## ⚠️ Note Importanti

### Piano Gratuito Ngrok
- ✅ 1 tunnel simultaneo
- ✅ HTTPS automatico
- ✅ Regione EU (bassa latenza in Italia)
- ⚠️ URL cambia ad ogni restart (es: `abc123.ngrok-free.app` → `xyz456.ngrok-free.app`)
- ⚠️ Limite di 40 connessioni/minuto

### Quando Riavvii il Server
Se fermi e riavvii il server con ngrok, otterrai un **nuovo URL**. Dovrai:
1. Copiare il nuovo URL dal terminale
2. Aggiornare `API_BASE_URL` nell'app mobile
3. Riavviare l'app

### Piano Pro Ngrok (Opzionale)
Se vuoi un URL fisso tipo `fitness-app.ngrok.app` che non cambia mai:
1. Fai l'upgrade a ngrok Pro ($8/mese)
2. Configura un dominio statico
3. Non dovrai più cambiare l'URL nell'app

## 🛠️ Troubleshooting

### Errore: "tunnel session failed"
- Verifica che l'authtoken sia configurato correttamente
- Prova a riavviare ngrok

### L'app non si connette
- Verifica che l'URL nell'app sia corretto (con `/api` alla fine)
- Controlla che il server ngrok sia in esecuzione
- Prova ad aprire l'URL nel browser del telefono

### "ERR_NGROK_3200"
- Hai raggiunto il limite di richieste
- Aspetta un minuto o usa un nuovo tunnel

## 📞 Condividere con un Amico

Invia al tuo amico:
1. L'URL pubblico ngrok (es: `https://abc123.ngrok-free.app`)
2. Digli di modificare `API_BASE_URL` nella sua app
3. Fatto! Potrà usare il tuo backend

## 🔐 Sicurezza

⚠️ **ATTENZIONE**: Il tunnel ngrok espone il tuo backend a internet!

- Non condividere l'URL pubblicamente
- Usa solo con persone fidate
- Il tunnel ha autenticazione JWT, quindi serve il token per le richieste protette
- Considera di usare ngrok solo per testing, non per produzione

## 🎓 Link Utili

- Dashboard ngrok: https://dashboard.ngrok.com
- Documentazione: https://ngrok.com/docs
- Status page: https://status.ngrok.com

---

**Tip**: Tieni aperto il terminale con ngrok mentre testi l'app, così vedi tutte le richieste in tempo reale! 🚀
