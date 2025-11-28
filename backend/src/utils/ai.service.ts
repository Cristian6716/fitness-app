import { GoogleGenerativeAI } from '@google/generative-ai';
import { GenerateWorkoutRequest, AIWorkoutPlan } from '../types/workout.types';

let genAI: GoogleGenerativeAI | null = null;

const getGeminiClient = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

export const generateWorkoutPlan = async (
  request: GenerateWorkoutRequest
): Promise<AIWorkoutPlan> => {
  // Build comprehensive prompt with all available data
  let userProfile = `
INFORMAZIONI PERSONALI:
- Età: ${request.age} anni
- Peso: ${request.weight} kg
- Altezza: ${request.height} cm
- Genere: ${request.gender === 'male' ? 'Maschio' : 'Femmina'}
- BMI: ${(request.weight / Math.pow(request.height / 100, 2)).toFixed(1)}

OBIETTIVO:
- Obiettivo principale: ${request.goal}`;

  if (request.goalDetails) {
    userProfile += `\n- Dettagli obiettivo: ${request.goalDetails}`;
  }

  userProfile += `\n\nFREQUENZA ALLENAMENTO:
- Giorni a settimana: ${request.daysPerWeek}`;

  if (request.sessionDuration) {
    userProfile += `\n- Durata sessione preferita: ${request.sessionDuration} minuti`;
  }

  if (request.scheduleNotes) {
    userProfile += `\n- Note sulla disponibilità: ${request.scheduleNotes}`;
  }

  userProfile += `\n\nATTREZZATURA DISPONIBILE:
- ${request.equipment.join(', ')}`;

  if (request.equipmentDetails) {
    userProfile += `\n- Dettagli attrezzatura: ${request.equipmentDetails}`;
  }

  if (request.experienceLevel) {
    userProfile += `\n\nESPERIENZA:
- Livello: ${request.experienceLevel}`;
    if (request.experienceDetails) {
      userProfile += `\n- Dettagli: ${request.experienceDetails}`;
    }
  }

  if (request.limitations) {
    userProfile += `\n\n⚠️ LIMITAZIONI FISICHE/INFORTUNI:
${request.limitations}`;
  }

  if (request.weakPoints) {
    userProfile += `\n\nPUNTI DEBOLI DA ENFATIZZARE:
${request.weakPoints}`;
  }

  if (request.cardioPreference) {
    userProfile += `\n\nPREFERENZE CARDIO:
- Tipo: ${request.cardioPreference}`;
    if (request.cardioDetails) {
      userProfile += `\n- Dettagli: ${request.cardioDetails}`;
    }
  }

  if (request.splitPreference) {
    userProfile += `\n\nPREFERENZA SPLIT:
- ${request.splitPreference}`;
  }

  if (request.currentWeights) {
    userProfile += `\n\nCARICHI ATTUALI:`;
    if (request.currentWeights.benchPress) {
      userProfile += `\n- Panca piana: ${request.currentWeights.benchPress} kg`;
    }
    if (request.currentWeights.squat) {
      userProfile += `\n- Squat: ${request.currentWeights.squat} kg`;
    }
    if (request.currentWeights.deadlift) {
      userProfile += `\n- Stacco: ${request.currentWeights.deadlift} kg`;
    }
    if (request.currentWeights.militaryPress) {
      userProfile += `\n- Military press: ${request.currentWeights.militaryPress} kg`;
    }
    if (request.currentWeights.pullUps) {
      userProfile += `\n- Trazioni: ${request.currentWeights.pullUps}`;
      if (request.currentWeights.pullUpsWeight) {
        userProfile += ` con ${request.currentWeights.pullUpsWeight} kg`;
      }
    }
    if (request.currentWeights.other) {
      userProfile += `\n- Altri: ${request.currentWeights.other}`;
    }
  }

  const systemPrompt = `Sei un personal trainer esperto italiano specializzato nella creazione di programmi di allenamento personalizzati. Crei piani dettagliati, scientificamente fondati e adattati alle esigenze individuali.

PRINCIPI FONDAMENTALI:
1. SICUREZZA PRIMA DI TUTTO: Se ci sono limitazioni fisiche, evita completamente gli esercizi che potrebbero aggravare il problema
2. PROGRESSIVE OVERLOAD: Struttura il programma per permettere progressi misurabili settimana dopo settimana
3. RECUPERO ADEGUATO: Bilancia volume e intensità per evitare sovrallenamento
4. SPECIFICITÀ: Allinea esercizi e metodologie all'obiettivo principale
5. INDIVIDUALIZZAZIONE: Adatta tutto al livello di esperienza, età e condizione fisica

GESTIONE CARICHI:
- Se l'utente HA fornito i carichi attuali: usa quelli come riferimento e suggerisci carichi specifici in kg per ogni esercizio
- Se l'utente NON HA carichi: metti targetWeight a null e aggiungi note dettagliate su come trovare il peso giusto (es: "Inizia con un peso che ti permette 8-10 reps pulite, lasciando 2-3 reps di margine. Prova 20-25kg per la prima settimana.")

PRINCIPIANTI:
- Se il livello è principiante o non specificato: includi note tecniche dettagliate su ogni esercizio
- Enfatizza la tecnica prima del peso
- Fornisci alternative più semplici quando necessario
- Spiega come capire quando è il momento di aumentare i pesos

DETTAGLI TECNICI:
- Per ogni esercizio, fornisci istruzioni tecniche precise, consigli sul sovraccarico progressivo e avvertenze fisiche.
- Sii professionale ma chiaro.

LIVELLI AVANZATI:
- Se intermedio/avanzato: usa tecniche avanzate (dropset, superset, rest-pause) quando appropriato
- Suggerisci range di reps e carichi più specifici
- Includi periodizzazione se il programma è lungo

CARDIO:
- Se richiesto, integra sessioni cardio nei giorni di riposo o dopo i pesi
- Specifica tipo, durata e intensità

RISPOSTA:
Rispondi SOLO con un oggetto JSON valido (NO markdown, NO code blocks) in ITALIANO.`;

  const prompt = `${userProfile}

Crea un programma di allenamento personalizzato di 8 settimane per questo utente.

IMPORTANTE:
- Usa SOLO l'attrezzatura disponibile
- Rispetta TUTTE le limitazioni fisiche se presenti
- Se ci sono punti deboli da enfatizzare, aggiungi volume extra per quei gruppi muscolari
- Se c'è una preferenza di split, rispettala; altrimenti scegli tu il migliore per l'obiettivo e frequenza
- Nomina gli esercizi in ITALIANO
- Struttura ${request.daysPerWeek} sessioni a settimana
- Ogni sessione deve avere 4-8 esercizi
- Fornisci sets, reps, rest e note dettagliate

Return ONLY a valid JSON object with this exact structure:
{
  "name": "Nome del programma in italiano",
  "durationWeeks": 8,
  "sessions": [
    {
      "name": "Nome sessione (es: 'Giorno 1 - Push')",
      "dayNumber": 1,
      "order": 1,
      "exercises": [
      "exercises": [
        {
          "name": "Nome esercizio in italiano",
          "targetSets": 3,
          "targetReps": "8-10",
          "targetWeight": null o numero in kg,
          "restSeconds": 90,
          "notes": "Note brevi",
          "technicalInstructions": "Spiegazione dettagliata su come eseguire l'esercizio correttamente (posizione, movimento, respirazione)",
          "progressiveOverloadTips": "Come aumentare l'intensità nel tempo (es: aumenta peso, riduci recupero)",
          "physicalCautions": "A cosa fare attenzione per evitare infortuni",
          "order": 1
        }
      ]
    }
  ]
}`;

  try {
    const genAI = getGeminiClient();

    // Try different model names in order of preference (based on 2024 Google documentation)
    const modelNames = [
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-1.5-flash',
      'gemini-1.5-flash-001',
      'gemini-1.5-pro',
      'gemini-1.5-pro-001',
      'gemini-pro',
    ];

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    let content: string | null = null;

    // Try each model until one works
    for (const name of modelNames) {
      try {
        console.log(`🔄 Trying Gemini model: ${name}`);
        const model = genAI.getGenerativeModel({
          model: name,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        });

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        content = response.text();

        if (content) {
          console.log(`✅ Successfully used Gemini model: ${name}`);
          break;
        }
      } catch (err: any) {
        console.log(`⚠️ Model ${name} failed: ${err.message}`);
        continue;
      }
    }

    if (!content) {
      throw new Error('No response from AI');
    }

    // Clean up the response - remove markdown code blocks if present
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Parse JSON response
    const workoutPlan: AIWorkoutPlan = JSON.parse(cleanedContent);

    // Validate the structure
    if (!workoutPlan.name || !workoutPlan.durationWeeks || !workoutPlan.sessions) {
      throw new Error('Invalid workout plan structure from AI');
    }

    return workoutPlan;
  } catch (error) {
    console.error('AI generation error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate workout plan: ${error.message}`);
    }
    throw new Error('Failed to generate workout plan');
  }
};
