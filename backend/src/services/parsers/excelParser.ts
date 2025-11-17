import * as XLSX from 'xlsx';
import { ParsedWorkout, ParsedSession, ParsedExercise, ParserResult } from '../../types/parsed-workout.types';

/**
 * Parse Excel workout files
 */
export class ExcelParser {
  /**
   * Parse an Excel buffer to extract workout data
   */
  async parse(buffer: Buffer): Promise<ParserResult> {
    try {
      console.log('=== EXCEL PARSER START ===');
      console.log('📊 Buffer size:', buffer.length, 'bytes');

      console.log('📊 Reading Excel workbook...');
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      console.log('📊 Workbook read successfully');
      console.log('📊 Sheet names:', workbook.SheetNames);
      console.log('📊 Number of sheets:', workbook.SheetNames.length);

      if (workbook.SheetNames.length === 0) {
        console.log('❌ No sheets found in Excel file');
        return {
          success: false,
          error: 'Il file Excel non contiene fogli',
        };
      }

      // Try to parse first sheet
      const firstSheetName = workbook.SheetNames[0];
      console.log('📊 Parsing first sheet:', firstSheetName);
      const worksheet = workbook.Sheets[firstSheetName];

      console.log('📊 Starting workout extraction from sheet...');
      const workout = this.extractWorkoutFromSheet(worksheet, firstSheetName);

      console.log('📊 Workout extraction complete');
      console.log('📊 Workout name:', workout.name);
      console.log('📊 Sessions found:', workout.sessions.length);

      if (workout.sessions.length === 0) {
        console.log('❌ No sessions found in Excel');
        return {
          success: false,
          error: 'Nessuna sessione di allenamento trovata nel file Excel',
        };
      }

      // Log details of parsed sessions
      workout.sessions.forEach((session, idx) => {
        console.log(`📊 Session ${idx + 1}:`, session.name);
        console.log(`📊   - Exercises: ${session.exercises.length}`);
        if (session.exercises.length > 0) {
          console.log(`📊   - First exercise:`, session.exercises[0]);
        }
      });

      console.log('📊 Generating warnings...');
      const warnings = this.generateWarnings(workout);
      console.log('📊 Warnings:', warnings);

      console.log('=== EXCEL PARSER END (SUCCESS) ===');
      return {
        success: true,
        data: workout,
        warnings,
      };
    } catch (error: any) {
      console.error('=== EXCEL PARSER ERROR ===');
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Full error:', error);
      console.error('=========================');

      return {
        success: false,
        error: `Errore durante la lettura del file Excel: ${error.message}`,
      };
    }
  }

  /**
   * Extract workout from Excel sheet
   */
  private extractWorkoutFromSheet(worksheet: XLSX.WorkSheet, sheetName: string): ParsedWorkout {
    console.log('📊 Converting sheet to JSON...');
    // Convert sheet to JSON (array of arrays)
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('📊 Sheet data rows:', data.length);
    if (data.length > 0) {
      console.log('📊 First row:', data[0]);
      console.log('📊 Second row:', data[1]);
    }

    if (data.length === 0) {
      console.log('❌ Sheet is empty');
      return {
        name: sheetName,
        sessions: [],
      };
    }

    // Extract workout name (try first few rows)
    console.log('📊 Extracting workout name...');
    const workoutName = this.extractWorkoutName(data, sheetName);
    console.log('📊 Workout name:', workoutName);

    // Try to detect if this is a structured table (with headers) or free-form
    console.log('📊 Detecting sheet structure...');
    const hasHeaders = this.detectHeaders(data);
    console.log('📊 Has headers:', hasHeaders);

    let sessions: ParsedSession[];
    if (hasHeaders) {
      console.log('📊 Parsing as structured sheet...');
      sessions = this.parseStructuredSheet(data);
    } else {
      console.log('📊 Parsing as free-form sheet...');
      sessions = this.parseFreeFormSheet(data);
    }

    console.log('📊 Parsed sessions:', sessions.length);

    return {
      name: workoutName,
      frequency: sessions.length, // Number of training sessions per week
      sessions,
    };
  }

  /**
   * Extract workout name from first rows
   */
  private extractWorkoutName(data: any[][], fallback: string): string {
    // Look in first 3 rows for a title
    for (let i = 0; i < Math.min(3, data.length); i++) {
      const row = data[i];
      if (row && row.length > 0 && row[0]) {
        const cell = String(row[0]).trim();
        if (cell.length > 5 && cell.length < 100) {
          if (/piano|scheda|workout|program|allenamento/i.test(cell)) {
            return cell;
          }
        }
      }
    }
    return fallback || 'Piano di Allenamento Importato';
  }

  /**
   * Detect if sheet has column headers
   */
  private detectHeaders(data: any[][]): boolean {
    if (data.length < 2) return false;

    // Check if first row contains typical header keywords
    const firstRow = data[0];
    if (!firstRow) return false;

    const headerKeywords = [
      'esercizio', 'exercise', 'nome',
      'serie', 'set', 'sets',
      'rip', 'rep', 'reps', 'ripetizioni',
      'peso', 'weight', 'kg',
      'rest', 'riposo', 'pausa'
    ];

    let headerCount = 0;
    for (const cell of firstRow) {
      if (cell) {
        const cellStr = String(cell).toLowerCase();
        if (headerKeywords.some(kw => cellStr.includes(kw))) {
          headerCount++;
        }
      }
    }

    return headerCount >= 2;
  }

  /**
   * Parse structured sheet with headers
   */
  private parseStructuredSheet(data: any[][]): ParsedSession[] {
    const headers = data[0].map((h: any) => String(h || '').toLowerCase().trim());

    console.log('📊 Headers detected:', headers);

    // AUTO-DETECT FORMATO: Analizza prima riga di dati per rilevare formato
    const formatDetection = this.detectExcelFormat(data, headers);
    console.log('🔍 Format detection result:', formatDetection);

    // Find column indices
    const exerciseCol = this.findColumnIndex(headers, ['esercizio', 'exercise', 'nome', 'name']);

    // Per formato combinato, cerca colonne tipo "Serie x Rip", "Sets x Reps"
    let setsRepsCol = -1;
    if (formatDetection.format === 'combined') {
      setsRepsCol = this.findColumnIndex(headers, ['serie', 'set', 'sxr', 'serie x rip', 'sets x reps']);
      // Se non troviamo header esplicito, usa la seconda colonna (dopo nome esercizio)
      if (setsRepsCol === -1 && exerciseCol !== -1) {
        setsRepsCol = exerciseCol + 1;
      }
    }

    const setsCol = formatDetection.format === 'separate'
      ? this.findColumnIndex(headers, ['serie', 'set', 'sets'])
      : -1;
    const repsCol = formatDetection.format === 'separate'
      ? this.findColumnIndex(headers, ['rip', 'rep', 'reps', 'ripetizioni', 'repetitions'])
      : -1;

    const weightCol = this.findColumnIndex(headers, ['peso', 'weight', 'kg', 'carico']);
    const restCol = this.findColumnIndex(headers, ['rest', 'riposo', 'pausa', 'recupero']);
    const notesCol = this.findColumnIndex(headers, ['note', 'notes', 'annotazioni']);
    const sessionCol = this.findColumnIndex(headers, ['sessione', 'session', 'giorno', 'day']);

    console.log('📊 Column mapping:', {
      format: formatDetection.format,
      exercise: exerciseCol,
      setsReps: setsRepsCol,
      sets: setsCol,
      reps: repsCol,
      weight: weightCol,
      rest: restCol,
      notes: notesCol,
      session: sessionCol
    });

    if (exerciseCol === -1) {
      // Can't find exercise column, fall back to free-form parsing
      console.log('⚠️  Exercise column not found, falling back to free-form parsing');
      return this.parseFreeFormSheet(data);
    }

    const sessions: Map<string, ParsedSession> = new Map();
    let currentSessionName = 'Sessione 1';
    let sessionNumber = 1;

    // Parse rows (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Check if this row defines a new session
      if (sessionCol !== -1 && row[sessionCol]) {
        currentSessionName = String(row[sessionCol]).trim();
        if (!sessions.has(currentSessionName)) {
          sessionNumber++;
        }
      }

      // Parse exercise
      const exerciseName = row[exerciseCol] ? String(row[exerciseCol]).trim() : null;
      if (!exerciseName || exerciseName.length === 0) continue;

      // PARSING DINAMICO basato sul formato rilevato
      let sets: number | null = null;
      let reps = '10';

      if (formatDetection.format === 'combined' && setsRepsCol !== -1) {
        // Formato combinato: "4x8", "3 x 12", etc
        const setsRepsValue = row[setsRepsCol];
        const parsed = this.parseSetsReps(setsRepsValue);
        if (parsed) {
          sets = parsed.sets;
          reps = parsed.reps;
          console.log(`📝 Parsed combined format: ${exerciseName} | ${sets}x${reps}`);
        }
      } else {
        // Formato separato: colonne distinte per Serie e Rip
        sets = setsCol !== -1 ? this.parseNumber(row[setsCol]) : null;
        if (repsCol !== -1 && row[repsCol]) {
          reps = String(row[repsCol]).trim();
        }
      }

      if (sets === null || sets === 0) {
        console.log(`⚠️  Invalid sets for "${exerciseName}", skipping row`);
        continue;
      }

      const weight = weightCol !== -1 ? this.parseNumber(row[weightCol]) : null;
      const rest = restCol !== -1 ? this.parseRestTime(row[restCol]) : undefined;
      let notes = notesCol !== -1 && row[notesCol] ? String(row[notesCol]).trim() : undefined;

      // GESTIONE ESERCIZI ISOMETRICI (Plank, Hold, etc)
      const isometricResult = this.handleIsometricExercise(exerciseName, reps);
      if (isometricResult) {
        reps = isometricResult.reps;
        notes = notes ? `${notes}; ${isometricResult.notes}` : isometricResult.notes;
        console.log(`⏱️  Isometric exercise detected: ${exerciseName} | ${isometricResult.notes}`);
      }

      // Validate and sanitize rest time
      let sanitizedRest = rest || 90;
      if (sanitizedRest < 30 || sanitizedRest > 300) {
        console.log(`⚠️  Invalid rest time for "${exerciseName}": ${sanitizedRest}s, using default 90s`);
        sanitizedRest = 90;
      }

      const exercise: ParsedExercise = {
        name: exerciseName,
        sets,
        reps,
        weight: weight ?? undefined,
        restSeconds: sanitizedRest,
        notes,
      };

      console.log(`✅ ${exerciseName} | ${sets}x${reps} | ${weight || 'BW'}kg | ${sanitizedRest}s ${notes ? `| ${notes}` : ''}`);

      // Add to session
      if (!sessions.has(currentSessionName)) {
        sessions.set(currentSessionName, {
          name: currentSessionName,
          dayNumber: sessions.size + 1,
          exercises: [],
        });
      }

      sessions.get(currentSessionName)!.exercises.push(exercise);
    }

    return Array.from(sessions.values());
  }

  /**
   * Detect Excel format by analyzing first data row
   */
  private detectExcelFormat(data: any[][], headers: string[]): {
    format: 'combined' | 'separate';
    hasRestColumn: boolean;
    startRow: number;
  } {
    console.log('🔍 Starting format detection...');

    // Analizza prime 5 righe di dati (dopo header)
    for (let rowNum = 1; rowNum <= Math.min(5, data.length - 1); rowNum++) {
      const row = data[rowNum];
      if (!row || row.length === 0) continue;

      const values: string[] = row.map((cell: any) =>
        cell ? String(cell).trim() : ''
      );

      // Skip righe vuote o che sembrano header duplicati
      if (values.filter(v => v).length === 0) continue;
      if (values[0]?.toLowerCase().includes('esercizio')) continue;

      console.log(`🔍 Analyzing row ${rowNum}:`, values);

      // RILEVA FORMATO COMBINATO: cerca pattern "NxN" in qualsiasi colonna
      const hasSetsRepsPattern = values.some(v =>
        /\d+\s*[xX×]\s*\d+/.test(v)
      );

      if (hasSetsRepsPattern) {
        console.log('✅ Detected COMBINED format (e.g., "4x8", "3 x 12")');
        return {
          format: 'combined',
          hasRestColumn: values.length >= 4,
          startRow: rowNum
        };
      }

      // RILEVA FORMATO SEPARATO: cerca due numeri consecutivi (Serie e Rip)
      let consecutiveNumbers = 0;
      for (let i = 1; i < Math.min(values.length, 4); i++) {
        const trimmed = values[i]?.trim();
        if (/^\d+$/.test(trimmed)) {
          consecutiveNumbers++;
          if (consecutiveNumbers >= 2) {
            console.log('✅ Detected SEPARATE format (Serie | Rip columns)');
            return {
              format: 'separate',
              hasRestColumn: values.length >= 5,
              startRow: rowNum
            };
          }
        } else {
          consecutiveNumbers = 0; // Reset counter
        }
      }
    }

    // Fallback: prova a dedurre dagli header
    const hasSetsRepsHeader = headers.some(h =>
      /serie\s*x\s*rip|set\s*x\s*rep|sxr/i.test(h)
    );

    if (hasSetsRepsHeader) {
      console.log('✅ Detected COMBINED format from headers');
      return { format: 'combined', hasRestColumn: false, startRow: 1 };
    }

    // Default: formato combinato (più comune)
    console.log('⚠️  Could not definitively detect format, using COMBINED as default');
    return {
      format: 'combined',
      hasRestColumn: false,
      startRow: 1
    };
  }

  /**
   * Parse "Serie x Rip" format (e.g., "4x8", "3 x 12", "4X10")
   */
  private parseSetsReps(cell: any): { sets: number; reps: string } | null {
    if (!cell) return null;

    const str = String(cell).trim();

    // Pattern: numero x numero (con varianti)
    // Supporta: "4x8", "3 x 12", "4X10", "3x8-10", "3x60sec", "3x60s"
    const match = str.match(/(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)\s*(sec|s)?/i);

    if (!match) return null;

    const sets = parseInt(match[1]);
    const reps = match[2];
    const hasSecondsSuffix = match[3] !== undefined;

    // Validazione base
    if (sets < 1 || sets > 10) {
      console.log(`⚠️  Invalid sets value: ${sets}`);
      return null;
    }

    // Se ha suffisso "sec" o "s", è un esercizio isometrico
    // Ma lasciamo il valore originale, sarà gestito da handleIsometricExercise

    return { sets, reps };
  }

  /**
   * Handle isometric exercises (Plank, Hold, etc)
   */
  private handleIsometricExercise(exerciseName: string, reps: string): { reps: string; notes: string } | null {
    const nameLower = exerciseName.toLowerCase();

    // Lista esercizi isometrici comuni
    const isometricKeywords = [
      'plank', 'hold', 'wall sit', 'isometric', 'hollow body',
      'l-sit', 'dead hang', 'static', 'tenuta'
    ];

    const isIsometric = isometricKeywords.some(keyword =>
      nameLower.includes(keyword)
    );

    if (!isIsometric) return null;

    // Se il numero di "reps" è alto (>30), probabilmente sono secondi
    const repsNum = parseInt(reps);
    if (isNaN(repsNum)) return null;

    if (repsNum > 30) {
      // È un tempo in secondi
      return {
        reps: '1',
        notes: `Mantenere per ${repsNum} secondi`
      };
    }

    // Se è un numero basso, potrebbe essere già corretto
    // Ma aggiungiamo comunque una nota
    return {
      reps: reps,
      notes: 'Esercizio isometrico'
    };
  }

  /**
   * Parse free-form sheet without clear headers
   */
  private parseFreeFormSheet(data: any[][]): ParsedSession[] {
    const sessions: ParsedSession[] = [];
    let currentSession: ParsedSession | null = null;
    let sessionNumber = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      // Convert row to string for analysis
      const rowText = row.filter(c => c).map(c => String(c).trim()).join(' ');

      // Check if this is a session header
      if (this.isSessionHeader(rowText)) {
        if (currentSession && currentSession.exercises.length > 0) {
          sessions.push(currentSession);
        }
        sessionNumber++;
        currentSession = {
          name: rowText,
          dayNumber: sessionNumber,
          exercises: [],
        };
        continue;
      }

      // Try to parse as exercise
      const exercise = this.parseExerciseRow(row);
      if (exercise) {
        if (!currentSession) {
          sessionNumber++;
          currentSession = {
            name: `Sessione ${sessionNumber}`,
            dayNumber: sessionNumber,
            exercises: [],
          };
        }
        currentSession.exercises.push(exercise);
      }
    }

    // Add last session
    if (currentSession && currentSession.exercises.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  /**
   * Check if row text is a session header
   */
  private isSessionHeader(text: string): boolean {
    // Trim e lowercase per matching
    const normalized = text.trim();
    const lower = normalized.toLowerCase();

    // REGOLA 1: Se contiene "3x10", "4x8" etc → è un esercizio, NON header
    if (/\d+\s*[xX×]\s*\d+/.test(normalized)) {
      return false;
    }

    // REGOLA 2: Pattern header validi (DEVONO iniziare con questi)
    const validHeaderPatterns = [
      /^giorno\s+\d+/i,                    // "GIORNO 1", "Giorno 2"
      /^(lun|mar|mer|gio|ven|sab|dom)/i,  // Giorni settimana
      /^(push|pull|legs|upper|lower)/i,   // Split types
      /^day\s+\d+/i,                       // "DAY 1"
      /^session\s+\d+/i,                   // "SESSION 1"
    ];

    return validHeaderPatterns.some(pattern => pattern.test(lower));
  }

  /**
   * Parse exercise from a row
   */
  private parseExerciseRow(row: any[]): ParsedExercise | null {
    if (row.length < 2) return null;

    // First cell should be exercise name
    const name = row[0] ? String(row[0]).trim() : null;
    if (!name || name.length === 0) return null;

    // Second cell should be sets or sets x reps
    let sets: number | null = null;
    let reps = '10';
    let notes: string | undefined;

    if (row[1]) {
      const setsRepsStr = String(row[1]).trim();

      // Check for "3x10" format usando la funzione parseSetsReps
      const parsed = this.parseSetsReps(setsRepsStr);
      if (parsed) {
        sets = parsed.sets;
        reps = parsed.reps;
      } else {
        // Just a number (sets)
        sets = this.parseNumber(row[1]);
        if (row[2]) {
          const repsValue = String(row[2]).trim();
          if (/^\d+(-\d+)?$/.test(repsValue)) {
            reps = repsValue;
          }
        }
      }
    }

    if (sets === null || sets === 0) return null;

    // GESTIONE ESERCIZI ISOMETRICI
    const isometricResult = this.handleIsometricExercise(name, reps);
    if (isometricResult) {
      reps = isometricResult.reps;
      notes = isometricResult.notes;
    }

    // Try to extract weight and rest from remaining cells
    let weight: number | undefined;
    let rest: number | undefined;

    // Determina indice di partenza basato sul formato
    const startIdx = this.parseSetsReps(String(row[1]).trim()) ? 2 : 3;

    for (let i = startIdx; i < row.length; i++) {
      if (row[i]) {
        const val = this.parseNumber(row[i]);
        if (val !== null) {
          if (val > 20 && val < 500) {
            // Likely weight in kg
            weight = val;
          } else if (val >= 30 && val < 600) {
            // Likely rest in seconds
            rest = val;
          }
        }
      }
    }

    // Validazione rest time
    let sanitizedRest = rest || 90;
    if (sanitizedRest < 30 || sanitizedRest > 300) {
      sanitizedRest = 90;
    }

    console.log(`✅ Free-form: ${name} | ${sets}x${reps} | ${weight || 'BW'}kg | ${sanitizedRest}s ${notes ? `| ${notes}` : ''}`);

    return {
      name,
      sets,
      reps,
      weight,
      restSeconds: sanitizedRest,
      notes,
    };
  }

  /**
   * Find column index by keywords
   */
  private findColumnIndex(headers: string[], keywords: string[]): number {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (keywords.some(kw => header.includes(kw))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Parse a number from a cell
   */
  private parseNumber(cell: any): number | null {
    if (cell === null || cell === undefined || cell === '') return null;

    if (typeof cell === 'number') {
      return cell;
    }

    const str = String(cell).trim().replace(',', '.');
    const num = parseFloat(str);

    return isNaN(num) ? null : num;
  }

  /**
   * Parse rest time from cell
   */
  private parseRestTime(cell: any): number | undefined {
    if (!cell) return undefined;

    const str = String(cell).toLowerCase().trim();

    // Try to extract number and unit
    const match = str.match(/(\d+(?:\.\d+)?)\s*(min|sec|s|m)?/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];

      if (unit && (unit.includes('min') || unit === 'm')) {
        // Convert minutes to seconds
        return value * 60;
      }
      // If no unit or "s"/"sec", treat as seconds
      return value;
    }

    // If no match, try direct number parsing
    const num = this.parseNumber(cell);
    if (num !== null && num > 0) {
      return num;
    }

    return undefined;
  }

  /**
   * Generate warnings
   */
  private generateWarnings(workout: ParsedWorkout): string[] {
    const warnings: string[] = [];

    workout.sessions.forEach(session => {
      if (session.exercises.length < 3) {
        warnings.push(`La sessione "${session.name}" ha solo ${session.exercises.length} esercizi`);
      }
    });

    return warnings;
  }
}
