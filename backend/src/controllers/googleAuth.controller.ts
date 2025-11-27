import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/auth.model';
import { generateToken } from './auth.controller';

// Get environment variables (lazy evaluation - called when needed, not at module load)
const getEnvVars = () => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Always ensure BACKEND_URL has a valid value
  let BACKEND_URL = process.env.BACKEND_URL;
  if (!BACKEND_URL || BACKEND_URL.trim() === '') {
    console.warn('⚠️  BACKEND_URL not found in .env, using default: http://localhost:5000');
    BACKEND_URL = 'http://localhost:5000';
  }
  
  return { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL, BACKEND_URL };
};

// Initialize Google OAuth client lazily
let oauth2Client: OAuth2Client | null = null;

const getOAuth2Client = (): OAuth2Client => {
  if (!oauth2Client) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BACKEND_URL } = getEnvVars();
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.');
    }
    
    // BACKEND_URL is guaranteed to have a value from getEnvVars
    const backendUrl = BACKEND_URL;
    
    // Ensure redirect URI has no trailing slash and uses correct format
    const redirectUri = `${backendUrl.replace(/\/$/, '')}/api/auth/google/callback`;
    
    console.log('🔧 Initializing OAuth2Client...');
    console.log('   Client ID:', GOOGLE_CLIENT_ID.substring(0, 35) + '...');
    console.log('   Client Secret:', GOOGLE_CLIENT_SECRET ? 'Set (hidden)' : 'Missing');
    console.log('   Backend URL:', backendUrl);
    console.log('   Redirect URI:', redirectUri);
    console.log('   ⚠️  IMPORTANT: This redirect URI must be EXACTLY in Google Cloud Console!');
    
    oauth2Client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    
    console.log('✅ OAuth2Client initialized successfully');
  }
  
  return oauth2Client;
};

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth flow
 * @access  Public
 */
