import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button'; // Assuming you have a Button component

const AuthPage: React.FC = () => {
  // Placeholder for your App Name or Logo text
  const appName = "CardsOnTheSpot";
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // True for Sign Up, False for Sign In. Default to Sign In.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // If user is already logged in and auth is not loading, redirect to dashboard
    if (user && !authLoading) {
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.toLowerCase().includes('user already registered') || 
              signUpError.message.toLowerCase().includes('already registered') ||
              signUpError.message.toLowerCase().includes('user with this email address already exists')) {
            setError('An account already exists under this email. Please try logging in.');
            setLoading(false); // Ensure loading is stopped
            return; // Stop further execution for this specific error
          }
          throw signUpError; // Re-throw other errors
        }
        // Check if data.user is not null and if user needs confirmation
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            setMessage('Sign up successful! Please check your email to confirm your account.');
        } else if (data.user) {
            setMessage('Sign up successful! You can now sign in.');
        } else {
            setMessage('Sign up successful! Please check your email for a confirmation link.');
        // If email confirmation is not required by Supabase settings, user might be available directly
        if (data.user && data.session) {
          // Potentially redirect if user is immediately active
          // window.location.href = '/dashboard'; 
        }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        setMessage('Sign in successful! Redirecting...');
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  // If auth is loading or user is already logged in (and useEffect will redirect), show minimal UI or loader
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading...</p> {/* Or a spinner component */}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mb-4 text-center sm:text-left">
          <a href="/" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors duration-150">
            &larr; Back to Home
          </a>
        </div>
        {/* Logo Placeholder - CardsOnTheSpot App Name Below */}
        <div className="text-center">
          {/* Example: <img className="mx-auto h-12 w-auto" src="/logo.png" alt={appName} /> */}
          <h1 className="text-4xl font-bold text-indigo-600 tracking-tight">
            {appName}
          </h1>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-800">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
                />
              </div>
            </div>

            {isSignUp && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password {isSignUp && <span className="text-xs text-gray-500">(min. 6 characters)</span>}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors duration-150"
                />
              </div>
              {!isSignUp && (
                <div className="flex items-center justify-end mt-2 text-sm">
                  <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Forgot your password?
                  </Link>
                </div>
              )}
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                variant="primary"
                isLoading={loading}
                className="bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 py-3 text-base rounded-lg transition-colors duration-150"
              >
                {loading ? 'Processing...' : (isSignUp ? 'Sign Up Free' : 'Sign In')}
              </Button>
            </div>
          </form>

          {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
          {message && <p className="mt-2 text-center text-sm text-green-600">{message}</p>}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-600">
                  {isSignUp ? 'Already have an account?' : 'New to CardsOnTheSpot?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setMessage(null);
                }}
                className="border-gray-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 py-3 text-base rounded-lg transition-colors duration-150"
              >
                {isSignUp ? 'Sign In' : 'Create an account'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
