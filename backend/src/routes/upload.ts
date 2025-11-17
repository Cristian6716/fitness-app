import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware';
import { PDFParser } from '../services/parsers/pdfParser';
import { ExcelParser } from '../services/parsers/excelParser';
import { ParsedWorkout } from '../types/parsed-workout.types';
import prisma from '../utils/prisma';

// Debug: Verify parsers are imported correctly
console.log('=== PARSERS IMPORT CHECK ===');
console.log('PDFParser type:', typeof PDFParser);
console.log('ExcelParser type:', typeof ExcelParser);
console.log('PDFParser:', PDFParser);
console.log('ExcelParser:', ExcelParser);
console.log('===========================');

const router = Router();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer fileFilter triggered');
    console.log('🔍 File mimetype:', file.mimetype);
    console.log('🔍 File originalname:', file.originalname);
    console.log('🔍 File fieldname:', file.fieldname);

    const allowedMimes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      console.log('✅ Multer accepted file:', file.mimetype);
      cb(null, true);
    } else {
      console.error('❌ Multer rejected file:', file.mimetype);
      cb(new Error('Formato file non supportato. Usa PDF o Excel (.xlsx, .xls)'));
    }
  },
});

// Multer error handler
router.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    console.error('🔴 MULTER ERROR:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    console.error('Field:', err.field);
    return res.status(400).json({ error: `Errore upload: ${err.message}` });
  }
  next(err);
});

/**
 * POST /api/plans/upload
 * Upload and parse a workout plan file
 */
router.post(
  '/upload',
  (req, res, next) => {
    console.log('🔵 === REQUEST RECEIVED ===');
    console.log('🔵 Method:', req.method);
    console.log('🔵 URL:', req.url);
    console.log('🔵 Content-Type:', req.headers['content-type']);
    console.log('🔵 Content-Length:', req.headers['content-length']);
    console.log('🔵 User-Agent:', req.headers['user-agent']);
    console.log('🔵 Authorization:', req.headers['authorization'] ? 'Present' : 'Missing');
    console.log('🔵 =========================');
    next();
  },
  authenticateToken,
  (req, res, next) => {
    console.log('✅ Auth middleware passed');
    console.log('✅ User ID:', (req as any).userId);
    next();
  },
  upload.single('file'),
  (req, res, next) => {
    console.log('✅ Multer middleware passed');
    console.log('✅ File received:', req.file ? 'Yes' : 'No');
    if (req.file) {
      console.log('✅ File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    }
    next();
  },
  async (req: Request, res: Response) => {
    try {
      console.log('=== UPLOAD START ===');

      if (!req.file) {
        console.log('❌ Nessun file ricevuto');
        return res.status(400).json({ error: 'Nessun file caricato' });
      }

      console.log('✅ File ricevuto:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer.length,
      });

      const userId = (req as any).userId;
      const buffer = req.file.buffer;
      const mimetype = req.file.mimetype;

      console.log('📝 User ID:', userId);

      // Parse file based on type
      let parseResult;

      if (mimetype === 'application/pdf') {
        console.log('📄 Tentativo parsing PDF...');
        console.log('PDFParser type:', typeof PDFParser);

        try {
          const parser = new PDFParser();
          console.log('Parser instance created:', parser);
          console.log('Parser.parse type:', typeof parser.parse);

          parseResult = await parser.parse(buffer);
          console.log('✅ PDF parsato con successo');
          console.log('Parse result:', JSON.stringify(parseResult, null, 2));
        } catch (pdfError: any) {
          console.error('❌ Errore durante parsing PDF:');
          console.error('Error name:', pdfError.name);
          console.error('Error message:', pdfError.message);
          console.error('Error stack:', pdfError.stack);
          throw pdfError;
        }
      } else if (
        mimetype === 'application/vnd.ms-excel' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        mimetype === 'application/vnd.ms-excel.sheet.macroEnabled.12'
      ) {
        console.log('📊 Tentativo parsing Excel...');
        console.log('ExcelParser type:', typeof ExcelParser);

        try {
          const parser = new ExcelParser();
          console.log('Parser instance created:', parser);
          console.log('Parser.parse type:', typeof parser.parse);

          parseResult = await parser.parse(buffer);
          console.log('✅ Excel parsato con successo');
          console.log('Parse result:', JSON.stringify(parseResult, null, 2));
        } catch (excelError: any) {
          console.error('❌ Errore durante parsing Excel:');
          console.error('Error name:', excelError.name);
          console.error('Error message:', excelError.message);
          console.error('Error stack:', excelError.stack);
          throw excelError;
        }
      } else {
        console.log('❌ Formato non supportato:', mimetype);
        return res.status(400).json({ error: 'Formato file non supportato' });
      }

      console.log('🔍 Validazione parse result...');
      if (!parseResult.success || !parseResult.data) {
        console.log('❌ Parsing fallito:', parseResult.error);
        return res.status(400).json({
          error: parseResult.error || 'Impossibile leggere il file',
        });
      }

      const parsedWorkout = parseResult.data;
      console.log('✅ Parse result valido');
      console.log('Parsed workout:', {
        name: parsedWorkout.name,
        sessionsCount: parsedWorkout.sessions.length,
        durationWeeks: parsedWorkout.durationWeeks,
      });

      // Validate parsed data
      if (parsedWorkout.sessions.length === 0) {
        console.log('❌ Nessuna sessione trovata nel workout');
        return res.status(400).json({
          error: 'Nessun esercizio trovato nel file. Assicurati che il file contenga una scheda di allenamento valida.',
        });
      }

      // Return parsed data WITHOUT saving to database
      // User will review and confirm before saving
      console.log('✅ Parsed data ready for review');
      console.log('=== UPLOAD END (SUCCESS - READY FOR REVIEW) ===');

      const responseData = {
        success: true,
        message: 'File analizzato con successo. Rivedi i dati prima di salvare.',
        parsedData: parsedWorkout,
        warnings: parseResult.warnings || [],
      };
      console.log('📤 Sending parsed data for review:', JSON.stringify(responseData, null, 2));

      return res.status(200).json(responseData);
    } catch (error: any) {
      console.error('=== UPLOAD ERROR ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      console.error('===================');

      if (error.message && error.message.includes('File too large')) {
        return res.status(400).json({ error: 'File troppo grande. Massimo 50MB.' });
      }

      return res.status(500).json({
        error: 'Errore durante il caricamento del file. Riprova.',
      });
    }
  }
);

/**
 * POST /api/plans/confirm
 * Confirm and save a reviewed workout plan
 */
router.post(
  '/confirm',
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      console.log('=== CONFIRM PLAN START ===');

      const userId = (req as any).userId;
      const parsedWorkout: ParsedWorkout = req.body;

      console.log('📝 User ID:', userId);
      console.log('📝 Confirming plan:', parsedWorkout.name);
      console.log('📝 Sessions:', parsedWorkout.sessions.length);

      // Validate received data
      if (!parsedWorkout || !parsedWorkout.name || !parsedWorkout.sessions) {
        return res.status(400).json({ error: 'Dati piano non validi' });
      }

      if (parsedWorkout.sessions.length === 0) {
        return res.status(400).json({ error: 'Il piano deve avere almeno una sessione' });
      }

      // Validate each session has at least one exercise
      for (const session of parsedWorkout.sessions) {
        if (!session.exercises || session.exercises.length === 0) {
          return res.status(400).json({
            error: `La sessione "${session.name}" deve avere almeno un esercizio`,
          });
        }

        // Validate each exercise
        for (const exercise of session.exercises) {
          if (!exercise.name || !exercise.sets || exercise.sets <= 0) {
            return res.status(400).json({
              error: `Esercizio non valido nella sessione "${session.name}"`,
            });
          }
        }
      }

      console.log('✅ Validation passed');

      // Save to database
      const workoutPlan = await createWorkoutPlanFromParsed(userId, parsedWorkout);

      console.log('✅ Workout plan saved successfully');
      console.log('✅ Plan ID:', workoutPlan.id);
      console.log('=== CONFIRM PLAN END (SUCCESS) ===');

      return res.status(201).json({
        message: 'Piano salvato con successo',
        plan: workoutPlan,
      });
    } catch (error: any) {
      console.error('=== CONFIRM PLAN ERROR ===');
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
      console.error('========================');

      return res.status(500).json({
        error: 'Errore durante il salvataggio del piano',
      });
    }
  }
);

