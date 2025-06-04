import React, { useState } from 'react';
import { AtSign } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAppContext } from '../../hooks/useAppContext';
import { signupUser } from '../../lib/utils';

const EmailSignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { user } = await signupUser(email);
      dispatch({ type: 'SET_USER', payload: user });
      
      // In a real app, we would redirect to dashboard here
      window.location.href = '/dashboard';
    } catch (err) {
      setError('Failed to sign up. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-grow">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<AtSign size={18} />}
            aria-label="Email address"
            error={error || undefined}
          />
        </div>
        <Button 
          type="submit" 
          isLoading={isLoading} 
          className="whitespace-nowrap"
        >
          Get 2 Free Decks
        </Button>
      </form>
    </div>
  );
};

export default EmailSignupForm;