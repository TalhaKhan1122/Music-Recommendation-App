import { Router } from 'express';
import authRoutes from './auth.routes';
import musicRoutes from './music.routes';
import stationRoutes from './station.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/music', musicRoutes);
router.use('/stations', stationRoutes);

export default router;
