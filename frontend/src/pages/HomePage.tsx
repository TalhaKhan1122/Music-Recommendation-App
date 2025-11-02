import React, { useState } from 'react';
import { Header, Hero, LoginSignupModal, AIModeSection } from '../components';

const HomePage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
