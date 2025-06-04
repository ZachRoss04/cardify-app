import { Card, NewDeck, Deck, GameScore, NewGameScore } from '../types'; // Added GameScore, NewGameScore
import { supabase } from './supabaseClient'; // Assuming supabaseClient.ts is in the same lib folder or adjust path

// Connect to our backend API server
const USE_MOCK_API = false;
export const API_URL = 'http://localhost:3001';

// For debugging API calls
const debugAPI = (message: string, data?: unknown) => {
  console.log(`[API] ${message}`, data || '');
};

/**
 * Generate a deck of flashcards from source content
 */
export const generateDeck = async (deckOptions: NewDeck): Promise<Deck> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  debugAPI('Generating deck with options:', deckOptions);
  
  try {
    if (USE_MOCK_API) {
      debugAPI('Using mock API implementation');
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock cards
      const mockCards: Card[] = [];
      const cardCount = deckOptions.cardCount || 10;
      
      for (let i = 0; i < cardCount; i++) {
        if (deckOptions.clozeStyle === 'single') {
          mockCards.push({
            id: `card-${i}`,
            front: `This is a ___ card about ${deckOptions.title}`,
            back: `Sample term ${i+1}`
          });
        } else {
          mockCards.push({
            id: `card-${i}`,
            front: `What is an important concept in ${deckOptions.title}?`,
            back: `Sample answer ${i+1}`
          });
        }
      }
      
      return {
        id: `mock-deck-${Date.now()}`,
        title: deckOptions.title || 'Mock Deck',
        cards: mockCards,
        card_count: mockCards.length, // Corrected to snake_case
        created_at: new Date().toISOString(), // Corrected to snake_case
      };
    }
    
    // Real API implementation
    debugAPI('Calling backend API at:', `${API_URL}/api/generate-deck`);
    
    // Handle different types of source content
    const isFileObject = deckOptions.sourceValue instanceof File;
    debugAPI('Source value is a File object:', isFileObject);
    
    let response;
    
    // For file uploads (PDF), use FormData
    if (isFileObject) {
      const formData = new FormData();
      formData.append('file', deckOptions.sourceValue as File);
      formData.append('source_type', deckOptions.sourceType);
      formData.append('deck_title', deckOptions.title || '');
      formData.append('options', JSON.stringify({
        card_count: deckOptions.cardCount || 10,
        cloze_style: deckOptions.clozeStyle || 'none',
        instruction: deckOptions.instruction || '',
        must_include_terms: deckOptions.mustIncludeTerms || []
      }));
      
      debugAPI('Sending FormData with file:', (deckOptions.sourceValue as File).name);
      
      const fetchHeadersFile: HeadersInit = {};
      if (token) {
        fetchHeadersFile['Authorization'] = `Bearer ${token}`;
      }
      response = await fetch(`${API_URL}/api/generate-deck`, {
        method: 'POST',
        headers: fetchHeadersFile,
        body: formData
      });
    } else {
      // For text and URL, use JSON
      const fetchHeadersJson: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        fetchHeadersJson['Authorization'] = `Bearer ${token}`;
      }
      response = await fetch(`${API_URL}/api/generate-deck`, {
        method: 'POST',
        headers: fetchHeadersJson,
        body: JSON.stringify({
          source_type: deckOptions.sourceType,
          source_content: deckOptions.sourceValue,
          deck_title: deckOptions.title,
          options: {
            card_count: deckOptions.cardCount || 10,
            cloze_style: deckOptions.clozeStyle || 'none',
            instruction: deckOptions.instruction || '',
            must_include_terms: deckOptions.mustIncludeTerms || []
          }
        })
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      debugAPI('API error response:', errorText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    debugAPI('API returned cards:', result);
    return result;
  } catch (error) {
    console.error('[ERROR] Error generating deck:', error);
    throw error;
  }
};

/**
 * API service for Cardify
 */
export const CardifyAPI = {
  /**
   * Generate a deck of flashcards from source content
   */
  async generateDeck(deckOptions: NewDeck): Promise<Deck> {
    return generateDeck(deckOptions);
  },

  /**
   * Get decks for the current user
   */
  async getDecks(): Promise<Deck[]> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      debugAPI('Fetching decks from:', `${API_URL}/api/decks`);
      const response = await fetch(`${API_URL}/api/decks`, { headers });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      debugAPI('Successfully fetched decks', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Failed to fetch decks:', error);
      throw error;
    }
  },

  /**
   * Get a specific deck by ID
   */
  async getDeck(deckId: string): Promise<Deck | null> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      debugAPI('Fetching deck:', deckId);
      const response = await fetch(`${API_URL}/api/decks/${deckId}`, { headers });
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      debugAPI('Successfully fetched deck', data);
      return data;
    } catch (error) {
      console.error('[ERROR] Failed to fetch deck:', error);
      throw error;
    }
  },

  /**
   * Delete a specific deck by ID
   */
  async deleteDeck(deckId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      debugAPI('Deleting deck:', deckId);
      const response = await fetch(`${API_URL}/api/decks/${deckId}`, {
        method: 'DELETE',
        headers: headers,
      });

      if (!response.ok) {
        // Try to parse error message if server sends JSON, otherwise use statusText
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          // Not a JSON response
        }
        const errorMessage = errorData?.error || response.statusText;
        throw new Error(`HTTP error ${response.status}: ${errorMessage}`);
      }

      // For DELETE, a 200 OK with a message or 204 No Content is typical.
      // If 204, response.json() would fail, so we don't try to parse it unless needed.
      debugAPI('Successfully deleted deck', deckId);
      // No content to return, so Promise<void>
    } catch (error) {
      console.error('[ERROR] Failed to delete deck:', error);
      throw error;
    }
  },

  /**
   * Toggle the favorite status of a deck
   */
  async toggleDeckFavorite(deckId: string, isFavorited: boolean): Promise<Deck | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated to toggle favorite status.');
    }

    debugAPI(`Toggling favorite status for deck ${deckId} to ${isFavorited}`);

    try {
      const { data, error } = await supabase
        .from('decks')
        .update({ is_favorited: isFavorited })
        .match({ id: deckId, user_id: user.id })
        .select()
        .single(); // Use single() if you expect one row back and want it as an object not array

      if (error) {
        console.error('[ERROR] Failed to toggle deck favorite status:', error);
        throw error;
      }

      debugAPI('Successfully toggled favorite status', data);
      return data as Deck | null;
    } catch (error) {
      console.error('[ERROR] Exception in toggleDeckFavorite:', error);
      throw error;
    }
  },

  /**
   * Save a game score to the database.
   */
  async saveGameScore(scoreData: NewGameScore): Promise<GameScore | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated to save game score.');
    }

    debugAPI('Saving game score:', { ...scoreData, user_id: user.id });

    try {
      const { data, error } = await supabase
        .from('game_scores')
        .insert({
          ...scoreData,
          user_id: user.id,
          // played_at is set by default in the database
        })
        .select()
        .single();

      if (error) {
        console.error('[ERROR] Failed to save game score:', error);
        throw error;
      }

      debugAPI('Successfully saved game score', data);
      return data as GameScore | null;
    } catch (error) {
      console.error('[ERROR] Exception in saveGameScore:', error);
      throw error;
    }
  },

  /**
   * Get the personal best score for a user, optionally for a specific deck and game mode.
   */
  async getPersonalBestScore(gameMode: string, deckId?: string): Promise<GameScore | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      // Depending on desired behavior, could return null or throw error
      // For now, let's assume if no user, no personal best can be fetched.
      debugAPI('No authenticated user to fetch personal best score.');
      return null; 
    }

    debugAPI(`Fetching personal best score for user ${user.id}, gameMode: ${gameMode}, deckId: ${deckId || 'any'}`);

    try {
      let query = supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('game_mode', gameMode);

      if (deckId) {
        query = query.eq('deck_id', deckId);
      }
      // If deckId is not provided, it fetches the best score for that game_mode across all decks played by the user.

      const { data, error } = await query
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() as there might be no score yet

      if (error) {
        console.error('[ERROR] Failed to fetch personal best score:', error);
        throw error;
      }

      debugAPI('Successfully fetched personal best score', data);
      return data as GameScore | null;
    } catch (error) {
      console.error('[ERROR] Exception in getPersonalBestScore:', error);
      throw error;
    }
  },

  /**
   * Get all cards for a specific deck.
   */
  async getCardsForDeck(deckId: string): Promise<Card[]> {
    if (!deckId) {
      debugAPI('getCardsForDeck called with no deckId.');
      return [];
    }

    debugAPI(`Fetching card data from jsonb in deck: ${deckId}`);

    try {
      const { data: deckData, error: deckError } = await supabase
        .from('decks')
        .select('cards') // Select the jsonb column containing the cards
        .eq('id', deckId)
        .single(); // We expect only one deck for a given ID

      if (deckError) {
        console.error(`[ERROR] Failed to fetch deck ${deckId} to get cards:`, deckError);
        throw deckError;
      }

      if (!deckData || !deckData.cards) {
        debugAPI(`No card data found in jsonb for deck ${deckId} or deck itself not found.`);
        return []; // No cards in the jsonb field or deck not found
      }

      // The 'cards' field is expected to be an array of objects matching the Card structure (mostly)
      // We need to ensure they conform to the Card interface, especially if IDs are needed later.
      const gameCards: Card[] = (deckData.cards as any[]).map((cardFromJson, index) => ({
        id: `deck-${deckId}-card-${index}`, // Generate a temporary, unique ID for game purposes
        front: cardFromJson.front || '',
        back: cardFromJson.back || '',
        sourcePage: cardFromJson.sourcePage,
        contextSnippet: cardFromJson.contextSnippet,
      }));

      debugAPI(`Successfully processed ${gameCards.length} cards from jsonb for deck ${deckId}`, gameCards);
      return gameCards;
    } catch (error) {
      console.error(`[ERROR] Exception in getCardsForDeck (from jsonb) for deck ${deckId}:`, error);
      throw error; // Re-throw the error to be caught by the caller
    }
  }
};
