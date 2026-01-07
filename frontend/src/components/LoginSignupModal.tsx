import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context';
import { initiateGoogleAuth } from '../api/googleAuth.api';
import { CloseIcon, EyeIcon, GoogleIcon } from './icons';

interface LoginSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

const LoginSignupModal: React.FC<LoginSignupModalProps> = ({ isOpen, onClose, initialTab = 'signup' }) => {
  const navigate = useNavigate();
  const { login: loginUser, signup: signupUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  
  // Update activeTab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toggleTabLoading, setToggleTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-5 sm:p-6 md:p-8 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <CloseIcon size="20" className="sm:w-6 sm:h-6" />
        </button>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 pr-8 sm:pr-12">
          Let us know you better
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => {
              if (activeTab !== 'login' && !toggleTabLoading) {
                setToggleTabLoading(true);
                setTimeout(() => {
                  setActiveTab('login');
                  setError(null);
                  setToggleTabLoading(false);
                }, 150);
              }
            }}
            disabled={toggleTabLoading || isLoading}
            className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-gray-300'
            } ${toggleTabLoading || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {toggleTabLoading && activeTab === 'signup' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Log In
              </span>
            ) : (
              'Log In'
            )}
          </button>
          <button
            onClick={() => {
              if (activeTab !== 'signup' && !toggleTabLoading) {
                setToggleTabLoading(true);
                setTimeout(() => {
                  setActiveTab('signup');
                  setError(null);
                  setToggleTabLoading(false);
                }, 150);
              }
            }}
            disabled={toggleTabLoading || isLoading}
            className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === 'signup'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-gray-300'
            } ${toggleTabLoading || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {toggleTabLoading && activeTab === 'login' ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sign up
              </span>
            ) : (
              'Sign up'
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setIsLoading(true);

          try {
            if (activeTab === 'signup') {
              if (password !== confirmPassword) {
                setError('Passwords do not match');
                setIsLoading(false);
                return;
              }

              if (!agreeToTerms) {
                setError('Please agree to Terms of Services and Privacy Policy');
                setIsLoading(false);
                return;
              }

              await signupUser({ email, password, confirmPassword });
              toast.success('Account created successfully! Welcome! 🎉', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              onClose();
              navigate('/dashboard');
            } else {
              await loginUser({ email, password });
              toast.success('Login successful! Welcome back! 👋', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
              });
              onClose();
              navigate('/dashboard');
            }
          } catch (err: any) {
            const errorMessage = err.message || 'An error occurred. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage, {
              position: 'top-right',
              autoClose: 4000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          } finally {
            setIsLoading(false);
          }
        }}>
          {activeTab === 'signup' ? (
            <>
              {/* Email Field */}
              <div className="mb-3 sm:mb-4">
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              {/* Password Field */}
              <div className="mb-3 sm:mb-4">
                <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 sm:pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon size="18" className="sm:w-5 sm:h-5" show={showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-4 sm:mb-6">
                <label htmlFor="confirmPassword" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 sm:pr-12"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon size="18" className="sm:w-5 sm:h-5" show={showConfirmPassword} />
                  </button>
                </div>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold mb-4 sm:mb-6 transition-colors"
              >
                {isLoading ? 'Signing up...' : 'Sign Up'}
              </button>
            </>
          ) : (
            <>
              {/* Login Form */}
              <div className="mb-3 sm:mb-4">
                <label htmlFor="loginEmail" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="loginEmail"
                  name="email"
                  autoComplete="username email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <div className="mb-4 sm:mb-6">
                <label htmlFor="loginPassword" className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="loginPassword"
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold mb-4 sm:mb-6 transition-colors"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
            </>
          )}

          {/* Separator */}
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="flex-1 border-t border-gray-700"></div>
            <span className="px-3 sm:px-4 text-xs sm:text-sm text-gray-400">Or</span>
            <div className="flex-1 border-t border-gray-700"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="mb-4 sm:mb-6">
            <button
              type="button"
              onClick={async () => {
                console.log('👆 Google login button clicked');
                setError(null);
                setIsLoading(true);
                try {
                  console.log('✅ Calling initiateGoogleAuth()...');
                  initiateGoogleAuth();
                  // Note: setIsLoading(false) won't run because page redirects
                  // But we set it in case redirect fails
                  setTimeout(() => {
                    setIsLoading(false);
                    toast.info('Redirecting to Google...', {
                      position: 'top-right',
                      autoClose: 2000,
                    });
                  }, 500);
                } catch (error: any) {
                  console.error('❌ Error in Google login button handler:', error);
                  setIsLoading(false);
                  const errorMessage = error.message || 'Failed to initiate Google login. Please try again.';
                  setError(errorMessage);
                  toast.error(errorMessage, {
                    position: 'top-right',
                    autoClose: 4000,
                  });
                }
              }}
              disabled={isLoading}
              className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 sm:gap-3 border border-gray-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Redirecting...</span>
                </>
              ) : (
                <>
                  <GoogleIcon size="18" className="sm:w-5 sm:h-5" />
                  <span>{activeTab === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
                </>
              )}
            </button>
          </div>

          {/* Terms and Privacy */}
          {activeTab === 'signup' && (
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 sm:mt-1 w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500 flex-shrink-0"
              />
              <label htmlFor="terms" className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                By creating an account, you agree to our{' '}
                <a href="#" className="text-blue-500 hover:text-blue-400 underline">
                  Terms of Services
                </a>
                {' '}and{' '}
                <a href="#" className="text-blue-500 hover:text-blue-400 underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginSignupModal;

