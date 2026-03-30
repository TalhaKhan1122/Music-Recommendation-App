import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { forgotPassword } from '../api/auth.api';
import { CloseIcon } from '../components/icons';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);

  const handleClose = () => {
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await forgotPassword({ email });
      setIsSubmitted(true);
      
      // Check if reset link is provided (development mode)
      if ((response as any).resetLink) {
        setResetLink((response as any).resetLink);
      }
      
      toast.success('Password reset email sent! Please check your inbox (and spam folder).', {
        position: 'top-right',
        autoClose: 5000,
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email. Please try again.', {
        position: 'top-right',
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        onClick={handleClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-5 sm:p-6 md:p-8 my-auto"
        style={{ zIndex: 10 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <CloseIcon size="20" className="sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 pr-8 sm:pr-12">Forgot Password</h1>
          <p className="text-gray-400 text-sm sm:text-base mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors mb-4"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 mx-auto text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-gray-400 text-sm mb-6">
                We've sent a password reset link to <strong className="text-white">{email}</strong>.
                Please check your inbox and click the link to reset your password.
              </p>
              <p className="text-gray-500 text-xs mb-6">
                Don't see the email? Check your spam folder. The link will expire in 10 minutes.
              </p>
              {resetLink && (
                <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                  <p className="text-blue-400 text-xs font-semibold mb-2">Development Mode - Reset Link:</p>
                  <a
                    href={resetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 text-xs break-all hover:text-blue-200 underline block"
                  >
                    {resetLink}
                  </a>
                  <p className="text-gray-400 text-xs mt-2">
                    Click the link above to reset your password (for testing purposes)
                  </p>
                </div>
              )}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setEmail('');
                    setIsSubmitted(false);
                  }}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Send Another Email
                </button>
                <Link
                  to="/login"
                  className="block text-center text-blue-500 hover:text-blue-400 text-sm font-medium"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          )}

        {/* Yopmail Info */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-400">
          <p>
            Using <strong className="text-white">yopmail</strong>? Check your inbox at{' '}
            <a
              href="https://yopmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 underline"
            >
              yopmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
    </div>
  );
};

export default ForgotPassword;

