import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient'; // Using the existing import path

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signOut: () => Promise<void>;
  loading: boolean;
  isSigningOut: boolean; // State indicating if a sign-out process is active
  tokenCount: number | null;
  firstName: string | null;
  lastName: string | null;
  refreshUserProfile: () => Promise<void>; // Renamed from refreshTokenCount
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningOutState, _setIsSigningOutStateActual] = useState(false);
  const isSigningOutRef = useRef(false); // Initialize ref
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);

  // Wrapper function to set both state and ref synchronously
  const setIsSigningOut = (val: boolean) => {
    isSigningOutRef.current = val;
    _setIsSigningOutStateActual(val);
  };

  const fetchUserProfile = async (userId: string) => { // Renamed from fetchTokenCount
    if (!userId) return;
    try {
      const { data, error, status } = await supabase
        .from('user_profiles')
        .select('token_count, first_name, last_name')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 can mean no row found, which is fine initially
        console.error('Error fetching token count:', error);
        setTokenCount(null); // Or a default/error state
        return;
      }

      if (data) {
        setTokenCount(data.token_count);
        setFirstName(data.first_name || null); // Set first_name, default to null if not present
        setLastName(data.last_name || null);   // Set last_name, default to null if not present
      } else {
        // This case might happen if the trigger hasn't run yet for a new user
        // or if RLS prevents access before profile is fully set up.
        // Setting to null or a default like 0, or retrying could be options.
        console.warn('No profile data found for user, profile might be pending.');
        setTokenCount(null); // Or 0, if you prefer a default display
        setFirstName(null);
        setLastName(null);
      }
    } catch (e) {
      console.error('Exception fetching user profile:', e);
      setTokenCount(null);
      setFirstName(null);
      setLastName(null);
    }
  };

  const refreshUserProfile = async () => { // Renamed from refreshTokenCount
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    setLoading(true);
    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        setIsSigningOut(false); // If session is restored, not signing out
        fetchUserProfile(initialSession.user.id); // Renamed call
      } else {
        setTokenCount(null);
        setFirstName(null);
        setLastName(null);
      }
      // Only set loading to false if a sign-out isn't ALREADY in progress.
      if (!isSigningOutRef.current) {
        setLoading(false);
      }
    }).catch(error => {
      console.error("Error getting initial session:", error);
      // Still check ref in case of error during an ongoing sign-out attempt
      if (!isSigningOutRef.current) { 
          setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // User is logged in or session restored
        setIsSigningOut(false); // Clear the signing out flag
        fetchUserProfile(currentSession.user.id); // Renamed call
        setLoading(false);      // It's safe to set loading to false now
      } else {
        // User logged out, clear profile data
        setTokenCount(null);
        setFirstName(null);
        setLastName(null);
        // User is logged out.
        if (isSigningOutRef.current) {
          // This was an intentional sign-out. signOut() has already commanded window.location.href = '/'.
          // signOut() also set loading = true and isSigningOutState = true via setIsSigningOut.
          // We do NOT change loading or call setIsSigningOut here during this specific auth event.
          // These states will effectively be reset by the page navigation or upon the next login.
        } else {
          // User logged out for other reasons (e.g., session expired, token revoked externally)
          setIsSigningOut(false); // Ensure isSigningOut is false if not an intentional sign-out
          setLoading(false);
        }
      }
    });

    return () => {
      // Ensure subscription exists before trying to unsubscribe
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Main effect runs once

  const signOut = async () => {
    setIsSigningOut(true);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out from Supabase:', error);
        setIsSigningOut(false); // Reset state because sign-out failed
        setLoading(false);
        return; // Exit if Supabase sign-out failed
      }
      // If Supabase sign-out is successful, command the redirect.
      // loading remains true, isSigningOutState remains true.
      // These will be reset by onAuthStateChange upon next login or by page reload.
      setTimeout(() => {
        window.location.href = '/';
      }, 0);
    } catch (e) {
      console.error('Unexpected error during sign out:', e);
      setIsSigningOut(false);
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    signOut,
    loading,
    isSigningOut: isSigningOutState, // Expose the state variable
    tokenCount,
    firstName,
    lastName,
    refreshUserProfile, // Renamed from refreshTokenCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
