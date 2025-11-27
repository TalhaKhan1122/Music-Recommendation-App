import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context';
import { getCurrentUser } from '../api/auth.api';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser } = useAuth();
  
  const token = searchParams.get('token');
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        const errorMessage = searchParams.get('message');
        let userFriendlyMessage = 'Google authentication failed. Please try again.';
        
        if (error === 'oauth_cancelled') {
          userFriendlyMessage = 'Google sign-in was cancelled.';
        } else if (error === 'oauth_failed') {
          userFriendlyMessage = errorMessage 
            ? `Authentication failed: ${decodeURIComponent(errorMessage)}`
            : 'Google authentication failed. Please try again.';
        } else if (error === 'no_email') {
          userFriendlyMessage = 'No email provided by Google. Please try again.';
        } else if (error === 'invalid_grant') {
          userFriendlyMessage = 'Authorization code expired. Please try again.';
        } else if (error === 'redirect_uri_mismatch') {
          userFriendlyMessage = 'Configuration error. Please contact support.';
        } else if (error === 'oauth_error') {
          userFriendlyMessage = errorMessage
            ? `Error: ${decodeURIComponent(errorMessage)}`
            : 'An error occurred during authentication.';
        }
        
        toast.error(userFriendlyMessage, {
          position: 'top-right',
          autoClose: 5000,
        });
        navigate('/');
        return;
      }

      if (success === 'true' && token) {
        try {
          console.log('✅ Received token from Google OAuth callback');
          
          // Store token in localStorage
          localStorage.setItem('token', token);
          
          // Fetch user info using the token
          console.log('🔍 Fetching user information...');
          const response = await getCurrentUser();
          
          if (response.success && response.data?.user) {
            console.log('✅ User information retrieved:', response.data.user);
            
            // Store user in localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Update AuthContext state
            setToken(token);
            setUser(response.data.user);
            
            toast.success('Google authentication successful! Welcome! 🎉', {
              position: 'top-right',
              autoClose: 3000,
            });
            
            // Navigate to dashboard
            navigate('/dashboard');
          } else {
            throw new Error('Failed to fetch user information');
          }
        } catch (error: any) {
          console.error('❌ Error handling Google callback:', error);
          console.error('Error details:', error.message);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          toast.error(error.message || 'Failed to complete authentication. Please try again.', {
            position: 'top-right',
            autoClose: 4000,
          });
          navigate('/');
        }
      } else if (!token) {
        console.warn('⚠️ No token received in callback');
        toast.error('Authentication failed: No token received', {
          position: 'top-right',
          autoClose: 4000,
        });
        navigate('/');
      } else {
        console.warn('⚠️ Callback received but success is not true');
        navigate('/');
      }
    };

    handleCallback();
  }, [token, success, error, navigate, searchParams, setToken, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

