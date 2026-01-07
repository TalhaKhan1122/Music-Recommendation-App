const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface SignupData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      name?: string;
      picture?: string;
      createdAt: string;
    };
    token: string;
  };
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  createdAt: string;
}

/**
 * Sign up a new user
 */
export const signup = async (data: SignupData): Promise<AuthResponse> => {
  try {
    console.log('📝 Attempting signup...', { email: data.email, API_BASE_URL });
    
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📥 Signup response status:', response.status, response.statusText);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📥 Signup response data:', result);
    
    if (!response.ok) {
      throw new Error(result.message || 'Signup failed');
    }

    return result;
  } catch (error: any) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - Is the backend server running?');
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    console.log('🔐 Attempting login...', { email: data.email, API_BASE_URL });
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📥 Login response status:', response.status, response.statusText);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text);
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('📥 Login response data:', result);
    
    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }

    return result;
  } catch (error: any) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 Network error - Is the backend server running?');
      throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Get current user (requires authentication)
 */
export const getCurrentUser = async (): Promise<{ success: boolean; data: { user: User } }> => {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('❌ getCurrentUser: No token found in localStorage');
    throw new Error('No token found');
  }

  console.log('🔍 getCurrentUser: Token found, length:', token.length);
  console.log('🔍 getCurrentUser: Making request to:', `${API_BASE_URL}/auth/me`);

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('📥 getCurrentUser: Response status:', response.status);

    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ getCurrentUser: Request failed:', result);
      // Don't remove localStorage here - let AuthContext handle it
      // This allows AuthContext to distinguish between network errors and auth errors
      const error = new Error(result.message || 'Failed to get user');
      (error as any).status = response.status;
      throw error;
    }

    console.log('✅ getCurrentUser: Success, user data received');
    return result;
  } catch (error: any) {
    console.error('❌ getCurrentUser: Error occurred:', error);
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Cannot connect to server');
    }
    throw error;
  }
};

