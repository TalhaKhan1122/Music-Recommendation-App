import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Header, Hero, LoginSignupModal, AIModeSection } from '../components';

const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle error messages from OAuth redirects
  useEffect(() => {
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    
    if (error) {
      let userFriendlyMessage = 'An error occurred. Please try again.';
      
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
      
      // Remove error params from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      newSearchParams.delete('message');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <Header onCtaClick={() => setIsModalOpen(true)} />
      <Hero />
      <AIModeSection />
      <LoginSignupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default HomePage;
