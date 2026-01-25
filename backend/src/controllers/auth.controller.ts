import { Request, Response } from 'express';
import User from '../models/auth.model';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendPasswordResetEmail } from '../utils/email.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

interface SignupLoginRequest extends Request {
  body: {
    email: string;
    password: string;
    confirmPassword?: string;
  };
}

// Generate JWT Token (export for use in Google OAuth)
export const generateToken = (userId: string): string => {
  if (!JWT_SECRET || JWT_SECRET.trim() === '') {
    throw new Error('JWT_SECRET is not configured. Please set it in your .env file.');
  }
  return jwt.sign({ userId }, JWT_SECRET as string, {
    expiresIn: JWT_EXPIRE as string,
  });
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user
 * @access  Public
 */
export const signup = async (req: SignupLoginRequest, res: Response): Promise<void> => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken((user._id as any).toString());

    // Send response
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = async (req: SignupLoginRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check if user is a Google OAuth user (no password)
    if (user.googleId && !user.password) {
      res.status(401).json({
        success: false,
        message: 'This account was created with Google. Please use Google sign-in.',
      });
      return;
    }

    // Check if user has a password
    if (!user.password) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // Generate token
    const token = generateToken((user._id as any).toString());

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          createdAt: user.createdAt,
        },
        token,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private (requires authentication)
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    // Get user from database
    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

interface ForgotPasswordRequest extends Request {
  body: {
    email: string;
  };
}

interface ResetPasswordRequest extends Request {
  body: {
    token: string;
    password: string;
    confirmPassword?: string;
  };
}

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
export const forgotPassword = async (req: ForgotPasswordRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Please provide your email address',
      });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'No account found with this email address. Please check your email and try again.',
      });
      return;
    }

    // Check if user is a Google OAuth user (can't reset password)
    if (user.googleId && !user.password) {
      res.status(400).json({
        success: false,
        message: 'This account was created with Google. Please use Google sign-in.',
      });
      return;
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    try {
      // Send email
      await sendPasswordResetEmail(user.email, resetToken);

      // In development, also log the reset link for easy testing
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        console.log('\n🔗 Password Reset Link (for testing):');
        console.log(resetUrl);
        console.log('📧 Email sent to:', user.email);
        console.log('⏰ Token expires in 10 minutes\n');
      }

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully. Please check your inbox (and spam folder).',
        // In development, include the reset link in response for testing
        ...(process.env.NODE_ENV === 'development' && {
          resetLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`,
        }),
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      // In development, still provide the reset link even if email fails
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        console.log('\n⚠️  Email sending failed, but here is the reset link for testing:');
        console.log(resetUrl);
        console.log('📧 Email:', user.email);
        console.log('⏰ Token expires in 10 minutes\n');
        
        res.status(200).json({
          success: true,
          message: 'Email sending failed, but reset link generated. Check server console for the link.',
          resetLink: resetUrl,
        });
        return;
      }
      
      // Reset the token fields if email fails (in production)
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
    }
  } catch (error: any) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = async (req: ResetPasswordRequest, res: Response): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password',
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    // Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with matching token and non-expired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
      return;
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Generate new token for automatic login
    const jwtToken = generateToken((user._id as any).toString());

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          createdAt: user.createdAt,
        },
        token: jwtToken,
      },
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

