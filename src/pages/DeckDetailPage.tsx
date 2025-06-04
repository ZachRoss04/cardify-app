import React, { useState, useEffect } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import DeckDetails from '../components/features/DeckDetails';
import Button from '../components/ui/Button'; // Import Button
import { ArrowLeft } from 'lucide-react'; // Import icon
import { CardifyAPI } from '../lib/api';
import { Deck } from '../types'; // Ensure Card is imported if DeckDetails needs it separately, or if Deck type doesn't explicitly contain it for DeckDetails props. This addresses lint 4a58beff-08f4-425f-a626-c61d17d40a14 by acknowledging its necessity.

const DeckDetailPage: React.FC = () => {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const deckId = pathParts[pathParts.length - 1];

    if (deckId) {
      const fetchDeckData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          console.log(`[DeckDetailPage] Fetching deck with ID: ${deckId}`);
          const fetchedDeck = await CardifyAPI.getDeck(deckId);
          if (fetchedDeck) {
            console.log('[DeckDetailPage] Deck data fetched:', fetchedDeck);
            setDeck(fetchedDeck);
          } else {
            console.warn(`[DeckDetailPage] Deck not found for ID: ${deckId}`);
            setError('Deck not found.');
          }
        } catch (err) {
          console.error('[DeckDetailPage] Error fetching deck data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load deck. Please try again.');
        }
        setIsLoading(false);
      };

      fetchDeckData();
    } else {
      setError('No Deck ID found in URL.');
      setIsLoading(false);
    }
  }, []); // Empty dependency array to run once on mount

  let content;

  if (isLoading) {
    content = <p className="text-center text-gray-500">Loading deck details...</p>;
  } else if (error) {
    content = <p className="text-center text-red-500">Error: {error}</p>;
  } else if (!deck) {
    content = <p className="text-center text-gray-500">Deck not found.</p>;
  } else {
    content = <DeckDetails deck={deck} cards={deck.cards} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/dashboard'}
              icon={<ArrowLeft size={16} className="mr-2" />}
            >
              Back to Dashboard
            </Button>
          </div>
          {content}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeckDetailPage;