// src/types.ts

// Represents a single flashcard
export interface Card {
  id?: string; // Optional: might be assigned by backend or DB
  front: string;
  back: string;
  sourcePage?: number | string; // Optional: page number or identifier from source
  contextSnippet?: string;    // Optional: snippet from source material
}

// Represents a deck of flashcards
export interface Deck {
  id: string;
  title: string;
  cards: Card[];
  card_count: number;    // Changed to snake_case
  created_at: string;    // Changed to snake_case (ISO date string)
  // Add any other relevant deck properties, e.g., description, tags
  // Optional: Add other fields from backend if needed by frontend type
  description?: string | null;
  tags?: any | null; // Or a more specific type if tags have a structure
  is_public?: boolean;
  updated_at?: string;
  user_id?: string;
  is_favorited?: boolean; // Added for deck favoriting feature
}

// Options for creating a new deck
export interface NewDeck {
  title: string;
  sourceType: 'text' | 'pdf' | 'url'; // Type of source material
  sourceValue: string | File | null;    // Actual content, file object, or URL
  cardCount: number;                    // Desired number of cards
  clozeStyle: 'single' | 'multi' | 'qa';       // Style of cloze deletion
  instruction?: string;                 // Optional: custom instructions for generation
  mustIncludeTerms?: string[];          // Optional: terms that must be included
}

// Represents a user
export interface User {
  id: string;
  email: string;
  credits: number;
  referralCode: string;
  decks: Deck[];
}

// Represents the overall application state for AppContext
export interface AppState {
  user: User | null;
  newDeck: NewDeck;
  previewCards: Card[];
  loading: boolean;
  error: string | null;
}

// Action types for the AppContext reducer
export type AppStateAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'UPDATE_NEW_DECK'; payload: Partial<NewDeck> }
  | { type: 'RESET_NEW_DECK' }
  | { type: 'SET_PREVIEW_CARDS'; payload: Card[] }
  | { type: 'UPDATE_CARD'; payload: { index: number; card: Partial<Card> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Represents a score entry for the Flashcard Frenzy mini-game
export interface GameScore {
  id: string; // UUID
  user_id: string; // UUID, foreign key to auth.users
  deck_id?: string | null; // UUID, foreign key to decks, nullable
  game_mode: string; // e.g., 'type_answer', 'multiple_choice'
  score: number;
  questions_attempted: number;
  questions_correct: number;
  played_at: string; // ISO date string
}

// Represents the data needed to create a new game score
export interface NewGameScore {
  deck_id?: string | null;
  game_mode: string;
  score: number;
  questions_attempted: number;
  questions_correct: number;
  // user_id will be inferred from the authenticated user on the backend/Supabase call
  // played_at will be set by the database (DEFAULT now())
}
