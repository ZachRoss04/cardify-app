import React from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import Button from '../ui/Button';
// SupabaseUser type will come from useAuth hook
import { User as UserIcon, CreditCard } from 'lucide-react'; // For the icon, added CreditCard for tokens
import { useAuth } from '../../context/AuthContext'; // Import useAuth

interface HeaderProps {
  hideSignUpButton?: boolean; // Existing prop, others will come from useAuth
}

const Header: React.FC<HeaderProps> = ({ hideSignUpButton }) => {
  const { state } = useAppContext(); // For existing credits logic
  const { user, signOut, loading: isAuthLoading, tokenCount, firstName } = useAuth(); // Use the auth context, added firstName
  const logoHref = user ? '/dashboard' : '/';

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href={logoHref} className="flex items-center">
              <span className="font-bold text-xl text-blue-600">Cardify</span>
            </a>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthLoading ? (
              <span className="text-sm text-gray-500">Loading...</span>
            ) : user ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="bg-gray-100 rounded-full p-1.5">
                    <UserIcon size={18} className="text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{firstName || user.email}</span>
                </div>
                {/* Token Display */}
                {tokenCount !== null && (
                  <div className="flex items-center space-x-1 border-l border-gray-300 pl-3 ml-3">
                    <CreditCard size={16} className="text-indigo-500" />
                    <span className="text-sm text-gray-700">
                      Tokens: <span className="font-semibold text-indigo-600">{tokenCount}</span>
                    </span>
                  </div>
                )}
                {signOut && (
                  <Button onClick={signOut} variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50">
                    Sign Out
                  </Button>
                )}
                {/* Credits display from AppContext - can remain if distinct from auth user info */}
                {state.user && (
                  <div className="text-sm text-gray-700 ml-4">
                    <span className="mr-1">Credits:</span>
                    <span className="font-semibold">{state.user?.credits ?? 0}</span>
                  </div>
                )}
                {/* TODO: Re-evaluate 'Buy More' button context, for now it's tied to AppContext user */}
                {state.user && <Button variant="outline" size="sm" className="ml-2">Buy More</Button>}
              </>
            ) : (
              !hideSignUpButton ? <Button onClick={() => window.location.href='/auth'} size="sm">Sign Up / Login</Button> : null
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;