import { Card, NewDeck, Deck, User } from '../types'; // Import User from centralized types
import { API_URL, CardifyAPI } from './api'; // Import API_URL and CardifyAPI

export const signupUser = async (email: string): Promise<{ user: User }> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  return {
    user: {
      id: `user_${Math.random().toString(36).substr(2, 9)}`,
      email,
      credits: 2,
      referralCode: `REF${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      decks: [],
    },
  };
};

export const generateDeck = async (deckOptions: NewDeck): Promise<{ cards: Card[] }> => {
  try {
    console.log('[UTILS] Generating deck with options:', {
      title: deckOptions.title,
      sourceType: deckOptions.sourceType,
      cardCount: deckOptions.cardCount,
      clozeStyle: deckOptions.clozeStyle,
      hasSourceValue: !!deckOptions.sourceValue
    });
    
    // Call our real API service
    const result = await CardifyAPI.generateDeck(deckOptions);
    console.log('[UTILS] Successfully generated cards:', result?.cards?.length || 0);
    return result;
  } catch (error: unknown) {
    // Improved error logging
    console.error('[UTILS] Error generating deck:', error);
    if (error instanceof Error) {
      console.error('[UTILS] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    } else {
      console.error('[UTILS] Error details: An unknown error occurred', error);
    }
    throw error;
  }
};

export const regenerateCard = async (deckOptions: NewDeck, cardIndex: number): Promise<Card> => {
  try {
    // For now, just regenerate the entire deck and return the card at the specified index
    // In a production app, you'd have a dedicated endpoint for regenerating a single card
    const { cards } = await generateDeck(deckOptions);
    return cards[cardIndex] || cards[0];
  } catch (error) {
    console.error('Error regenerating card:', error);
    throw error;
  }
};

export const createDeck = async (deckOptions: NewDeck, cards: Card[]): Promise<{ user: User, deckId: string }> => {
  try {
    console.log('[createDeck] Preparing data for /api/decks:', { ...deckOptions, cards });
    console.log(`[createDeck] PRE-FETCH to /api/decks at: ${new Date().toISOString()}`);
    const response = await fetch(`${API_URL}/api/decks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...deckOptions, cards: cards }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    const newDeckFromServer: Deck = await response.json();
    console.log(`Successfully created deck ${newDeckFromServer.id} via backend with ${newDeckFromServer.cards.length} cards.`);

    // In a real app with user authentication, the backend might handle credit deduction and return updated user info.
    // For now, simulate user and credit deduction. The user.decks will be updated by a fresh fetch in the dashboard.
    return {
      user: {
        id: 'user_123', // Simulated user ID
        email: 'user@example.com', // Simulated email
        credits: 0, // Simulate credit being used
        referralCode: 'REF123',
        decks: [], // This will be re-fetched by the dashboard
      },
      deckId: newDeckFromServer.id,
    };
  } catch (error) {
    console.error('Error creating deck via API:', error);
    throw error; // Re-throw to be caught by the caller in DeckModal
  }
};

export const exportToAnki = (cards: Card[], title: string): void => {
  let csvContent = 'Front,Back,Context\n';
  
  cards.forEach((card) => {
    const front = `"${card.front.replace(/"/g, '""')}"`;
    const back = `"${card.back.replace(/"/g, '""')}"`;
    const contextSnippet = card.contextSnippet || 'No context available';
    const context = `"Page: ${card.sourcePage || 'N/A'} - ${contextSnippet.replace(/"/g, '""')}"`;
    
    csvContent += `${front},${back},${context}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_anki.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToQuizlet = (cards: Card[], title: string): void => {
  let csvContent = 'Term,Definition\n';
  
  cards.forEach((card) => {
    const term = `"${card.front.replace(/"/g, '""')}"`;
    const definition = `"${card.back.replace(/"/g, '""')}"`;
    
    csvContent += `${term},${definition}\n`;
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_quizlet.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};