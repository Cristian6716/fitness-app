// pdf-parse v2 uses named export PDFParse class
import { PDFParse } from 'pdf-parse';
import { ParsedWorkout, ParsedSession, ParsedExercise, ParserResult } from '../../types/parsed-workout.types';
// OCR imports - commented out to avoid billing costs, uncomment to enable OCR support
// import ocrService from '../ocr.service';
// import { convert as pdfToImage } from 'pdf-poppler';

/**
 * Parse PDF workout files
 */
export class PDFParser {
  /**
   * Parse a PDF buffer to extract workout data
   */
  async parse(buffer: Buffer): Promise<ParserResult> {
    try {
      console.log('=== PDF PARSER START ===');
      console.log('📄 Buffer size:', buffer.length, 'bytes');

      // pdf-parse v2 API: create PDFParse instance with data
      // Buffer is automatically converted to Uint8Array
      console.log('📄 Creating PDFParse instance...');
      const parser = new PDFParse({ data: buffer });

      // Use getText() method to extract text from all pages
      console.log('📄 Extracting text from PDF...');
      const result = await parser.getText();
      const text = result.text;

      console.log('📄 PDF Text extracted successfully');
      console.log('📄 Text length:', text.length, 'characters');
      console.log('📄 First 500 characters:', text.substring(0, 500));
      console.log('📄 Last 200 characters:', text.substring(Math.max(0, text.length - 200)));

      // Check if PDF is mostly empty (image-based or scanned)
      if (text.length < 100) {
        console.log('❌ PDF text too short (', text.length, 'chars) - likely scanned/image PDF');

        /* OCR FALLBACK - COMMENTED OUT TO AVOID BILLING COSTS
         * Uncomment this section to enable OCR support for scanned PDFs
         * Requires Google Cloud Vision API setup (see OCR_SETUP.md)
         *
        console.log('🔍 Attempting OCR...');
        const ocrText = await this.attemptOCR(buffer);

        if (ocrText && ocrText.length >= 100) {
          console.log('✅ OCR successful, extracted', ocrText.length, 'characters');
          console.log('📄 First 500 chars from OCR:', ocrText.substring(0, 500));

          const workout = this.extractWorkoutFromText(ocrText);

          if (workout.sessions.length > 0) {
            const warnings = this.generateWarnings(workout);
            warnings.push('⚠️ Questo PDF è stato elaborato tramite OCR. Verifica attentamente i dati.');

            console.log('=== PDF PARSER END (SUCCESS VIA OCR) ===');
            return {
              success: true,
              data: workout,
              warnings,
            };
          }
        }
        */

        return {
          success: false,
          error: 'Questo PDF non contiene testo leggibile. Per importare la scheda:\n\n1️⃣ Ricrea il file in Excel\n2️⃣ Oppure usa un PDF creato direttamente da Word/Google Docs\n3️⃣ Se hai una foto della scheda, riscrivila manualmente (per ora)',
        };
      }

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          error: 'Il PDF sembra vuoto o non contiene testo leggibile',
        };
      }

      console.log('📄 Starting workout extraction from text...');
      const workout = this.extractWorkoutFromText(text);

      console.log('📊 Workout extraction complete');
      console.log('📊 Workout name:', workout.name);
      console.log('📊 Duration weeks:', workout.durationWeeks);
      console.log('📊 Parsed workout sessions:', workout.sessions.length);
      if (workout.sessions.length > 0) {
        console.log('📊 First session:', JSON.stringify(workout.sessions[0], null, 2));
        console.log('📊 First session exercises:', workout.sessions[0].exercises.length);
      }

      if (workout.sessions.length === 0) {
        // Log the lines we're trying to parse to help debug
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        console.log('📄 Total lines:', lines.length);
        console.log('📄 First 10 lines:', lines.slice(0, 10));

        return {
          success: false,
          error: 'Nessuna sessione di allenamento trovata nel PDF',
        };
      }

      console.log('📄 Generating warnings...');
      const warnings = this.generateWarnings(workout);
      console.log('📄 Warnings:', warnings);

