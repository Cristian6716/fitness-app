import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
    addMeasurement,
    getMeasurements,
    deleteMeasurement,
} from '../controllers/measurement.controller';

const router = express.Router();

router.use(authenticateToken);

router.post('/', addMeasurement);
router.get('/', getMeasurements);
router.delete('/:id', deleteMeasurement);

export default router;