/**
 * Create a workout plan in the database from parsed data
 */
async function createWorkoutPlanFromParsed(
  userId: string,
  parsed: ParsedWorkout
): Promise<any> {
  console.log('💾 createWorkoutPlanFromParsed START');

  // Archive existing active plan (if present)
  console.log('💾 Checking for existing active plan...');
  const existingActivePlan = await prisma.workoutPlan.findFirst({
    where: {
      userId,
      status: 'active',
    } as any, // Bypass TypeScript cache
  });

  if (existingActivePlan) {
    console.log('💾 Found active plan:', existingActivePlan.id, existingActivePlan.name, '- Archiving...');
    await prisma.workoutPlan.update({
      where: { id: existingActivePlan.id },
      data: { status: 'archived' } as any, // Bypass TypeScript cache
    });
    console.log('✅ Previous plan archived successfully');
  } else {
    console.log('💾 No active plan found, proceeding with creation');
  }

  console.log('💾 Creating new workout plan...');

  // Create new workout plan as active
  const workoutPlan = await prisma.workoutPlan.create({
    data: {
      userId,
      name: parsed.name,
      durationWeeks: parsed.durationWeeks || 4,
      frequency: parsed.frequency || parsed.sessions.length,
      status: 'active',
      aiGenerated: false,
    } as any, // Bypass TypeScript cache issue - types are correct at runtime
  });

  console.log('💾 Workout plan created:', workoutPlan.id);

  // Create training sessions with exercises
  console.log('💾 Creating training sessions...');
  for (let sessionIndex = 0; sessionIndex < parsed.sessions.length; sessionIndex++) {
    const session = parsed.sessions[sessionIndex];

    console.log(`💾 Creating session ${sessionIndex + 1}/${parsed.sessions.length}:`, session.name);
    console.log(`💾   - Exercises: ${session.exercises.length}`);

    const createdSession = await prisma.trainingSession.create({
      data: {
        planId: workoutPlan.id,
        name: session.name,
        dayNumber: session.dayNumber,
        order: sessionIndex,
        exercises: {
        create: session.exercises.map((exercise, exerciseIndex) => ({
          name: exercise.name,
          order: exerciseIndex,
          targetSets: exercise.sets,
          targetReps: exercise.reps,
          targetWeight: exercise.weight || null,
          restSeconds: exercise.restSeconds || 90,
          notes: exercise.notes || null,
        })),
      },
      },
    });

    console.log(`💾 Session created:`, createdSession.id);
  }

  console.log('💾 Fetching complete workout plan with relations...');

  // Fetch complete workout plan with relations
  const completePlan = await prisma.workoutPlan.findUnique({
    where: { id: workoutPlan.id },
    include: {
      trainingSessions: {
        include: {
          exercises: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  console.log('💾 Complete plan fetched');
  console.log('💾 Training sessions in complete plan:', completePlan?.trainingSessions?.length || 0);
  console.log('💾 createWorkoutPlanFromParsed END');

  return completePlan;
}

export default router;
