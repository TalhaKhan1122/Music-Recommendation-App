import { Router } from 'express';
import { signup, login, getCurrentUser } from '../controllers/auth.controller';
import { googleAuth, googleCallback, verifyGoogleToken } from '../controllers/googleAuth.controller';
import { authenticate } from '../middleware';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
router.get('/google', googleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', googleCallback);

/**
 * @route   POST /api/auth/google/verify
 * @desc    Verify Google ID token (for frontend direct verification)
 * @access  Public
 */
router.post('/google/verify', verifyGoogleToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

export default router;

