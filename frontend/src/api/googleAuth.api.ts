const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Initiate Google OAuth flow by redirecting to backend
 */
export const initiateGoogleAuth = (): void => {
  const authUrl = `${API_BASE_URL}/auth/google`;
  console.log('🚀 Initiating Google OAuth...');
  console.log('📍 Redirecting to:', authUrl);
  console.log('🌐 API_BASE_URL:', API_BASE_URL);
  
  try {
    window.location.href = authUrl;
  } catch (error: any) {
    console.error('❌ Error redirecting to Google OAuth:', error);
    throw error;
  }
};

/**
 * Verify Google ID token from frontend
 */
export const verifyGoogleToken = async (idToken: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/google/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Google authentication failed');
  }

  return result;
};

/**
 * Get Google Client ID for frontend OAuth
 */
export const getGoogleClientId = (): string => {
  return GOOGLE_CLIENT_ID;
};

