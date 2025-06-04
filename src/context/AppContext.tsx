import React, { createContext, useReducer, ReactNode } from 'react';
import { AppState, AppStateAction } from '../types'; // Card, NewDeck, User are used by AppState and AppStateAction, so direct imports might not be needed here.

// Initial state
const initialState: AppState = {
  user: null,
  newDeck: {
    title: '',
    sourceType: 'text',
    sourceValue: null,
    cardCount: 20,
    clozeStyle: 'single',
    instruction: '',
    mustIncludeTerms: [],
  },
  previewCards: [],
  loading: false,
  error: null,
};

// Reducer function
const reducer = (state: AppState, action: AppStateAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_NEW_DECK':
      return {
        ...state,
        newDeck: { ...state.newDeck, ...action.payload },
      };
    case 'RESET_NEW_DECK':
      return { ...state, newDeck: initialState.newDeck, previewCards: [] };
    case 'SET_PREVIEW_CARDS':
      return { ...state, previewCards: action.payload };
    case 'UPDATE_CARD': {
      const updatedCards = [...state.previewCards];
      updatedCards[action.payload.index] = {
        ...updatedCards[action.payload.index],
        ...action.payload.card,
      };
      return { ...state, previewCards: updatedCards };
    }
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

// Create context
export const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppStateAction>;
} | undefined>(undefined);

// Context provider
export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};