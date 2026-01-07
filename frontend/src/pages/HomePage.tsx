import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Header, LoginSignupModal } from '../components';
import NewHero from '../components/NewHero';
import AIFacialRecognitionSection from '../components/AIFacialRecognitionSection';
import RecommendationStationSection from '../components/RecommendationStationSection';
import SearchPlayerSection from '../components/SearchPlayerSection';
import DownloadSection from '../components/DownloadSection';
import Footer from '../components/Footer';
import { useAuth } from '../context';

gsap.registerPlugin(ScrollTrigger);

const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('signup');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      console.log('✅ User is authenticated, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleSignInClick = () => {
    setActiveTab('login');
    setIsModalOpen(true);
  };

  const handleSignUpClick = () => {
    setActiveTab('signup');
    setIsModalOpen(true);
  };

  // Handle error messages from OAuth redirects
  useEffect(() => {
    const error = searchParams.get('error');
    const errorMessage = searchParams.get('message');
    
    if (error) {
      let userFriendlyMessage = 'An error occurred. Please try again.';
      let shouldOpenModal = false;
      
      if (error === 'oauth_cancelled') {
        userFriendlyMessage = 'Google sign-in was cancelled.';
      } else if (error === 'oauth_failed') {
        userFriendlyMessage = errorMessage 
          ? `Authentication failed: ${decodeURIComponent(errorMessage)}`
          : 'Google authentication failed. Please try again.';
        shouldOpenModal = true;
      } else if (error === 'no_email') {
        userFriendlyMessage = 'No email provided by Google. Please try again.';
        shouldOpenModal = true;
      } else if (error === 'invalid_grant') {
        userFriendlyMessage = 'Authorization code expired. Please try again.';
        shouldOpenModal = true;
      } else if (error === 'redirect_uri_mismatch') {
        userFriendlyMessage = 'Configuration error. Please contact support.';
      } else if (error === 'oauth_error') {
        userFriendlyMessage = errorMessage
          ? `Error: ${decodeURIComponent(errorMessage)}`
          : 'An error occurred during authentication.';
        shouldOpenModal = true;
      }
      
      toast.error(userFriendlyMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
      
      // Open modal if it's a retryable error
      if (shouldOpenModal) {
        setActiveTab('signup');
        setIsModalOpen(true);
      }
      
      // Remove error params from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      newSearchParams.delete('message');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation - fade in from top
      if (headerRef.current) {
        const headerElement = headerRef.current.querySelector('header');
        if (headerElement) {
          // Set initial state
          gsap.set(headerElement, { y: -50, opacity: 0 });
          // Animate in
          gsap.to(headerElement, {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
          });
        }
      }

      // Hero section animations
      if (heroRef.current) {
        const heroTitle = heroRef.current.querySelector('h1');
        const heroSubtitle = heroRef.current.querySelector('p');
        const heroButtons = heroRef.current.querySelectorAll('a');

        // Title animation
        if (heroTitle) {
          gsap.from(heroTitle, {
            y: 50,
            opacity: 0,
            duration: 1,
            delay: 0.2,
            ease: 'power3.out',
          });
        }

        // Subtitle animation
        if (heroSubtitle) {
          gsap.from(heroSubtitle, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.4,
            ease: 'power3.out',
          });
        }

        // Buttons animation
        heroButtons.forEach((button, index) => {
          gsap.from(button, {
            y: 20,
            opacity: 0,
            scale: 0.9,
            duration: 0.6,
            delay: 0.6 + index * 0.1,
            ease: 'back.out(1.7)',
          });
        });
      }

      // Section animations with ScrollTrigger
      const sections = document.querySelectorAll('section[id]');
      sections.forEach((section) => {
        const title = section.querySelector('h2');
        const paragraphs = section.querySelectorAll('p');
        if (title) {
          // Set initial state but ensure visibility
          gsap.set(title, { opacity: 1, y: 0 });
          gsap.from(title, {
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
          });
        }
        // Also animate paragraphs
        paragraphs.forEach((p) => {
          gsap.set(p, { opacity: 1 });
          gsap.from(p, {
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power3.out',
          });
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden" style={{ scrollBehavior: 'smooth' }}>
      <div ref={headerRef}>
        <Header 
          onSignInClick={handleSignInClick}
          onSignUpClick={handleSignUpClick}
        />
      </div>
      <section id="home" ref={heroRef} className="hero-section">
        <NewHero onGetStarted={handleSignUpClick} />
      </section>
      <section id="about" className="ai-recognition-section">
        <AIFacialRecognitionSection />
      </section>
      <section id="features" className="recommendation-station-section">
        <RecommendationStationSection />
      </section>
      <section id="contact" className="search-player-section">
        <SearchPlayerSection />
      </section>
      <section id="blog" className="download-section">
        <DownloadSection onGetStarted={handleSignUpClick} />
      </section>
      <Footer />
      <LoginSignupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        initialTab={activeTab}
      />
    </div>
  );
};

export default HomePage;
