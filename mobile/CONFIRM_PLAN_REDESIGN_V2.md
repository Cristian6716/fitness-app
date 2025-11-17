# Redesign Schermata Conferma Piano V2 - GRANULAR EDIT MODE ✅

## Panoramica

La schermata `ReviewImportedPlanScreen` è stata completamente ridisegnata con **Edit Mode Granulare**:

### 3 Modalità di Interazione

1. **Preview Mode** (default) - Visualizzazione pulita, sessioni collapsabili
2. **Edit Session Mode** - Modifica SOLO una singola sessione
3. **Edit Plan Info Mode** - Modifica SOLO info piano (nome, frequenza, durata)

### Differenza Chiave dalla V1

**V1** (vecchia): Edit globale → tutte le sessioni espanse e modificabili contemporaneamente
**V2** (nuova): Edit granulare → modifichi UNA cosa alla volta con focus completo

## Architettura File

### Nuovi Componenti Creati

#### Edit Views (`/mobile/src/components/plans/`)

1. **SessionEditView.tsx** ✨ NEW
   - Vista edit completa per singola sessione
   - Header con nome sessione modificabile + elimina
   - Lista esercizi completamente editabile
   - Footer con pattern Salva→Fine
   - Props: `hasUnsavedChanges` per gestire bottone

2. **PlanInfoEditView.tsx** ✨ NEW
   - Vista edit per info piano
   - Input: nome, frequenza, durata
   - Sessioni sotto greyed out (non modificabili)
   - Footer con pattern Salva→Fine
   - Info box per spiegare che sessioni non sono editabili qui

#### Componenti Aggiornati

3. **SessionAccordionItem.tsx** 🔄 UPDATED
   - Aggiunto prop `onEdit?: () => void`
   - Quando espansa, mostra header interno con bottone "✏️ Modifica"
   - Bottone discrete ma visibile, background primary light

4. **ReviewImportedPlanScreen.tsx** 🔄 COMPLETELY REFACTORED
   - 3 stati: `'preview' | 'edit-session' | 'edit-plan-info'`
   - Rendering condizionale basato su mode
   - Pattern Salva→Fine implementato
   - Footer "Conferma e Salva Piano" solo in preview

### File Non Utilizzati (dalla V1)

- ❌ `PlanEditCard.tsx` - Sostituito da PlanInfoEditView
- ❌ `SessionEditItem.tsx` - Sostituito da SessionEditView
- ✅ `PlanPreviewCard.tsx` - Ancora usato per preview
- ✅ `ExercisePreviewRow.tsx` - Ancora usato per preview
- ✅ `ExerciseEditRow.tsx` - Ancora usato per edit esercizi

## Funzionalità Implementate

### 1. Preview Mode (Stato Iniziale)

**Header:**
- "← Indietro" (left) → torna indietro
- "Anteprima Piano" (center)
- "✏️ Modifica Piano" (right) → Edit Plan Info Mode

**Body:**
- Card piano (solo lettura)
- Lista sessioni collapsabili
- Quando sessione espansa:
  - Header interno con nome + bottone "✏️ Modifica"
  - Lista esercizi sola lettura
  - Click su "Modifica" → Edit Session Mode

**Footer:**
- "Annulla" → conferma e torna indietro
- "Conferma e Salva Piano" → validazione + salvataggio + attivazione

### 2. Edit Session Mode

**Attivazione:**
- Click su "✏️ Modifica" dentro una sessione espansa

**Header:**
- "← Indietro" (left) → annulla modifiche, torna preview
- "Modifica Sessione" (center)
- Nessun bottone right (disabilitato durante edit)

**Body:**
- SessionEditView fullscreen
- Focus completo su quella sessione
- Nome sessione modificabile
- Lista esercizi con grid 4 colonne
- Bottone "+ Aggiungi Esercizio"
- Bottone elimina sessione (trash)

**Footer (dentro SessionEditView):**
- "Annulla" → conferma se modifiche non salvate, poi torna preview
- "Salva Modifica" (se `hasUnsavedChanges === true`)
  - Click → salva in memoria/backend draft
  - Bottone diventa "Fine"
  - `hasUnsavedChanges` → false
- "Fine" (se `hasUnsavedChanges === false`)
  - Click → torna a Preview Mode
  - Mantiene le modifiche salvate

**Pattern Salva→Fine:**
```
hasUnsavedChanges: true  → bottone "Salva Modifica" (verde)
      ↓ (click salva)
hasUnsavedChanges: false → bottone "Fine" (verde)
      ↓ (ulteriori modifiche)
hasUnsavedChanges: true  → bottone torna "Salva Modifica"
```

### 3. Edit Plan Info Mode

**Attivazione:**
- Click su "✏️ Modifica Piano" in header (preview mode)

**Header:**
- "← Indietro" (left) → annulla modifiche, torna preview
- "Modifica Info Piano" (center)
- Nessun bottone right

**Body:**
- PlanInfoEditView in alto
  - Input nome piano
  - Input frequenza e durata
  - Info box: "Sessioni sotto non modificabili qui"
