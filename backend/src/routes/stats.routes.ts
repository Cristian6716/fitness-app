import { Router } from 'express';
import { getWeeklyStats, getGlobalStats } from '../controllers/stats.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All stats routes require authentication
router.use(authenticateToken);

router.get('/weekly', getWeeklyStats);
router.get('/global', getGlobalStats);

export default router;