      console.log('=== PDF PARSER END (SUCCESS) ===');
      return {
        success: true,
        data: workout,
        warnings,
      };
    } catch (error: any) {
      console.error('=== PDF PARSER ERROR ===');
      console.error('❌ Error type:', error.constructor.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Full error:', error);
      console.error('=======================');

      return {
        success: false,
        error: `Errore durante la lettura del PDF: ${error.message}`,
      };
    }
  }

  /**
   * Extract workout structure from text
   */
  private extractWorkoutFromText(text: string): ParsedWorkout {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const workoutName = this.extractWorkoutName(lines);
    const durationWeeks = this.extractDuration(text);
    const sessions = this.extractSessions(lines);

    return {
      name: workoutName,
      durationWeeks,
      frequency: sessions.length, // Number of training sessions per week
      sessions,
    };
  }

  /**
   * Extract workout name from first lines
   */
  private extractWorkoutName(lines: string[]): string {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.length > 5 && !/^\d+[\s\/\-]\d+/.test(line)) {
        if (/piano|scheda|workout|program|allenamento/i.test(line)) {
          return line;
        }
        if (i === 0 || i === 1) {
          return line;
        }
      }
    }
    return 'Piano di Allenamento Importato';
  }

  /**
   * Extract duration in weeks
   */
  private extractDuration(text: string): number | undefined {
    const durationMatch = text.match(/(\d+)\s*(settimane|weeks|sett)/i);
    if (durationMatch) {
      return parseInt(durationMatch[1]);
    }
    return undefined;
  }

  /**
   * Extract sessions from lines
   */
  private extractSessions(lines: string[]): ParsedSession[] {
    const sessions: ParsedSession[] = [];
    let currentSession: ParsedSession | null = null;
    let sessionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sessionHeader = this.isSessionHeader(line);

      if (sessionHeader) {
        if (currentSession && currentSession.exercises.length > 0) {
          sessions.push(currentSession);
        }

        sessionNumber++;
        currentSession = {
          name: sessionHeader.name,
          dayNumber: sessionHeader.dayNumber || sessionNumber,
          exercises: [],
        };
        continue;
      }

      if (currentSession) {
        const exercise = this.parseExerciseLine(line);
        if (exercise) {
          currentSession.exercises.push(exercise);
        }
      } else {
        const exercise = this.parseExerciseLine(line);
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
    }

    if (currentSession && currentSession.exercises.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  /**
   * Check if a line is a session header
   */
  private isSessionHeader(line: string): { name: string; dayNumber?: number } | null {
    const patterns = [
      /(?:giorno|day|sessione|allenamento)\s*(\d+)[:\s]*(.+)?/i,
      /^(lun[eì]d[ìi]|marted[ìi]|mercoled[ìi]|gioved[ìi]|venerd[ìi]|sabato|domenica)/i,
      /^(push|pull|legs|upper|lower|full\s*body)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        if (match[1] && /^\d+$/.test(match[1])) {
          const dayNumber = parseInt(match[1]);
          const name = match[2] ? match[2].trim() : `Giorno ${dayNumber}`;
          return { name, dayNumber };
        } else {
          return { name: line };
        }
      }
    }

    if (line === line.toUpperCase() && line.length < 40 && line.length > 3) {
      return { name: line };
    }

    return null;
  }

  /**
   * Parse an exercise line
   */
  private parseExerciseLine(line: string): ParsedExercise | null {
    const patterns = [
      /^(.+?)\s+(\d+)\s*[xX×]\s*(\d+(?:-\d+)?)\s*(.*)?$/,
      /^(.+?)\s+(\d+)\s+(?:serie|set|sets)\s*[xX×]\s*(\d+(?:-\d+)?)\s+(?:rip|rep|reps|ripetizioni)?\s*(.*)?$/i,
      /^(.+?)[\s\-–]+(\d+)\s+(?:set|sets)\s*[xX×]\s*(\d+(?:-\d+)?)\s+(?:rep|reps)?\s*(.*)?$/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1].trim();
        const sets = parseInt(match[2]);
        const reps = match[3].trim();
        const rest = match[4] || '';

        const weightMatch = rest.match(/(?:@|peso|weight)?\s*(\d+(?:\.\d+)?)\s*(?:kg|lb)?/i);
        const weight = weightMatch ? parseFloat(weightMatch[1]) : undefined;

        const restMatch = rest.match(/(?:rest|riposo|pausa)?\s*(\d+)\s*(?:min|sec|s|m)?/i);
        let restSeconds: number | undefined;
        if (restMatch) {
          const restValue = parseInt(restMatch[1]);
          const unit = restMatch[0].toLowerCase();
          restSeconds = unit.includes('min') || unit.includes('m') ? restValue * 60 : restValue;
        }

        return {
          name,
          sets,
          reps,
          weight,
          restSeconds: restSeconds || 90,
          notes: rest.trim() || undefined,
        };
      }
    }

    return null;
  }

  /**
   * Generate warnings for the parsed workout
   */
  private generateWarnings(workout: ParsedWorkout): string[] {
    const warnings: string[] = [];

    workout.sessions.forEach(session => {
      if (session.exercises.length < 3) {
        warnings.push(`La sessione "${session.name}" ha solo ${session.exercises.length} esercizi`);
      }

      session.exercises.forEach(exercise => {
        if (exercise.sets > 10) {
          warnings.push(`L'esercizio "${exercise.name}" ha ${exercise.sets} serie (potrebbe essere un errore)`);
        }
      });
    });

    return warnings;
  }

  /* OCR SUPPORT - COMMENTED OUT TO AVOID BILLING COSTS
   * Uncomment this method to enable OCR for scanned PDFs
   * Also uncomment the imports at the top and the OCR fallback section above
   *
  /**
   * Attempt OCR on scanned PDF
   *\/
  private async attemptOCR(pdfBuffer: Buffer): Promise<string> {
    try {
      // Check if OCR is available
      if (!ocrService.isAvailable()) {
        console.log('⚠️ OCR service not configured, skipping OCR attempt');
        return '';
      }

      console.log('🖼️ Converting PDF to image for OCR...');

      // Write PDF to temp file (pdf-poppler requires file path)
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tempDir = os.tmpdir();
      const tempPdfPath = path.join(tempDir, `pdf-ocr-${Date.now()}.pdf`);
      const tempImagePath = path.join(tempDir, `pdf-ocr-${Date.now()}`);

      try {
        // Write PDF to temp file
        fs.writeFileSync(tempPdfPath, pdfBuffer);
        console.log('📝 Temp PDF written to:', tempPdfPath);

        // Convert PDF to PNG (first page only)
        const options = {
          format: 'png' as const,
          out_dir: tempDir,
          out_prefix: path.basename(tempImagePath),
          page: 1, // Only first page
        };

        console.log('🖼️ Converting PDF page to PNG...');
        await pdfToImage(tempPdfPath, options);

        // Read the generated image
        const generatedImagePath = `${tempImagePath}-1.png`;
        console.log('📖 Reading generated image:', generatedImagePath);

        if (!fs.existsSync(generatedImagePath)) {
          console.error('❌ Generated image not found:', generatedImagePath);
          return '';
        }

        const imageBuffer = fs.readFileSync(generatedImagePath);
        console.log('📏 Image size:', (imageBuffer.length / 1024 / 1024).toFixed(2), 'MB');

        // Check if image is too large (Vision API has limits)
        const maxSizeMB = 4;
        if (imageBuffer.length > maxSizeMB * 1024 * 1024) {
          console.log(`⚠️ Image too large (${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB), will be compressed by OCR service`);
        }

        // Call OCR service
        const extractedText = await ocrService.extractTextFromImage(imageBuffer);

        // Cleanup temp files
        try {
          fs.unlinkSync(tempPdfPath);
          fs.unlinkSync(generatedImagePath);
          console.log('🧹 Temp files cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temp files:', cleanupError);
        }

        return extractedText;
      } catch (conversionError: any) {
        console.error('❌ PDF to image conversion failed:', conversionError.message);

        // Cleanup on error
        try {
          if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
          const generatedImagePath = `${tempImagePath}-1.png`;
          if (fs.existsSync(generatedImagePath)) fs.unlinkSync(generatedImagePath);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }

        return '';
      }
    } catch (error: any) {
      console.error('❌ OCR attempt failed:', error.message);
      return '';
    }
  }
  */
}
