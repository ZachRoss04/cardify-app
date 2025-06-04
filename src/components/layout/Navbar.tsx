import React from 'react';

import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';

// Placeholder for a simple flashcard icon - consider moving to a shared components/icons file
const CardifyLogo = () => (
  <div className="flex items-center space-x-2">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
      <path d="M6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <span className="font-bold text-2xl text-gray-800">Cardify</span>
  </div>
);

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <a href={user ? "/dashboard" : "/"}><CardifyLogo /></a>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <a href="/faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
            {user ? (
              <Button onClick={signOut} variant="outline" size="sm">
                Logout
              </Button>
            ) : (
              <Button onClick={() => window.location.href = '/auth'} variant="primary" size="sm">
                Login / Sign Up
              </Button>
            )}
          </div>
          {/* Mobile menu button (basic placeholder) */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-blue-600 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
