import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import NewLandingPage from './pages/NewLandingPage';
import DashboardPage from './pages/DashboardPage';
import DeckDetailPage from './pages/DeckDetailPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import WelcomeOverlay from './components/features/WelcomeOverlay';
import FAQPage from './pages/FAQPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';

// Helper component to manage WelcomeOverlay logic within the Router context
const WelcomeManager: React.FC = () => {
  const location = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('cardify_welcomed');
    const currentPath = location.pathname;
    if (!hasSeenWelcome && (currentPath === '/dashboard' || currentPath.startsWith('/deck/'))) {
      setShowWelcome(true);
    }
  }, [location.pathname]);

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    localStorage.setItem('cardify_welcomed', 'true');
  };

  return showWelcome ? <WelcomeOverlay onComplete={handleWelcomeComplete} /> : null;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <div className="App">
            <WelcomeManager />
            <Routes>
              <Route path="/" element={<NewLandingPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              {/* For DeckDetailPage, you might need a dynamic segment like /deck/:deckId */}
              {/* This simple startsWith won't work directly with react-router-dom's Route path matching for dynamic segments */}
              {/* Assuming DeckDetailPage can handle a generic /deck/ path for now, or you have a specific ID pattern */}
              {/* A more robust solution would be <Route path="/deck/:id" element={<ProtectedRoute><DeckDetailPage /></ProtectedRoute>} /> */}
              {/* For now, let's keep it simple, but this will need adjustment if /deck/ needs dynamic IDs */}
              <Route path="/deck/*" element={<ProtectedRoute><DeckDetailPage /></ProtectedRoute>} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/update-password" element={<UpdatePasswordPage />} />
            </Routes>
          </div>
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;