- Sessioni sotto greyed out (opacity 0.5, non cliccabili)

**Footer (dentro PlanInfoEditView):**
- Stesso pattern Salva→Fine di Edit Session

### 4. Conferma Finale Piano

**Da Preview Mode:**
- Click su "Conferma e Salva Piano"
- Validazione completa piano
- Alert conferma: "Salvare e attivare piano?"
- Salvataggio backend + attivazione
- Archiviazione piani attivi precedenti
- Navigate to MainTabs
- Toast: "Piano salvato e attivato"

**Importante:**
- Questo è l'UNICO momento di attivazione
- Prima le modifiche sono solo draft/temporary

## State Management

```typescript
interface State {
  mode: 'preview' | 'edit-session' | 'edit-plan-info';
  planData: PlanData;
  originalPlanData: PlanData; // backup per annulla
  expandedSessions: Set<number>; // solo preview
  editingSessionIndex: number | null; // quale sessione in edit
  hasUnsavedChanges: boolean; // per pattern Salva→Fine
  isSaving: boolean; // loading finale
}
```

### Funzioni Chiave

**Mode management:**
- `enterEditSession(sessionIndex)` - entra edit mode sessione
- `enterEditPlanInfo()` - entra edit mode info piano
- `exitEditMode(save: boolean)` - esce da edit (salva o scarta)

**Edit operations:**
- `updatePlanField()` - aggiorna campo piano (marca unsaved)
- `updateSessionField()` - aggiorna campo sessione (marca unsaved)
- `updateExerciseField()` - aggiorna campo esercizio (marca unsaved)

**Salvataggio:**
- `saveCurrentEdit()` - salva modifiche parziali (draft)
  - TODO: `apiService.savePlanDraft(planData)`
  - Aggiorna `originalPlanData` al nuovo stato
  - `hasUnsavedChanges` → false
- `finishEditing()` - torna a preview mantenendo modifiche
- `confirmAndSavePlan()` - salvataggio finale + attivazione
  - Validazione completa
  - Alert conferma
  - `apiService.confirmWorkoutPlan(planData)` (già implementato)

## UX Flow Ideale

```
1. Utente importa piano
   → Vede Preview Mode

2. Espande "GIORNO 2 - LOWER"
   → Vede esercizi + bottone "Modifica"

3. Click "Modifica" su sessione
   → Edit Session Mode (focus su GIORNO 2)
   → Modifica secondi rest

4. Click "Salva Modifica"
   → Modifiche salvate (draft)
   → Bottone diventa "Fine"

5. Click "Fine"
   → Torna Preview Mode
   → GIORNO 2 collassato con modifiche salvate

6. Verifica piano
   → Tutto ok

7. Click "Conferma e Salva Piano"
   → Alert conferma
   → Piano salvato e attivato
   → Navigate to MainTabs
```

## Design Patterns Applicati

### 1. Granular Editing (NEW)
- Modifica una cosa alla volta
- Focus completo sulla singola area
- Riduce errori accidentali
- Migliora mental model utente

### 2. Pattern Salva→Fine (NEW)
- Indica chiaramente stato salvato vs non salvato
- Permette salvataggi incrementali
- "Fine" = conferma esplicita per uscire
- Riaprire bottone se nuove modifiche

### 3. Explicit Confirmation (ENHANCED)
- Draft saves vs Final activation
- Alert prima di attivare piano
- Messaggio chiaro su archiviazione altri piani

### 4. Visual Hierarchy
- Preview: colori neutri, focus contenuto
- Edit: bordi blu, campi evidenziati
- Greyed out: opacity 0.5 per disabled

### 5. Progressive Disclosure
- Accordion per gestire lunghezza
- Edit mode mostra solo ciò che serve
- Footer contestuale al mode

## API Integration

### Endpoint Richiesti

1. **Draft Save (TODO - non implementato)**
   ```typescript
   // apiService.savePlanDraft(planData: PlanData)
   // POST /api/plans/draft
   // Salva modifiche parziali senza attivare
   ```

2. **Final Activation (✅ già implementato)**
   ```typescript
   // apiService.confirmWorkoutPlan(planData: PlanData)
   // POST /api/workout-plans/confirm
   // Salva piano completo e attiva
   ```

### Comportamento Backend Atteso

**Draft Save:**
- Salva pianData temporaneamente
- Non attiva il piano
- Non archivia altri piani
- Ritorna success/error

**Confirm & Activate:**
- Salva plan_data completo
- Imposta come active
- Archivia altri piani attivi dell'utente
- Ritorna piano salvato con ID

## Testing Checklist

### Preview Mode
- [ ] Espandi sessione → mostra esercizi + bottone "Modifica"
- [ ] Collassa sessione → nasconde contenuto
- [ ] Click "Modifica Piano" → Edit Plan Info Mode
- [ ] Click "Conferma e Salva Piano" → validazione + conferma

