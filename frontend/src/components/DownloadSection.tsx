import React from 'react';

interface DownloadSectionProps {
  onGetStarted?: () => void;
}

const DownloadSection: React.FC<DownloadSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="relative w-full bg-[#0a0a1a] py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12">
        <div className="text-center">
          {/* Get Started Button */}
          <div className="flex justify-center">
            <button
              onClick={onGetStarted}
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-10 py-5 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-purple-500/50 font-semibold text-xl"
              style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
            >
              <span>Get Started</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadSection;

