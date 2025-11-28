# Guida all'Accesso Remoto (Tunnel)

Questa guida spiega come permettere a un amico o a un dispositivo esterno di connettersi alla tua app mentre gira sul tuo computer locale, utilizzando un tunnel sicuro.

## 1. Avviare il Backend con il Tunnel

Invece del solito comando `npm run dev`, usa questo comando speciale che attiva anche il tunnel:

```bash
cd backend
npm run dev:tunnel
```

Quando il server parte, vedrai qualcosa di simile nel terminale:

```
=================================
✅ LOCALTUNNEL ACTIVE
=================================
Public URL: https://heavy-zebra-42.loca.lt
Local URL:  http://localhost:3000
=================================
```

**Copia l'URL Pubblico** (es. `https://heavy-zebra-42.loca.lt`). Questo URL cambia ogni volta che riavvii il server.

## 2. Configurare l'App Mobile

1.  Apri il file `mobile/src/config.ts`.
2.  Incolla l'URL che hai copiato al posto di quello locale.

Esempio:

```typescript
export const CONFIG = {
  // API_BASE_URL: 'http://192.168.1.14:3000/api',
  API_BASE_URL: 'https://heavy-zebra-42.loca.lt/api', // <--- INCOLLA QUI IL TUO URL
  TIMEOUT: 30000,
};
```

> **Nota:** Assicurati di aggiungere `/api` alla fine dell'URL se non c'è già.

## 3. Avviare l'App Mobile

Ora puoi avviare l'app mobile come al solito:

```bash
cd mobile
npx expo start
```

Il tuo amico può ora scaricare l'app "Expo Go" sul suo telefono e scansionare il QR code (se siete sulla stessa rete o se usi un tunnel anche per Expo), oppure puoi fargli installare una build di sviluppo.

**Attenzione:** Il servizio `localtunnel` a volte richiede di visitare l'URL nel browser e cliccare un pulsante per "continuare" la prima volta, per motivi di sicurezza. Se l'app non funziona, prova ad aprire l'URL del tunnel nel browser del telefono del tuo amico.
