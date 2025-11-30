import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Header, Hero, LoginSignupModal, AIModeSection } from '../components';
import { useAuth } from '../context';

gsap.registerPlugin(ScrollTrigger);

const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const heroRef = useRef<HTMLElement>(null);
  const aiSectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLElement>(null);

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
        const heroContent = heroRef.current.querySelector('.hero-content');
        const heroIllustration = heroRef.current.querySelector('.hero-illustration');
        const heroTitle = heroRef.current.querySelector('h1');
        const heroSubtitle = heroRef.current.querySelector('p');
        const heroButton = heroRef.current.querySelector('button');

        // Title animation - split text effect
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

        // Button animation
        if (heroButton) {
          gsap.from(heroButton, {
            y: 20,
            opacity: 0,
            scale: 0.9,
            duration: 0.6,
            delay: 0.6,
            ease: 'back.out(1.7)',
          });
        }

        // Illustration animation - slide from right
        if (heroIllustration) {
          gsap.from(heroIllustration, {
            x: 100,
            opacity: 0,
            duration: 1.2,
            delay: 0.3,
            ease: 'power3.out',
          });
        }
      }

      // AI Mode Section animations with ScrollTrigger
      if (aiSectionRef.current) {
        const aiTitle = aiSectionRef.current.querySelector('h2');
        const aiSubtitle = aiSectionRef.current.querySelector('p');
        const aiCard = aiSectionRef.current.querySelector('.ai-card');
        const aiText = aiSectionRef.current.querySelector('.ai-text');
        const aiIllustration = aiSectionRef.current.querySelector('svg');

        // Title and subtitle animation
        if (aiTitle) {
          gsap.from(aiTitle, {
            scrollTrigger: {
              trigger: aiTitle,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
          });
        }

        if (aiSubtitle) {
          gsap.from(aiSubtitle, {
            scrollTrigger: {
              trigger: aiSubtitle,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.2,
            ease: 'power3.out',
          });
        }

        // Card animation
        if (aiCard) {
          gsap.from(aiCard, {
            scrollTrigger: {
              trigger: aiCard,
              start: 'top 75%',
              toggleActions: 'play none none none',
            },
            y: 60,
            opacity: 0,
            scale: 0.95,
            duration: 1,
            ease: 'power3.out',
          });
        }

        // Text content animation
        if (aiText) {
          gsap.from(aiText, {
            scrollTrigger: {
              trigger: aiText,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
          });
        }

        // Illustration animation
        if (aiIllustration) {
          gsap.from(aiIllustration, {
            scrollTrigger: {
              trigger: aiIllustration,
              start: 'top 80%',
              toggleActions: 'play none none none',
            },
            x: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
          });

          // Animate sound waves
          const waves = aiIllustration.querySelectorAll('path');
          waves.forEach((wave, index) => {
            gsap.to(wave, {
              scrollTrigger: {
                trigger: aiIllustration,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
              opacity: 0.8,
              duration: 1.5,
              delay: index * 0.1,
              ease: 'power2.inOut',
              yoyo: true,
              repeat: -1,
            });
          });
        }
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div ref={headerRef}>
        <Header onCtaClick={() => setIsModalOpen(true)} />
      </div>
      <section ref={heroRef} className="hero-section">
        <Hero />
      </section>
      <section ref={aiSectionRef} className="ai-section">
        <AIModeSection />
      </section>
      <LoginSignupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
};

export default HomePage;
