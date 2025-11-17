import { Router } from 'express';
import { register, login, completeOnboarding } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/complete-onboarding', authenticateToken, completeOnboarding);

export default router;
