export interface User {
  id: string;
  email: string;
  credits: number;
  referralCode: string;
  decks: Deck[];
}

export interface Deck {
  id: string;
  title: string;
  cardCount: number;
  createdAt: string;
}

export interface NewDeck {
  title: string;
  sourceType: "pdf" | "url" | "text";
  sourceValue: File | string | null;
  cardCount: number; // default 20, min 5, max 50
  clozeStyle: "single" | "multi";
  instruction: string;
  mustIncludeTerms: string[];
}

export interface Card {
  id?: string;  // Added id property as optional
  front: string;
  back: string;
  sourcePage?: number | null;
  contextSnippet?: string;
}

export interface AppState {
  user: User | null;
  newDeck: NewDeck;
  previewCards: Card[];
  loading: boolean;
  error: string | null;
}

export interface SignupResponse {
  user: User;
}

export interface GenerateDeckResponse {
  cards: Card[];
}

export interface CreateDeckResponse {
  user: User;
  deckId: string;
}