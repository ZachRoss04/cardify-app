import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';
import { Card } from '../../types'; // Import Card type
import { CardifyAPI } from '../../lib/api'; // Import CardifyAPI

interface FrenzyGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string | null;
}

const FrenzyGameModal: React.FC<FrenzyGameModalProps> = ({ isOpen, onClose, deckId }) => {
  const [currentView, setCurrentView] = useState<'mode_select' | 'playing' | 'results'>('mode_select');
  const [selectedGameType, setSelectedGameType] = useState<'type_answer' | 'multiple_choice' | null>(null);
  const [gameCards, setGameCards] = useState<Card[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState<boolean>(false);
  const [gameError, setGameError] = useState<string | null>(null);

  // Game state for 'Type the Answer' & 'Multiple Choice'
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [questionsAttempted, setQuestionsAttempted] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60); // Default 60 seconds
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  // State specific to 'Type the Answer'
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isCurrentAnswerCorrect, setIsCurrentAnswerCorrect] = useState<boolean | null>(null);

  // State for score saving
  const [isSavingScore, setIsSavingScore] = useState<boolean>(false);
  const [saveScoreError, setSaveScoreError] = useState<string | null>(null);

  // State specific to 'Multiple Choice'
  const [answerChoices, setAnswerChoices] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  // Generic shuffle function
  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const generateAnswerChoices = (correctAnswer: string, allCards: Card[], currentCardId: string) => {
    const distractors = allCards
      .filter(card => 
        card && 
        typeof card.back === 'string' && // Ensure card.back is a string
        card.id !== currentCardId && 
        card.back.trim().toLowerCase() !== correctAnswer.trim().toLowerCase()
      )
      .map(card => card.back as string); // Safe to cast as string after filter

    // Shuffle distractors and pick 3, ensuring uniqueness
    const shuffledDistractors = shuffleArray([...new Set(distractors)]);
    const finalDistractors = shuffledDistractors.slice(0, 3);

    // If not enough unique distractors, fill with generic options or duplicates (less ideal)
    while (finalDistractors.length < 3) {
      // This is a fallback, ideally decks have enough variety
      finalDistractors.push(`Option ${finalDistractors.length + 1}`); 
    }

    const choices = shuffleArray([correctAnswer, ...finalDistractors]);
    setAnswerChoices(choices);
  };

  // Reset state when modal is closed or deckId changes
  useEffect(() => {
    if (isOpen) {
      setCurrentView('mode_select');
      setSelectedGameType(null);
    } else {
      // Optionally, you can also reset when it's fully closed if animations are involved
      // For now, resetting on isOpen true is fine to ensure fresh state each time it opens.
    }
  }, [isOpen, deckId]);


  // Effect to reset game state when modal opens or deck changes (before fetching cards)
  useEffect(() => {
    if (isOpen) {
      setCurrentView('mode_select');
      setSelectedGameType(null);
      // Reset all game-specific states
      setGameCards([]);
      setCurrentCardIndex(0);
      setScore(0);
      setQuestionsAttempted(0);
      setQuestionsCorrect(0);
      setTimeLeft(60); // Reset timer to initial duration
      setIsTimerActive(false);
      setUserAnswer('');
      setIsAnswerRevealed(false);
      setIsCurrentAnswerCorrect(null);
      setGameError(null);
      setIsLoadingCards(false);
      // Reset multiple choice state
      setAnswerChoices([]);
      setSelectedAnswer(null);
    } else {
      setIsTimerActive(false); // Ensure timer stops if modal is closed abruptly
    }
  }, [isOpen, deckId]);

  // Effect to fetch cards when game starts
  useEffect(() => {
    if (currentView === 'playing' && deckId && selectedGameType) {
      const fetchGameCards = async () => {
        setIsLoadingCards(true);
        setGameError(null);
        setGameCards([]); // Clear previous cards
        try {
          console.log(`[FrenzyGameModal] Fetching cards for deck: ${deckId}`);
          const fetchedCards = await CardifyAPI.getCardsForDeck(deckId);
          if (fetchedCards && fetchedCards.length > 0) {
            setGameCards(shuffleArray([...fetchedCards]));
            console.log(`[FrenzyGameModal] Fetched and shuffled ${fetchedCards.length} cards.`);
            // Reset game progress for new set of cards
            setCurrentCardIndex(0);
            setScore(0);
            setQuestionsAttempted(0);
            setQuestionsCorrect(0);
            setTimeLeft(60); // Reset timer
            setUserAnswer('');
            setIsAnswerRevealed(false);
            setIsCurrentAnswerCorrect(null);
            // Reset multiple choice state for new game
            setAnswerChoices([]);
            setSelectedAnswer(null);
            setIsTimerActive(true); // Start timer only after cards are loaded
          } else {
            setGameError('No cards found in this deck, or deck is empty.');
            console.log('[FrenzyGameModal] No cards found or deck empty.');
          }
        } catch (error) {
          console.error('[FrenzyGameModal] Error fetching game cards:', error);
          setGameError('Failed to load cards for the game. Please try again.');
        } finally {
          setIsLoadingCards(false);
        }
      };
      fetchGameCards();
    }
  }, [currentView, deckId, selectedGameType]);

  const handleAnswerSubmit = () => {
    if (isAnswerRevealed || !isTimerActive || userAnswer.trim() === '' || !gameCards[currentCardIndex]) return;

    setQuestionsAttempted(prev => prev + 1);
    const correctAnswer = gameCards[currentCardIndex].back.trim().toLowerCase();
    const userAnswerProcessed = userAnswer.trim().toLowerCase();

    if (userAnswerProcessed === correctAnswer) {
      setScore(prev => prev + 10); // Arbitrary 10 points for correct answer
      setQuestionsCorrect(prev => prev + 1);
      setIsCurrentAnswerCorrect(true);
    } else {
      setIsCurrentAnswerCorrect(false);
    }
    setIsAnswerRevealed(true);
  };

  const handleMultipleChoiceSubmit = () => {
    if (selectedAnswer === null || isAnswerRevealed || !isTimerActive || !gameCards[currentCardIndex]) return;

    setQuestionsAttempted(prev => prev + 1);
    const correctAnswer = gameCards[currentCardIndex].back.trim().toLowerCase();
    const userAnswerProcessed = selectedAnswer.trim().toLowerCase();

    if (userAnswerProcessed === correctAnswer) {
      setScore(prev => prev + 10); // Arbitrary 10 points
      setQuestionsCorrect(prev => prev + 1);
      setIsCurrentAnswerCorrect(true);
    } else {
      setIsCurrentAnswerCorrect(false);
    }
    setIsAnswerRevealed(true);
  };

  const handleNextCard = () => {
    if (!isTimerActive) return;

    setIsAnswerRevealed(false);
    setUserAnswer('');
    setIsCurrentAnswerCorrect(null);
    // Reset multiple choice state for next card
    setAnswerChoices([]);
    setSelectedAnswer(null);

    if (currentCardIndex < gameCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
    } else {
      // Last card attempted, end game
      setIsTimerActive(false);
      setCurrentView('results');
      console.log('[FrenzyGameModal] All cards attempted, game over.');
      // Score saving will be handled in results view or a dedicated effect for game end
    }
  };

  // Timer effect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (isTimerActive && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      setIsTimerActive(false);
      // Game over logic (e.g., move to results view)
      console.log('[FrenzyGameModal] Timer ended, game over.');
      setCurrentView('results'); 
      // Potentially save score here or in a separate handler for game end
    }
    return () => clearInterval(timerInterval);
  }, [isTimerActive, timeLeft]);

  // Effect to save score when game ends and results view is shown
  useEffect(() => {
    if (currentView === 'results' && selectedGameType && questionsAttempted > 0) {
      const saveScore = async () => {
        setIsSavingScore(true);
        setSaveScoreError(null);
        try {
          const scoreData = {
            deck_id: deckId, // Can be null if it's a general game
            game_mode: selectedGameType,
            score: score,
            questions_attempted: questionsAttempted,
            questions_correct: questionsCorrect,
          };
          await CardifyAPI.saveGameScore(scoreData);
          console.log('[FrenzyGameModal] Score saved successfully.', scoreData);
        } catch (error) {
          console.error('[FrenzyGameModal] Error saving score:', error);
          setSaveScoreError('Failed to save your score. Please try again later.');
        } finally {
          setIsSavingScore(false);
        }
      };
      saveScore();
    }
    // Reset saving state if view changes from results or no game was played
    if (currentView !== 'results') {
        setIsSavingScore(false);
        setSaveScoreError(null);
    }
  }, [currentView, deckId, selectedGameType, score, questionsAttempted, questionsCorrect]);

  // Effect to generate answer choices for multiple choice mode
  useEffect(() => {
    if (
      selectedGameType === 'multiple_choice' && 
      gameCards.length > 0 && 
      currentCardIndex < gameCards.length
    ) {
      const currentCard = gameCards[currentCardIndex];
      // Ensure currentCard and its properties are defined and of the correct type
      if (currentCard && typeof currentCard.back === 'string' && typeof currentCard.id === 'string') {
        generateAnswerChoices(currentCard.back, gameCards, currentCard.id);
      } else {
        // Fallback or error handling if card data is not as expected
        console.warn('[FrenzyGameModal] Current card data incomplete for generating choices:', currentCard);
        setAnswerChoices([]); // Clear choices if data is bad
      }
    }
  }, [currentCardIndex, gameCards, selectedGameType]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <Button
          variant="ghost"
          size="sm" // Changed from 'icon' to 'sm'
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close game modal"
        >
          <X size={20} />
        </Button>
        {currentView === 'mode_select' && (
          <>
            <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600">Flashcard Frenzy!</h2>
            {deckId ? (
              <p className="text-sm text-gray-500 text-center mb-1">Deck: <span className="font-medium text-gray-700">Active</span></p>
            ) : (
              <p className="text-sm text-red-500 text-center mb-1">No deck selected for Frenzy.</p>
            )}
            <p className="text-center text-gray-700 mb-8">Choose your challenge:</p>
            <div className="space-y-4">
              <Button
                fullWidth
                size="lg"
                variant="primary"
                onClick={() => { setSelectedGameType('type_answer'); setCurrentView('playing'); }}
                disabled={!deckId}
              >
                Type the Answer
              </Button>
              <Button
                fullWidth
                size="lg"
                variant="secondary"
                onClick={() => { setSelectedGameType('multiple_choice'); setCurrentView('playing'); }}
                disabled={!deckId}
              >
                Multiple Choice
              </Button>
            </div>
            <div className="mt-8 flex justify-center">
              <Button variant="ghost" onClick={onClose} className="text-gray-600 hover:text-gray-800">
                Cancel Game
              </Button>
            </div>
          </>
        )}

        {currentView === 'playing' && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-center">Playing: {selectedGameType?.replace('_', ' ')}</h2>
            {isLoadingCards && <p className="text-center text-gray-600 my-8">Loading cards...</p>}
            {gameError && (
              <div className="text-center my-8">
                <p className="text-red-500">Error: {gameError}</p>
                <Button variant="outline" onClick={() => setCurrentView('mode_select')} className="mt-4">
                  Back to Mode Select
                </Button>
              </div>
            )}
            
            {!isLoadingCards && !gameError && gameCards.length > 0 && (
              <div className="w-full">
                <div className="flex justify-between items-center mb-4 text-sm">
                  <p>Score: <span className="font-bold text-indigo-600">{score}</span></p>
                  <p>Time: <span className={`font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>{Math.floor(timeLeft / 60)}:{('0' + timeLeft % 60).slice(-2)}</span></p>
                  <p>Card: <span className="font-bold">{currentCardIndex + 1} / {gameCards.length}</span></p>
                </div>

                {selectedGameType === 'type_answer' && (
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-6 rounded-lg shadow text-center min-h-[100px] flex items-center justify-center">
                      <p className="text-lg font-medium text-gray-800">
                        {gameCards[currentCardIndex]?.front}
                      </p>
                    </div>
                    {!isAnswerRevealed ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleAnswerSubmit(); }}>
                        <input 
                          type="text"
                          value={userAnswer}
                          onChange={(e) => setUserAnswer(e.target.value)}
                          placeholder="Type your answer..."
                          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={isAnswerRevealed || !isTimerActive}
                        />
                        <Button 
                          type="submit" 
                          fullWidth 
                          className="mt-3"
                          disabled={isAnswerRevealed || !isTimerActive || userAnswer.trim() === ''}
                        >
                          Submit Answer
                        </Button>
                      </form>
                    ) : (
                      <div className="text-center p-4 rounded-lg shadow space-y-3 
                        ${isCurrentAnswerCorrect === true ? 'bg-green-50 border-green-200' : ''}
                        ${isCurrentAnswerCorrect === false ? 'bg-red-50 border-red-200' : ''}
                        ${isCurrentAnswerCorrect === null ? 'bg-gray-50 border-gray-200' : ''}"
                      >
                        {isCurrentAnswerCorrect === true && <p className="font-semibold text-green-700">Correct!</p>}
                        {isCurrentAnswerCorrect === false && (
                          <>
                            <p className="font-semibold text-red-700">Incorrect!</p>
                            <p className="text-sm text-gray-700">The correct answer was: <span className="font-bold">{gameCards[currentCardIndex]?.back}</span></p>
                          </>
                        )}
                        <Button 
                          onClick={handleNextCard} 
                          fullWidth
                          disabled={!isTimerActive}
                        >
                          Next Card
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {/* Multiple Choice UI */}
                {selectedGameType === 'multiple_choice' && gameCards.length > 0 && gameCards[currentCardIndex] && (
                  <div className="space-y-4">
                    <div className="bg-gray-100 p-6 rounded-lg shadow text-center min-h-[100px] flex items-center justify-center">
                      <p className="text-lg font-medium text-gray-800">
                        {gameCards[currentCardIndex]?.front}
                      </p>
                    </div>
                    {!isAnswerRevealed ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {answerChoices.map((choice, index) => (
                          <Button 
                            key={index} 
                            variant={selectedAnswer === choice ? 'primary' : 'outline'}
                            onClick={() => setSelectedAnswer(choice)}
                            fullWidth
                            className="p-4 h-auto text-left justify-start"
                            disabled={isAnswerRevealed || !isTimerActive}
                          >
                            {choice}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 rounded-lg shadow space-y-3 
                        ${isCurrentAnswerCorrect === true ? 'bg-green-50 border-green-200' : ''}
                        ${isCurrentAnswerCorrect === false ? 'bg-red-50 border-red-200' : ''}
                        ${isCurrentAnswerCorrect === null ? 'bg-gray-50 border-gray-200' : ''}"
                      >
                        {/* Feedback and Next Card button (similar to Type the Answer) */}
                        {isCurrentAnswerCorrect === true && <p className="font-semibold text-green-700">Correct!</p>}
                        {isCurrentAnswerCorrect === false && (
                          <>
                            <p className="font-semibold text-red-700">Incorrect!</p>
                            <p className="text-sm text-gray-700">The correct answer was: <span className="font-bold">{gameCards[currentCardIndex]?.back}</span></p>
                          </>
                        )}
                        <Button 
                          onClick={handleNextCard} 
                          fullWidth
                          disabled={!isTimerActive}
                        >
                          Next Card
                        </Button>
                      </div>
                    )}
                    {selectedAnswer && !isAnswerRevealed && (
                        <Button 
                            onClick={handleMultipleChoiceSubmit}
                            fullWidth 
                            className="mt-3"
                            disabled={isAnswerRevealed || !isTimerActive}
                        >
                            Submit Answer
                        </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isLoadingCards && !gameError && gameCards.length === 0 && currentView === 'playing' && (
                <div className="text-center my-8">
                    <p className="text-orange-600">This deck has no cards. Add some cards to play!</p>
                    <Button variant="outline" onClick={() => setCurrentView('mode_select')} className="mt-4">
                        Back to Mode Select
                    </Button>
                </div>
            )}

            <div className="mt-8 pt-4 border-t flex justify-between items-center">
              <Button 
                variant="ghost" 
                onClick={() => { setIsTimerActive(false); setCurrentView('mode_select'); }}
                disabled={isLoadingCards}
                className="text-gray-600 hover:text-gray-800"
              >
                Quit Game
              </Button>
              {/* End Game button might be removed if timer ending or finishing cards is the only way to end */}
            </div>
          </>
        )}

        {currentView === 'results' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-indigo-600 mb-6">Game Over!</h2>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-md space-y-3 mb-6">
              <p className="text-lg">Final Score: <span className="font-bold text-xl text-indigo-700">{score}</span></p>
              <p className="text-md text-gray-700">Questions Attempted: <span className="font-semibold">{questionsAttempted}</span></p>
              <p className="text-md text-gray-700">Questions Correct: <span className="font-semibold text-green-600">{questionsCorrect}</span></p>
              <p className="text-md text-gray-700">Accuracy: <span className="font-semibold">{questionsAttempted > 0 ? ((questionsCorrect / questionsAttempted) * 100).toFixed(0) : 0}%</span></p>
            </div>

            {isSavingScore && <p className="text-sm text-gray-600 mb-3">Saving your score...</p>}
            {saveScoreError && <p className="text-sm text-red-500 mb-3">Error: {saveScoreError}</p>}
            {!isSavingScore && !saveScoreError && questionsAttempted > 0 && <p className="text-sm text-green-600 mb-3">Score saved!</p>}
            {!isSavingScore && !saveScoreError && questionsAttempted === 0 && <p className="text-sm text-gray-500 mb-3">No questions attempted, score not saved.</p>}

            <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <Button 
                variant="primary" 
                onClick={() => {
                  // Reset relevant states for a new game before going to mode select
                  setCurrentCardIndex(0);
                  setScore(0);
                  setQuestionsAttempted(0);
                  setQuestionsCorrect(0);
                  setTimeLeft(60);
                  setUserAnswer('');
                  setIsAnswerRevealed(false);
                  setIsCurrentAnswerCorrect(null);
                  setGameError(null);
                  setGameCards([]); // Clear cards so they are re-fetched for the new game/deck
                  // Reset multiple choice specific states for play again
                  setAnswerChoices([]);
                  setSelectedAnswer(null);
                  setCurrentView('mode_select');
                }}
                className="w-full sm:w-auto"
              >
                Play Again
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrenzyGameModal;
