import React from 'react';
import { useAuth } from '../../context/AuthContext'; // Ensure this path is correct relative to this file's location (src/components/auth)

interface ProtectedRouteProps {
  children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isSigningOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-700">Loading authentication...</p>
      </div>
    );
  }

  // If a sign-out process is active, AuthContext will handle the redirect.
  // Display a message or null to prevent rendering children or further redirects from this component.
  if (isSigningOut) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-700">Signing out...</p>
      </div>
    );
  }

  // If not loading, not signing out, but no user is present, then redirect to auth page.
  if (!user) {
    window.location.href = '/auth';
    return null; // Return null to prevent rendering children during redirect
  }

  // User is authenticated, not loading, and not signing out: render the protected component.
  return children;
};

export default ProtectedRoute;