import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BeatifyLogo from '../assets/beatify-logo.png';

interface HeaderProps {
  onCtaClick?: () => void;
  onSignInClick?: () => void;
  onSignUpClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCtaClick, onSignInClick, onSignUpClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
      const headerOffset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    
    // Close mobile menu if open
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'Contact Us', href: '#contact' },
    { label: 'Blog', href: '#blog' }
  ];

  return (
    <header className="w-full bg-transparent absolute top-0 left-0 right-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
  to=""
  className="flex items-center  px-1 py-1"
>
  <img
    src={BeatifyLogo}
    alt="Beatify Logo"
    className="h-14 sm:h-16 w-auto object-contain"
  />

  <span
    className="text-white text-xl sm:text-2xl font-semibold leading-none"
    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
  >
    Beatify
  </span>
</Link>
          {/* Desktop Navigation Items */}
          <div className="hidden md:flex md:items-center md:gap-6 lg:gap-8">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors cursor-pointer"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop Sign In / Sign Up Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <button 
              onClick={() => {
                if (onSignInClick) {
                  onSignInClick();
                } else if (onCtaClick) {
                  onCtaClick();
                }
              }}
              className="text-white hover:text-gray-300 px-4 py-2 text-sm font-medium transition-colors" 
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                if (onSignUpClick) {
                  onSignUpClick();
                } else if (onCtaClick) {
                  onCtaClick();
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap" 
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Sign Up
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => {
                if (onSignUpClick) {
                  onSignUpClick();
                } else if (onCtaClick) {
                  onCtaClick();
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white p-2"
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20">
            <div className="flex flex-col gap-4 pt-4">
              {navItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-white text-sm font-medium hover:text-gray-300 transition-colors cursor-pointer"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-white/20">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSignInClick) {
                      onSignInClick();
                    } else if (onCtaClick) {
                      onCtaClick();
                    }
                  }}
                  className="text-white text-sm font-medium hover:text-gray-300 transition-colors text-left"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSignUpClick) {
                      onSignUpClick();
                    } else if (onCtaClick) {
                      onCtaClick();
                    }
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
