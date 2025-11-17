import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  generateWorkout,
  getWorkouts,
  getWorkoutById,
  deleteWorkout,
  updateWorkoutStatus,
  getPlanStats,
} from '../controllers/workout.controller';

const router = Router();

// All workout routes require authentication
router.use(authenticateToken);

router.post('/generate', generateWorkout);
router.get('/', getWorkouts);
router.get('/:id/stats', getPlanStats); // MUST be before /:id route
router.get('/:id', getWorkoutById);
router.put('/:id/status', updateWorkoutStatus);
router.delete('/:id', deleteWorkout);

export default router;
