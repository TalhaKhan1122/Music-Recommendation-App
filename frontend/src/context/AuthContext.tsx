import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as loginAPI, signup as signupAPI, getCurrentUser, LoginData, SignupData, User } from '../api/auth.api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Initialize from localStorage immediately (synchronous)
  const getStoredAuth = () => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('🔍 Checking localStorage:', { 
        hasToken: !!storedToken, 
        hasUser: !!storedUser 
      });
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        console.log('✅ Found stored credentials, restoring session for:', parsedUser.email);
        return {
          token: storedToken,
          user: parsedUser,
        };
      }
    } catch (error) {
      console.error('❌ Error reading from localStorage:', error);
    }
    console.log('❌ No stored credentials found');
    return { token: null, user: null };
  };

  const storedAuth = getStoredAuth();
  const [user, setUser] = useState<User | null>(storedAuth.user);
  const [token, setToken] = useState<string | null>(storedAuth.token);
  // If we have stored auth, we need to verify it (isLoading = true)
  // If we don't have stored auth, there's nothing to verify (isLoading = false)
  const [isLoading, setIsLoading] = useState(!!(storedAuth.token && storedAuth.user));

  // Debug logging in useEffect to avoid render issues
  useEffect(() => {
    console.log('🔐 Auth State Initialized:', { 
      hasUser: !!user, 
      hasToken: !!token, 
      isLoading, 
      isAuthenticated: !!(user && token),
      userEmail: user?.email
    });
  }, []);

  // Verify token in background if we have stored credentials
  useEffect(() => {
    if (token && user) {
      console.log('🔄 Verifying token in background...');
      // Verify token in background, but don't block the UI
      verifyToken().catch(() => {
        // If verification fails, we'll handle it in verifyToken
      });
    } else if (!token && !user) {
      // Only log this on initial mount, not on every render
      // This is normal when user hasn't logged in yet
      if (isLoading === false) {
        // Already set to false, this is just initial state
        return;
      }
      // No stored auth, so we're done loading
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  const verifyToken = async () => {
    try {
      const response = await getCurrentUser();
      if (response && response.data && response.data.user) {
        setUser(response.data.user);
        // Update localStorage with fresh user data
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsLoading(false);
        console.log('Token verified successfully, user authenticated');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Token verification failed:', error);
      
      // Check if it's a 401 error (unauthorized) - token is invalid
      const status = error.status || error.response?.status;
      const errorMessage = error.message || '';
      
      const isUnauthorized = status === 401 || 
                            errorMessage.includes('401') || 
                            errorMessage.includes('Unauthorized') ||
                            errorMessage.includes('No token') ||
                            errorMessage.includes('invalid token') ||
                            errorMessage.includes('Token expired') ||
                            errorMessage.includes('authentication');
      
      if (isUnauthorized) {
        // Token is invalid, clear everything
        console.log('Token is invalid (401), clearing auth data');
        logout();
      } else {
        // For network errors or other errors, keep the stored data
        // User can still use the app with cached data
        console.log('Network or other error, keeping cached auth data. Error:', errorMessage);
        setIsLoading(false);
      }
    }
  };

  const login = async (data: LoginData) => {
    try {
      const response = await loginAPI(data);
      
      if (response.data) {
        const { user, token } = response.data;
        
        // Store in state
        setUser(user);
        setToken(token);
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const response = await signupAPI(data);
      
      if (response.data) {
        const { user, token } = response.data;
        
        // Store in state
        setUser(user);
        setToken(token);
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsLoading(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    setUser,
    setToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

