import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardContent, CardFooter, CardHeader } from '../components/ui/Card';


const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  

  const handlePasswordResetRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Determine the redirectTo URL. For local development, this might be http://localhost:PORT/update-password
    // For production, it should be your actual app's URL.
    const redirectTo = `${window.location.origin}/update-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Password reset email sent! Please check your inbox.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-slate-100">Forgot Password</h2>
          <p className="text-center text-slate-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordResetRequest} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-slate-300">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-slate-700 border-slate-600 placeholder-slate-500 text-white focus:ring-sky-500 focus:border-sky-500"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
          {message && <p className="mt-4 text-sm text-green-400 text-center">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-400 text-center">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <p className="text-sm text-slate-400">
            Remember your password?{' '}
            <Link to="/auth" className="font-medium text-sky-500 hover:text-sky-400">
              Sign In
            </Link>
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Don't have an account?{' '}
            <Link to="/auth?mode=signup" className="font-medium text-sky-500 hover:text-sky-400">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