### Edit Session Mode
- [ ] Entra in edit da sessione espansa
- [ ] Header mostra "Modifica Sessione"
- [ ] Modifiche fanno apparire "Salva Modifica"
- [ ] Click "Salva Modifica" → diventa "Fine"
- [ ] Ulteriori modifiche → torna "Salva Modifica"
- [ ] Click "Annulla" con modifiche → conferma scarto
- [ ] Click "Annulla" senza modifiche → torna preview
- [ ] Click "Fine" → torna preview mantenendo modifiche
- [ ] Aggiungi esercizio → funziona
- [ ] Elimina esercizio → conferma + funziona
- [ ] Elimina sessione → conferma + torna preview

### Edit Plan Info Mode
- [ ] Entra in edit da bottone header
- [ ] Header mostra "Modifica Info Piano"
- [ ] Modifiche nome/frequenza/durata funzionano
- [ ] Sessioni sotto sono greyed out
- [ ] Pattern Salva→Fine funziona
- [ ] Click "Fine" → torna preview con modifiche

### Final Confirmation
- [ ] Validazione: piano senza nome → errore
- [ ] Validazione: sessione senza esercizi → errore
- [ ] Alert conferma prima di salvare
- [ ] Loading durante salvataggio
- [ ] Successo → navigate to MainTabs
- [ ] Errore → mostra alert con messaggio

### Edge Cases
- [ ] Modifica poi elimina sessione → non crash
- [ ] Modifica poi annulla → ripristina originale
- [ ] Multiple sessioni modificate in sequenza → mantiene tutte
- [ ] Keyboard handling in input fields
- [ ] SafeArea su Android/iOS

## Metriche di Successo

**Rispetto alla V1:**
- ✅ Meno sovraffollamento visivo
- ✅ Focus più chiaro durante edit
- ✅ Meno rischio modifiche accidentali
- ✅ Mental model più chiaro (edit granulare)
- ✅ Pattern Salva→Fine riduce confusione

**Rispetto alle best practices:**
- ✅ Separazione visualizzazione/modifica (Hevy, Strong)
- ✅ Accordion per contenuto lungo (Freeletics)
- ✅ Azioni primarie visibili (tutte le app)
- ✅ Conferme per azioni distruttive (standard iOS/Android)

## File Structure

```
mobile/
├── src/
│   ├── components/
│   │   └── plans/
│   │       ├── PlanPreviewCard.tsx           ✅ USED
│   │       ├── PlanEditCard.tsx              ❌ NOT USED (V1)
│   │       ├── SessionAccordionItem.tsx      🔄 UPDATED (added onEdit)
│   │       ├── SessionEditItem.tsx           ❌ NOT USED (V1)
│   │       ├── SessionEditView.tsx           ✨ NEW (V2)
│   │       ├── PlanInfoEditView.tsx          ✨ NEW (V2)
│   │       ├── ExercisePreviewRow.tsx        ✅ USED
│   │       ├── ExerciseEditRow.tsx           ✅ USED
│   │       └── index.ts                      🔄 UPDATED (exports)
│   ├── screens/
│   │   └── plans/
│   │       └── ReviewImportedPlanScreen.tsx  🔄 REFACTORED (3 states)
│   ├── constants/
│   │   └── theme.ts                          ✅ USED
│   └── services/
│       └── api.service.ts                    ✅ USED + TODO (draft)
├── CONFIRM_PLAN_REDESIGN.md                  📄 V1 DOC
└── CONFIRM_PLAN_REDESIGN_V2.md               📄 THIS FILE
```

## Prossimi Step

### Immediate (Pre-Testing)
1. ✅ Verificare compilazione TypeScript
2. ✅ Verificare import/export corretti
3. ⏳ Test manuale su emulator/device

### Short-term (Post-Testing)
1. ⏳ Implementare `apiService.savePlanDraft()`
2. ⏳ Aggiungere loading state a "Salva Modifica"
3. ⏳ Testare keyboard behavior con scroll
4. ⏳ Ottimizzare animazioni accordion

### Nice-to-Have (Future)
1. Drag-to-reorder esercizi in edit mode
2. Undo/Redo per modifiche
3. Autosave ogni N secondi
4. Conflict resolution se draft outdated
5. Keyboard shortcuts (tab navigation)

## Conclusione

Il redesign V2 con **Edit Mode Granulare** migliora significativamente l'UX rispetto alla V1:

✅ **Focus chiaro** - modifichi una cosa alla volta
✅ **Mental model semplice** - preview → edit singolo → salva → fine
✅ **Meno errori** - impossibile modificare accidentalmente altre sessioni
✅ **Pattern chiaro** - Salva→Fine indica stato salvato
✅ **Explicit activation** - piano non attivo finché non confermi esplicitamente

**Status: ✅ Ready for Testing**

---

*Implementato seguendo le specifiche REDESIGN_SCHERMATA_CONFERMA_PIANO v2*
*Pattern ispirato da: Hevy (granular edit), Strong (confirmation), Freeletics (accordion)*
