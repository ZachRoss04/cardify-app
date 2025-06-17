import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, ArrowRight, RefreshCcw, Zap, Sun, Moon, Inbox } from 'lucide-react'; // Added Inbox
import ReactCardFlip from 'react-card-flip'; // Import react-card-flip
import { Card } from '../../types';
import { CardsOnTheSpotAPI } from '../../lib/api';
import Button from '../ui/Button';

interface StudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string | null;
}

const StudyModal: React.FC<StudyModalProps> = ({ isOpen, onClose, deckId }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState<string | null>(null); // State for deck title
  const [isDarkMode, setIsDarkMode] = useState(false); // Simple dark mode toggle state

  const fetchDeckCards = useCallback(async () => {
    if (!deckId) return;
    setIsLoading(true);
    setError(null);
    try {
      // TODO: This API endpoint might not exist yet. 
      // We might need to fetch the full deck details which includes cards,
      // or create a new endpoint like getDeckCards(deckId).
      // For now, assuming CardsOnTheSpotAPI.getDeck(deckId) returns { cards: Card[] }
      const deckDetails = await CardsOnTheSpotAPI.getDeck(deckId);
      if (deckDetails) { // deckDetails itself could be null if not found
        setCards(deckDetails.cards || []); // Use cards array or empty if undefined
        setDeckTitle(deckDetails.title);   // Set the deck title
        setCurrentCardIndex(0);
        setIsFlipped(false);
        if (!deckDetails.cards || deckDetails.cards.length === 0) {
            setError('This deck has no cards to study.'); // Specific message for empty deck
        }
      } else {
        setCards([]);
        setError('No cards found in this deck, or deck data is invalid.');
      }
    } catch (err) {
      console.error('Failed to fetch deck cards:', err);
      setError('Could not load cards for studying. Please try again.');
      setCards([]);
    } finally {
      setIsLoading(false);
    }
  }, [deckId]);

  useEffect(() => {
    if (isOpen && deckId) {
      fetchDeckCards();
    } else if (!isOpen) {
      // Reset state when modal is closed
      setCards([]);
      setDeckTitle(null); // Reset deck title
      setCurrentCardIndex(0);
      setIsFlipped(false);
      setError(null);
      // deckId is managed by parent
    }
  }, [isOpen, deckId, fetchDeckCards]);

  const handleNextCard = useCallback(() => {
    if (cards.length === 0) return;
    setCurrentCardIndex(prevIndex => {
      if (prevIndex < cards.length - 1) {
        setIsFlipped(false);
        return prevIndex + 1;
      }
      return prevIndex;
    });
  }, [cards.length, setCurrentCardIndex, setIsFlipped]); // Added missing dependencies

  const handlePrevCard = useCallback(() => {
    if (cards.length === 0) return;
    setCurrentCardIndex(prevIndex => {
      if (prevIndex > 0) {
        setIsFlipped(false);
        return prevIndex - 1;
      }
      return prevIndex;
    });
  }, [cards.length, setCurrentCardIndex, setIsFlipped]); // Added missing dependencies

  const handleFlipCard = useCallback(() => {
    if (cards.length === 0) return;
    setIsFlipped(prevIsFlipped => !prevIsFlipped);
  }, [cards.length, setIsFlipped]); // Added missing dependencies

  // Keyboard navigation effect
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isLoading || error) return; // Don't navigate if loading or error

      switch (event.key) {
        case 'ArrowRight':
          handleNextCard();
          break;
        case 'ArrowLeft':
          handlePrevCard();
          break;
        case ' ':
          event.preventDefault(); // Prevent page scroll on spacebar
          handleFlipCard();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, error, handleNextCard, handlePrevCard, handleFlipCard]); // Dependencies are now correctly ordered

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    // Here you would typically also add/remove a class from document.body
    // or use a context provider to manage theme globally.
  };

  // Need to memoize these handlers if they are in useEffect dependency array and defined in component scope
  // However, for this case, it's simpler to ensure they are stable or add them to the dep array carefully.
  // For now, let's assume they are stable enough or add to dependency array of keydown effect.

  if (!isOpen || !deckId) return null;

  const currentCard = cards[currentCardIndex];
  const progressPercentage = cards.length > 0 ? ((currentCardIndex + 1) / cards.length) * 100 : 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'} ${isDarkMode ? 'dark' : ''}`}>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl h-[70vh] md:h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Studying: {deckTitle || (deckId ? 'Loading title...' : 'Deck')}
          </h3>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              icon={isDarkMode ? <Sun size={20} /> : <Moon size={20} />} 
              onClick={toggleDarkMode} 
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2" // p-2 to make it squarer
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <></>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              icon={<X size={24} />} 
              onClick={onClose} 
              className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2" // p-2 to make it squarer
              aria-label="Close study modal"
            >
              <></>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-10 relative">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
              <Zap size={48} className="text-blue-500 animate-pulse mb-4" />
              <p className="text-gray-700 dark:text-gray-300">Loading cards...</p>
            </div>
          )}
          {error && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10 p-4">
              <RefreshCcw size={48} className="text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400 text-center mb-4">{error}</p>
              <Button onClick={fetchDeckCards} variant="secondary">Try Again</Button>
            </div>
          )}

          {!isLoading && !error && currentCard && (
            <div 
              className={`w-full h-full max-h-[40vh] md:max-h-[50vh] aspect-[3/2] rounded-lg flex items-center justify-center cursor-pointer select-none`}
              onClick={handleFlipCard} // Keep click handler on the container for simplicity
            >
              <ReactCardFlip isFlipped={isFlipped} flipDirection="horizontal" containerClassName="w-full h-full">
                {/* Front of the card */}
                <div className="w-full h-full bg-gray-100 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center p-6 md:p-8 text-center">
                  <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800 dark:text-gray-100">
                    {currentCard.front}
                  </p>
                </div>
                
                {/* Back of the card */}
                <div className="w-full h-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg shadow-lg flex items-center justify-center p-6 md:p-8 text-center">
                  <p className="text-xl md:text-2xl lg:text-3xl text-blue-600 dark:text-blue-400">
                    {currentCard.back}
                  </p>
                </div>
              </ReactCardFlip>
            </div>
          )}
          {!isLoading && !error && !currentCard && cards.length === 0 && (
             <div className="text-center flex flex-col items-center justify-center h-full">
                <Inbox size={48} className="text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-xl text-gray-500 dark:text-gray-400">This deck has no cards to study.</p>
             </div>
          )}
        </div>

        {/* Footer & Navigation */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 mb-3">
            <div 
              className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <Button 
              onClick={handlePrevCard} 
              disabled={currentCardIndex === 0 || isLoading || cards.length === 0}
              variant="outline"
              className="flex items-center dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={18} className="mr-2" /> Previous
            </Button>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Card {cards.length > 0 ? currentCardIndex + 1 : 0} of {cards.length}
            </p>
            
            <Button 
              onClick={handleNextCard} 
              disabled={currentCardIndex === cards.length - 1 || isLoading || cards.length === 0}
              variant="outline"
              className="flex items-center dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Next <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyModal;
