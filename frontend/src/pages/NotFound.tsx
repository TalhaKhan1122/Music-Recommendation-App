import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ 
      background: 'linear-gradient(to bottom, #0a0a0a 0%, #1a0a1a 100%)'
    }}>
      <div className="text-center text-white px-4">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl mb-8">Page not found</p>
        <Link 
          to="/" 
          className="inline-block bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

