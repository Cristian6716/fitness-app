import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  startSession,
  logSet,
  completeSession,
  getSessionHistory,
  updateCompletedSession,
} from '../controllers/session.controller';

const router = Router();

// All session routes require authentication
router.use(authenticateToken);

router.post('/:id/start', startSession);
router.post('/:id/log-set', logSet);
router.post('/:id/complete', completeSession);
router.patch('/completed/:sessionId', updateCompletedSession);
router.get('/:id/history', getSessionHistory);

export default router;