export const googleAuth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get environment variables (loaded from .env by now)
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL, BACKEND_URL } = getEnvVars();
    
    console.log('🔍 Checking Google OAuth configuration...');
    console.log('GOOGLE_CLIENT_ID exists:', !!GOOGLE_CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET exists:', !!GOOGLE_CLIENT_SECRET);
    console.log('FRONTEND_URL:', FRONTEND_URL);
    console.log('BACKEND_URL:', BACKEND_URL);
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('❌ Google OAuth credentials missing!');
      res.status(503).json({
        success: false,
        message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file.',
      });
      return;
    }

    // Get OAuth2Client (initializes if needed)
    const client = getOAuth2Client();

    console.log('✅ Generating Google OAuth authorization URL...');
    console.log('   Using Client ID:', GOOGLE_CLIENT_ID.substring(0, 30) + '...');
    console.log('   Redirect URI:', `${BACKEND_URL}/api/auth/google/callback`);
    
    // Generate the authorization URL
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ],
      prompt: 'consent', // Force consent screen to get refresh token
    });

    console.log('🔗 Generated auth URL (first 150 chars):', authUrl.substring(0, 150));
    console.log('🔗 Redirecting to Google OAuth...');
    // Redirect to Google OAuth
    res.redirect(authUrl);
  } catch (error: any) {
    console.error('❌ Google OAuth initiation error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Google OAuth',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
export const googleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get environment variables
    const { FRONTEND_URL, GOOGLE_CLIENT_ID, BACKEND_URL } = getEnvVars();
    const client = getOAuth2Client();
    
    const { code, error: googleError } = req.query;

    // Handle Google OAuth errors
    if (googleError) {
      console.error('Google OAuth error:', googleError);
      res.redirect(`${FRONTEND_URL}/?error=oauth_failed&message=${encodeURIComponent(googleError as string)}`);
      return;
    }

    if (!code) {
      console.warn('No authorization code received from Google');
      res.redirect(`${FRONTEND_URL}/?error=oauth_cancelled`);
      return;
    }

    console.log('🔐 Exchanging authorization code for tokens...');
    console.log('   Using Client ID:', GOOGLE_CLIENT_ID.substring(0, 30) + '...');
    console.log('   Redirect URI:', `${BACKEND_URL}/api/auth/google/callback`);
    
    try {
      // Exchange authorization code for tokens
      const { tokens } = await client.getToken(code as string);
      client.setCredentials(tokens);
      console.log('✅ Successfully exchanged code for tokens');
    } catch (tokenError: any) {
      console.error('❌ Error exchanging code for tokens:', tokenError);
      console.error('   Error message:', tokenError.message);
      
      // Check for invalid_client error
             if (tokenError.message?.includes('invalid_client') || tokenError.message?.includes('invalid_clientid')) {
               console.error('   💡 INVALID_CLIENT_ID Error - Possible causes:');
               console.error('      1. Client ID in .env does not match Google Cloud Console');
               console.error('      2. Redirect URI mismatch in Google Cloud Console');
               console.error('      3. Expected redirect URI:', `${BACKEND_URL}/api/auth/google/callback`);
               console.error('      4. Make sure redirect URI is EXACTLY: http://localhost:5000/api/auth/google/callback');
               console.error('      5. Check Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID');
               console.error('      6. Verify Authorized redirect URIs includes: http://localhost:5000/api/auth/google/callback');
             }
      
      res.redirect(`${FRONTEND_URL}/?error=oauth_failed&message=${encodeURIComponent(tokenError.message || 'Failed to exchange authorization code')}`);
      return;
    }

    if (!tokens.id_token) {
      console.error('No ID token received from Google');
      res.redirect(`${FRONTEND_URL}/?error=oauth_failed&message=no_id_token`);
      return;
    }

    console.log('✅ Tokens received, verifying ID token...');
    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      console.error('Failed to get payload from ID token');
      res.redirect(`${FRONTEND_URL}/?error=oauth_failed&message=invalid_token`);
      return;
    }

    const { sub: googleId, email, name, picture } = payload;
    console.log('👤 User info received:', { email, name, googleId: googleId.substring(0, 10) + '...' });

    if (!email) {
      console.error('No email provided by Google');
      res.redirect(`${FRONTEND_URL}/?error=no_email`);
      return;
    }

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      // Check if user exists by email (for existing users who want to link Google)
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        console.log('🔗 Linking Google account to existing user');
        // Link Google account to existing user
        existingUser.googleId = googleId;
        existingUser.name = name || existingUser.name;
        existingUser.picture = picture || existingUser.picture;
        await existingUser.save();
        user = existingUser;
        isNewUser = false;
      } else {
        console.log('✨ Creating new user with Google OAuth');
        // Create new user with Google OAuth
        user = new User({
          email,
          googleId,
          name,
          picture,
        });
        await user.save();
        isNewUser = true;
      }
    } else {
      console.log('♻️  Updating existing user info');
      // Update user info if needed
      if (name && user.name !== name) user.name = name;
      if (picture && user.picture !== picture) user.picture = picture;
      await user.save();
      isNewUser = false;
    }

    // Generate JWT token
    const token = generateToken((user._id as any).toString());
    console.log('✅ JWT token generated, redirecting to frontend...');
    console.log(`🔗 Redirecting to: ${FRONTEND_URL}/auth/callback?token=${token.substring(0, 20)}...&success=true`);

    // Redirect to frontend with token
    const redirectUrl = `${FRONTEND_URL}/auth/callback?token=${encodeURIComponent(token)}&success=true&message=${encodeURIComponent(isNewUser ? 'Account created successfully' : 'Login successful')}`;
    console.log('📍 Full redirect URL length:', redirectUrl.length);
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Get FRONTEND_URL for error redirect
    const { FRONTEND_URL } = getEnvVars();
    
    // Provide more specific error messages
    let errorType = 'oauth_error';
    if (error.message?.includes('invalid_grant')) {
      errorType = 'invalid_grant';
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      errorType = 'redirect_uri_mismatch';
    }
    
    res.redirect(`${FRONTEND_URL}/?error=${errorType}&message=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
};

/**
 * @route   POST /api/auth/google/verify
 * @desc    Verify Google ID token (for frontend direct verification)
 * @access  Public
 */
export const verifyGoogleToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    
    // Get environment variables
    const { GOOGLE_CLIENT_ID } = getEnvVars();
    const client = getOAuth2Client();

    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      res.status(503).json({
        success: false,
        message: 'Google OAuth is not configured',
      });
      return;
    }

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({
        success: false,
        message: 'Invalid Google token',
      });
      return;
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      res.status(400).json({
        success: false,
        message: 'Email not provided by Google',
      });
      return;
    }

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId });
    let isNewUser = false;

    if (!user) {
      // Check if user exists by email
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = googleId;
        existingUser.name = name || existingUser.name;
        existingUser.picture = picture || existingUser.picture;
        await existingUser.save();
        user = existingUser;
        isNewUser = false; // Existing user, just linked Google
      } else {
        // Create new user with Google OAuth
        user = new User({
          email,
          googleId,
          name,
          picture,
        });
        await user.save();
        isNewUser = true; // New user created
      }
    } else {
      // Update user info if needed
      if (name && user.name !== name) user.name = name;
      if (picture && user.picture !== picture) user.picture = picture;
      await user.save();
      isNewUser = false; // Existing user
    }

    // Generate JWT token
    const token = generateToken((user._id as any).toString());

    // Send response
    res.status(200).json({
      success: true,
      message: isNewUser ? 'Account created successfully' : 'Login successful',
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
    console.error('Verify Google token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify Google token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

