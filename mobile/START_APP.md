# 🚀 Come Avviare l'App Mobile

## ✅ Setup Completato

L'implementazione della schermata Piano con grafici e statistiche è completa!

## 📋 Prerequisiti Installati

- ✅ `victory-native` - Libreria grafici moderna
- ✅ `react-native-reanimated` - Animazioni performanti
- ✅ `react-native-svg` - Rendering SVG
- ✅ `@shopify/react-native-skia` - Rendering GPU-accelerated
- ✅ `babel.config.js` - Configurato con plugin Reanimated

## 🎯 Avvio Dell'App

### 1️⃣ Pulisci Cache (IMPORTANTE - prima volta dopo installazione)

```bash
cd mobile

# Pulisci tutte le cache
rm -rf node_modules/.cache
rm -rf .expo

# Windows PowerShell
Remove-Item -Recurse -Force node_modules\.cache, .expo -ErrorAction SilentlyContinue

# Windows CMD
rd /s /q node_modules\.cache
rd /s /q .expo
```

### 2️⃣ Avvia Expo Dev Server

```bash
cd mobile
npx expo start --clear
```

**IMPORTANTE:** Usa `expo start` invece di `react-native start` perché stiamo usando Expo.

**Opzioni utili:**
- `--clear` - Pulisce cache Metro
- `--dev-client` - Se usi Expo Dev Client
- `--android` - Apre automaticamente Android
- `--ios` - Apre automaticamente iOS (solo Mac)

### 3️⃣ Avvia l'App (in un altro terminale)

**Android:**
```bash
cd mobile
npx expo run:android
```

**iOS (solo su Mac):**
```bash
cd mobile
npx expo run:ios
```

**Con Expo Go (alternativa rapida):**
1. Installa Expo Go sul telefono
2. Scansiona il QR code dal terminale
3. L'app si caricherà automaticamente

---

## 🎨 Cosa Vedrai

### Schermata Piano di Allenamento

Quando navighi su un piano vedrai:

1. **📝 Header Piano**
   - Nome del piano
   - Durata e frequenza
   - Badge stato (Attivo, AI Generated)

2. **📊 Grid KPI (2x2)**
   - 💪 Sessioni completate/totali
   - ⏱️ Durata media (minuti)
   - 📊 Volume totale settimanale (kg)
   - 🔥 Streak giorni consecutivi

3. **📈 Grafico Volume Settimanale**
   - Barre colorate per 4 settimane
   - Valori in kg sopra ogni barra
   - Evidenziazione settimana corrente

4. **📋 Sessioni Recenti**
   - Ultime 5 sessioni completate
   - Rating con stelle
   - Data relativa (Oggi, Ieri, X giorni fa)
   - Durata e volume

5. **🎯 Lista Sessioni di Allenamento**
   - Tutte le sessioni del piano
   - Bordo colorato sinistro (rotazione colori)
   - Numero esercizi
   - Navigazione a dettaglio sessione

---

## ⚠️ Risoluzione Problemi

### Errore "Reanimated not installed"

**Soluzione:**
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Errore "Unable to resolve module"

**Soluzione:**
```bash
cd mobile
watchman watch-del-all  # Se disponibile
rm -rf node_modules/.cache
rm -rf /tmp/metro-*
npx expo start --clear
```

### App non si aggiorna

**Soluzione:**
1. Chiudi completamente l'app
2. Stop Metro bundler (Ctrl+C)
3. Pulisci cache: `npx expo start --clear`
4. Rilancia l'app

### Grafico non appare

**Verifica:**
1. Backend in esecuzione? `http://192.168.1.14:3000`
2. Piano ha sessioni completate?
3. Controlla console per errori API
4. Prova pull-to-refresh nella schermata

---

## 🔧 Configurazione Backend

**URL Backend:** `http://192.168.1.14:3000/api`

**Endpoint Stats:** `GET /workouts/:id/stats?weeks=4`

**Per cambiare URL:**
Modifica `mobile/src/services/api.service.ts`:
```typescript
const API_BASE_URL = 'http://TUO_IP:3000/api';
```

---

## 📱 Test Flow Completo

1. **Login** con credenziali esistenti
2. **Naviga** a "Piani" dal tab bottom
3. **Seleziona** un piano attivo
4. **Osserva** statistiche e grafico
5. **Pull-to-refresh** per aggiornare dati
6. **Tap** su una sessione per iniziare allenamento

---

## 🎉 Feature Implementate

✅ API Stats integration
✅ Victory Native charts (GPU-accelerated)
✅ Pull-to-refresh
✅ Empty states handling
✅ Loading skeletons
✅ Error handling
✅ TypeScript type-safety
✅ Theme consistency
✅ Responsive layout

---

## 📚 File Modificati/Creati

### Nuovi Componenti:
- `src/components/stats/StatCard.tsx`
- `src/components/stats/WeeklyVolumeChart.tsx`
- `src/components/stats/StatusBadge.tsx`
- `src/components/stats/RecentSessionItem.tsx`
- `src/components/stats/index.ts`

### File Modificati:
- `src/screens/plans/PlanDetailsScreen.tsx` - Redesign completo
- `src/types/api.types.ts` - Tipi stats aggiunti
- `src/services/api.service.ts` - Metodo getPlanStats

### Configurazione:
- `babel.config.js` - Plugin Reanimated
- `package.json` - Dipendenze aggiunte

---

## 🐛 Debug

**Vedere log Metro:**
```bash
# Metro mostra errori JS in tempo reale
# Guarda il terminale dove hai lanciato expo start
```

**Vedere log dispositivo Android:**
```bash
adb logcat | grep -i "fitness"
```

**Vedere log dispositivo iOS:**
```bash
# In Xcode: Window > Devices and Simulators > View Device Logs
```

**React Native Debugger:**
```bash
# Shake device > Enable Remote JS Debugging
```

---

## 💡 Tips

- 🔄 **Usa pull-to-refresh** per ricaricare stats
- 📊 **Completa sessioni** per popolare il grafico
- 🎨 **Theme colors** sono in `src/constants/theme.ts`
- 🚀 **Hot reload** è attivo, le modifiche appariranno live
- 📱 **Shake device** per aprire dev menu

---

Buon test! 🎉
