import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardHeader } from '../components/ui/Card';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMessage('You are authenticated. Please set your new password.');
      }
    });

    // Check for errors in the URL hash (e.g., expired token)
    const hash = window.location.hash;
    if (hash.includes('error_description=')) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const errorDesc = params.get('error_description');
      setError(errorDesc || 'An error occurred. The recovery link may be invalid or expired.');
      // Clear the hash to prevent the error from showing if the user tries to submit the form
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, [navigate]);

  const handlePasswordUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage('Password updated successfully! You can now sign in with your new password.');
      // Optionally, clear form and navigate after a delay
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
      // Message will be set by onAuthStateChange 'USER_UPDATED' event
      // setMessage('Password updated successfully! Redirecting to sign in...');
      // setTimeout(() => navigate('/auth'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-slate-100">Update Password</h2>
          <p className="text-center text-slate-400">
            Enter your new password below.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="password" className="text-slate-300">New Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-700 border-slate-600 placeholder-slate-500 text-white focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-slate-300">Confirm New Password</label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-700 border-slate-600 placeholder-slate-500 text-white focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
          {message && <p className="mt-4 text-sm text-green-400 text-center">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;
