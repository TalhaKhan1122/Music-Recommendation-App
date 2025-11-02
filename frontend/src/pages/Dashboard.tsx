import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a0a1a 100%)'
    }}>
      {/* Top Right Menu and Logout */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        {/* User Email Display */}
        {user && (
          <div className="hidden sm:block text-white text-sm opacity-70">
            {user.email}
          </div>
        )}
        
        {/* Menu Icon */}
        <Link to="/" className="text-white hover:text-gray-300 transition-colors inline-block p-2 hover:bg-white/10 rounded-lg">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="6" height="6" rx="1" fill="currentColor"/>
            <rect x="11" y="3" width="6" height="6" rx="1" fill="currentColor"/>
            <line x1="3" y1="13" x2="21" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="text-white hover:text-red-400 transition-colors inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all"
          style={{ 
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline text-sm font-medium">Logout</span>
        </button>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Panel - Go with AI Model */}
          <div className="lg:col-span-2 rounded-3xl p-8 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300"
               style={{ 
                 background: 'rgba(20, 20, 30, 0.6)',
                 backdropFilter: 'blur(20px)',
                 border: '1px solid rgba(255, 255, 255, 0.1)',
                 minHeight: '500px'
               }}>
            {/* Pink/Purple Glow Background */}
            <div className="absolute inset-0 opacity-30" style={{
              background: 'radial-gradient(circle at 30% 50%, #EC4899 0%, #A855F7 50%, transparent 70%)',
            }}></div>
            
            {/* Illustration Area - AI/Person at desk */}
            <div className="relative z-10 h-full flex items-center justify-center">
              <div className="relative w-full max-w-md">
                {/* Person Illustration */}
                <svg width="100%" height="400" viewBox="0 0 400 400" className="relative z-10">
                  {/* Glow effect */}
                  <circle cx="200" cy="200" r="150" fill="url(#pinkGradient)" opacity="0.4" />
                  <defs>
                    <radialGradient id="pinkGradient">
                      <stop offset="0%" stopColor="#EC4899" />
                      <stop offset="100%" stopColor="#A855F7" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  {/* Desk */}
                  <rect x="50" y="280" width="300" height="20" rx="4" fill="#9CA3AF" opacity="0.8" />
                  
                  {/* Computer Monitor */}
                  <rect x="120" y="220" width="160" height="100" rx="8" fill="#1F2937" />
                  <rect x="130" y="230" width="140" height="70" rx="4" fill="#111827" />
                  <line x1="150" y1="250" x2="250" y2="250" stroke="#EC4899" strokeWidth="3" />
                  <line x1="150" y1="270" x2="240" y2="270" stroke="#EC4899" strokeWidth="2" />
                  
                  {/* Keyboard */}
                  <rect x="160" y="300" width="80" height="30" rx="4" fill="#374151" />
                  
                  {/* Person - Head */}
                  <circle cx="200" cy="160" r="35" fill="#A855F7" />
                  
                  {/* Person - Headphones */}
                  <ellipse cx="200" cy="145" rx="50" ry="25" fill="white" opacity="0.9" />
                  <rect x="140" y="135" width="120" height="30" rx="15" fill="white" opacity="0.9" />
                  
                  {/* Person - Body */}
                  <rect x="175" y="180" width="50" height="80" rx="25" fill="#A855F7" />
                  
                  {/* AI Icon/Sparkles */}
                  <circle cx="250" cy="140" r="8" fill="#EC4899" opacity="0.8">
                    <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="270" cy="150" r="6" fill="#A855F7" opacity="0.7">
                    <animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            </div>
            
            {/* Label */}
            <div className="absolute bottom-8 left-8 z-20">
              <h2 className="text-white text-4xl font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                Go with AI Model
              </h2>
            </div>
          </div>

          {/* Right Panel - Three Sections */}
          <div className="flex flex-col gap-6">
            {/* Search and Enjoy Music */}
            <div className="flex-1 rounded-3xl p-6 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                 style={{ 
                   background: 'rgba(20, 20, 30, 0.6)',
                   backdropFilter: 'blur(20px)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                   minHeight: '150px'
                 }}>
              {/* Blue Glow */}
              <div className="absolute inset-0 opacity-30" style={{
                background: 'radial-gradient(circle at 70% 50%, #3B82F6 0%, #2563EB 50%, transparent 70%)',
              }}></div>
              
              <div className="relative z-10 h-full flex items-center justify-between">
                <h3 className="text-white text-2xl font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Just search and enjoy the music
                </h3>
                
                {/* Illustration - Person with device */}
                <div className="flex-shrink-0">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {/* Glow */}
                    <circle cx="60" cy="60" r="40" fill="url(#blueGradient)" opacity="0.4" />
                    <defs>
                      <radialGradient id="blueGradient">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Person */}
                    <circle cx="60" cy="40" r="12" fill="#3B82F6" />
                    <ellipse cx="60" cy="35" rx="18" ry="10" fill="white" opacity="0.9" />
                    <rect x="48" y="32" width="24" height="15" rx="7" fill="white" opacity="0.9" />
                    <rect x="52" y="48" width="16" height="30" rx="8" fill="#3B82F6" />
                    
                    {/* Device/Phone */}
                    <rect x="75" y="45" width="20" height="35" rx="3" fill="#1F2937" />
                    <rect x="77" y="47" width="16" height="25" rx="2" fill="#111827" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Meditate */}
            <div className="flex-1 rounded-3xl p-6 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                 style={{ 
                   background: 'rgba(20, 20, 30, 0.6)',
                   backdropFilter: 'blur(20px)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                   minHeight: '150px'
                 }}>
              {/* Green Glow */}
              <div className="absolute inset-0 opacity-30" style={{
                background: 'radial-gradient(circle at 70% 50%, #10B981 0%, #059669 50%, transparent 70%)',
              }}></div>
              
              <div className="relative z-10 h-full flex items-center justify-between">
                <h3 className="text-white text-2xl font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Meditate
                </h3>
                
                {/* Illustration - Meditating person */}
                <div className="flex-shrink-0">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {/* Glow */}
                    <circle cx="60" cy="60" r="40" fill="url(#greenGradient)" opacity="0.4" />
                    <defs>
                      <radialGradient id="greenGradient">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Person in meditative pose */}
                    <circle cx="60" cy="35" r="10" fill="#10B981" />
                    <ellipse cx="60" cy="30" rx="15" ry="8" fill="white" opacity="0.9" />
                    <rect x="55" y="27" width="10" height="12" rx="5" fill="white" opacity="0.9" />
                    <ellipse cx="50" cy="50" rx="8" ry="25" fill="#10B981" />
                    <ellipse cx="70" cy="50" rx="8" ry="25" fill="#10B981" />
                    
                    {/* Plants */}
                    <circle cx="35" cy="70" r="8" fill="#10B981" opacity="0.6" />
                    <circle cx="85" cy="75" r="8" fill="#10B981" opacity="0.6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sleep */}
            <div className="flex-1 rounded-3xl p-6 relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                 style={{ 
                   background: 'rgba(20, 20, 30, 0.6)',
                   backdropFilter: 'blur(20px)',
                   border: '1px solid rgba(255, 255, 255, 0.1)',
                   minHeight: '150px'
                 }}>
              {/* Purple Glow */}
              <div className="absolute inset-0 opacity-30" style={{
                background: 'radial-gradient(circle at 70% 50%, #A855F7 0%, #7C3AED 50%, transparent 70%)',
              }}></div>
              
              <div className="relative z-10 h-full flex items-center justify-between">
                <h3 className="text-white text-2xl font-semibold" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  Sleep
                </h3>
                
                {/* Illustration - Sleeping person */}
                <div className="flex-shrink-0">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {/* Glow */}
                    <circle cx="60" cy="60" r="40" fill="url(#purpleGradient)" opacity="0.4" />
                    <defs>
                      <radialGradient id="purpleGradient">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    
                    {/* Bed */}
                    <rect x="30" y="75" width="60" height="25" rx="4" fill="#1E40AF" opacity="0.8" />
                    
                    {/* Person sleeping */}
                    <circle cx="55" cy="65" r="8" fill="#A855F7" />
                    <ellipse cx="55" cy="60" rx="12" ry="7" fill="white" opacity="0.9" />
                    <rect x="50" y="57" width="10" height="10" rx="5" fill="white" opacity="0.9" />
                    <ellipse cx="50" cy="75" rx="6" ry="20" fill="#A855F7" />
                    
                    {/* Nightstand */}
                    <rect x="20" y="70" width="15" height="30" rx="2" fill="#374151" />
                    <circle cx="27.5" cy="75" r="3" fill="#FBBF24" opacity="0.6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Button - Jump Back In */}
        <div className="flex justify-center mt-8">
          <button className="px-8 py-4 rounded-xl text-white font-semibold uppercase tracking-wide hover:bg-opacity-80 transition-all flex items-center gap-2"
                  style={{ 
                    background: 'rgba(20, 20, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
            <span>JUMP BACK IN</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

