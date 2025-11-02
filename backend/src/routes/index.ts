import { Router } from 'express';
import authRoutes from './auth.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);

export default router;
