import React, { useState, useEffect } from 'react';
import { PlusCircle, AlertCircle, Lightbulb } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Button from '../components/ui/Button';
import DeckCard from '../components/features/DeckCard';
import DeckModal from '../components/features/DeckModal';
import StudyModal from '../components/features/StudyModal'; // Import StudyModal
import FrenzyGameModal from '../components/features/FrenzyGameModal'; // Import FrenzyGameModal
import { CardsOnTheSpotAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Deck } from '../types';

const DashboardPage: React.FC = () => {
  const { user, firstName } = useAuth(); // Added firstName, removed authLoading
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false); // New state for study modal
  const [studyingDeckId, setStudyingDeckId] = useState<string | null>(null); // New state for deck being studied
  const [isFrenzyModalOpen, setIsFrenzyModalOpen] = useState(false); // State for Frenzy game modal
  const [frenzyDeckId, setFrenzyDeckId] = useState<string | null>(null); // State for deck ID for Frenzy game
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const sortDecks = (deckList: Deck[]): Deck[] => {
    return [...deckList].sort((a, b) => {
      if (a.is_favorited && !b.is_favorited) return -1;
      if (!a.is_favorited && b.is_favorited) return 1;
      // Secondary sort: by creation date (newest first)
      // Ensure created_at exists and is valid before comparing
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  };

  const fetchDecks = async () => {
    console.log('[DashboardPage] fetchDecks called'); // DEBUG
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedDecks = await CardsOnTheSpotAPI.getDecks();
      console.log('[DashboardPage] Fetched decks response:', fetchedDecks); // DEBUG
      setDecks(sortDecks(fetchedDecks as Deck[])); // Sort decks after fetching
    } catch (err) {
      console.error('Failed to fetch decks:', err);
      setError('Could not load your flashcard decks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewDeck = (deckId: string) => {
    console.log('Preview deck:', deckId);
    window.location.href = `/deck/${deckId}`;
  };

  const handleStudyDeck = (deckId: string) => {
    console.log('Study deck:', deckId); // Placeholder action
    setStudyingDeckId(deckId);
    setIsStudyModalOpen(true);
    // We will create and render StudyModalComponent later
  };

  const handleDeleteDeck = async (deckId: string) => {
    try {
      await CardsOnTheSpotAPI.deleteDeck(deckId);
      setDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
      console.log(`Deck ${deckId} deleted successfully.`);
    } catch (err) {
      console.error('Failed to delete deck:', err);
      setError(`Could not delete deck. Please try again. Error: ${err instanceof Error ? err.message : String(err)}`);
    } 
  };

  const handleDeckCreated = () => {
    console.log('[DashboardPage] handleDeckCreated called'); // DEBUG
    fetchDecks(); // Re-fetch decks after creation
    // The modal's own onClose will handle closing it.
  };

  const handleToggleFavorite = async (deckId: string, newStatus: boolean) => {
    try {
      const updatedDeck = await CardsOnTheSpotAPI.toggleDeckFavorite(deckId, newStatus);
      if (updatedDeck) {
        setDecks(prevDecks => 
          sortDecks(prevDecks.map(d => d.id === deckId ? { ...d, is_favorited: newStatus } : d))
        );
      } else {
        // Handle case where updatedDeck is null (e.g., RLS prevented update, or deck not found)
        setError('Could not update favorite status. Please try again.');
        // Optionally re-fetch to ensure UI consistency if optimistic update failed
        // fetchDecks(); 
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      setError('Could not update favorite status. Please try again.');
    }
  };

  const handlePlayFrenzy = (deckId: string) => {
    console.log(`[DashboardPage] Play Frenzy initiated for deck: ${deckId}`);
    setFrenzyDeckId(deckId);
    setIsFrenzyModalOpen(true);
    // Later: This will open the FrenzyGameModal
  };

  console.log('[DashboardPage] Rendering with decks state:', decks); // DEBUG
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, {firstName || user?.email || 'User'}!</h1>
              <p className="mt-1 text-sm text-gray-600">Here are your flashcard decks.</p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)} 
              icon={<PlusCircle size={18} />}
            >
              Create New Deck
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 w-64 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-56 bg-gray-200 rounded mb-6"></div>
                <div className="h-10 w-40 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : error && isLoading === false ? (
            <div className="h-full flex flex-col items-center justify-center p-5">
              <AlertCircle size={48} className="text-red-500 mb-3" />
              <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={fetchDecks}>Try Again</Button>
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border shadow-sm">
              <div className="flex justify-center mb-4">
                <Lightbulb size={48} className="text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Mind is a Blank Canvas (for now!)</h3>
              <p className="text-gray-600 mb-6">
                Let's fill it with knowledge! Conjure up your first flashcard deck and unleash your inner genius.
              </p>
              <Button onClick={() => setIsModalOpen(true)} icon={<PlusCircle size={16} />}>\n                Create New Deck\n              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map(deck => (
                <DeckCard 
                  key={deck.id} 
                  deck={deck} 
                  onPreview={handlePreviewDeck} 
                  onStudy={handleStudyDeck} // Added onStudy
                  onDelete={handleDeleteDeck}
                  onToggleFavorite={handleToggleFavorite} // Added for favoriting
                  onPlayFrenzy={handlePlayFrenzy} // Added for Flashcard Frenzy
                />
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      <DeckModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onDeckCreated={handleDeckCreated} />
      <StudyModal 
        isOpen={isStudyModalOpen} 
        onClose={() => {
          setIsStudyModalOpen(false);
          setStudyingDeckId(null); // Reset deckId when closing
        }}
        deckId={studyingDeckId} 
      />
      <FrenzyGameModal 
        isOpen={isFrenzyModalOpen} 
        onClose={() => {
          setIsFrenzyModalOpen(false);
          setFrenzyDeckId(null);
        }}
        deckId={frenzyDeckId}
      />
    </div>
  );
};

export default DashboardPage;