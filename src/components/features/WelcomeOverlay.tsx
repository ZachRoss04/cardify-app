import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface WelcomeOverlayProps {
  onComplete: () => void;
}

const WelcomeOverlay: React.FC<WelcomeOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  // Auto-progress through the steps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step < 2) {
        setStep(step + 1);
      } else {
        setClosing(true);
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [step, onComplete]);

  // Define the welcome messages
  const messages = [
    {
      title: "Welcome to Cardify",
      description: "Your AI-powered flashcard assistant",
      icon: <Sparkles className="h-10 w-10 text-blue-400" />
    },
    {
      title: "Turn any content into flashcards",
      description: "Upload PDFs, paste URLs, or enter text",
      icon: <BookOpen className="h-10 w-10 text-green-400" />
    },
    {
      title: "Powered by GPT-4o mini",
      description: "Advanced AI creates perfect flashcards for effective learning",
      icon: <AlertCircle className="h-10 w-10 text-purple-400" />
    }
  ];

  return (
    <div className={`fixed inset-0 z-50 ${closing ? 'opacity-0' : 'opacity-100'} transition-opacity duration-1000`}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 animate-gradient" />
      
      {/* Decorative particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => {
          // Pre-compute all random values to avoid recomputing during renders
          const width = `${Math.random() * 30 + 5}px`;
          const height = `${Math.random() * 30 + 5}px`;
          const top = `${Math.random() * 100}%`;
          const left = `${Math.random() * 100}%`;
          // Use separate animation properties instead of the shorthand
          const delay = `${Math.random() * 2}s`;
          
          return (
            <div 
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width,
                height,
                top,
                left,
                animationName: 'float',
                animationDuration: '6s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: delay
              }}
            />
          );
        })}
      </div>
      
      <div className="h-full flex flex-col items-center justify-center text-white text-center p-8">
        <div 
          className={`transform transition-all duration-1000 ease-out ${
            step === 0 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          {messages[0].icon}
          <h1 className="text-4xl font-bold mt-6 mb-2">{messages[0].title}</h1>
          <p className="text-xl text-blue-100">{messages[0].description}</p>
        </div>
        
        <div 
          className={`transform transition-all duration-1000 ease-out absolute ${
            step === 1 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          {messages[1].icon}
          <h1 className="text-4xl font-bold mt-6 mb-2">{messages[1].title}</h1>
          <p className="text-xl text-blue-100">{messages[1].description}</p>
        </div>
        
        <div 
          className={`transform transition-all duration-1000 ease-out absolute ${
            step === 2 ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
        >
          {messages[2].icon}
          <h1 className="text-4xl font-bold mt-6 mb-2">{messages[2].title}</h1>
          <p className="text-xl text-blue-100">{messages[2].description}</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOverlay;
