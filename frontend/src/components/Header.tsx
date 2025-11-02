import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface HeaderProps {
  onCtaClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCtaClick }) => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { label: 'Our Science', href: '#science' },
    { label: 'ADHD', href: '#adhd' },
    { label: 'About Us', href: '#about' },
    { label: 'Download', href: '#download' },
    { label: 'Gift', href: '#gift' }
  ];

  return (
    <header className="w-full bg-transparent absolute top-0 left-0 right-0 z-50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-12 py-4 sm:py-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-white sm:w-6 sm:h-6"
            >
              <path 
                d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z" 
                fill="white"
              />
              <path 
                d="M12 18a1 1 0 01-1-1v-2H8a1 1 0 100 2h3v1a1 1 0 001 1zm5-1a1 1 0 100-2h-3v1a1 1 0 001 1z" 
                fill="white"
              />
            </svg>
            <span className="text-white text-lg sm:text-xl font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>brain.fm</span>
          </Link>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex md:items-center md:gap-6 lg:gap-8">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-white text-sm font-medium hover:text-gray-300 transition-colors"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA Button */}
          <div className="hidden sm:block">
            <button 
              onClick={() => {
                if (onCtaClick) {
                  onCtaClick();
                } else {
                  navigate('/dashboard');
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap" 
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              <span className="hidden lg:inline">GO TO WEB APP</span>
              <span className="lg:hidden">WEB APP</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              onClick={() => {
                if (onCtaClick) {
                  onCtaClick();
                } else {
                  navigate('/dashboard');
                }
              }}
              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              GO
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
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-sm font-medium hover:text-gray-300 transition-colors"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
