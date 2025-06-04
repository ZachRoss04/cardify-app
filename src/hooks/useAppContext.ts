import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { AppState, AppStateAction } from '../types';

/**
 * Custom hook to access the AppContext.
 * Provides an easy way to get the application state and dispatch function.
 */
export const useAppContext = (): { state: AppState; dispatch: React.Dispatch<AppStateAction> } => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
