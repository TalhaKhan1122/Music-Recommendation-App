import { Router } from 'express';
import authRoutes from './auth.routes';
import musicRoutes from './music.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/music', musicRoutes);

export default router;
