import React from 'react';
import { FileText, Zap, BarChart4, Share2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import EmailSignupForm from '../components/features/EmailSignupForm';

const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Turn PDFs & URLs into cloze-deletion flashcards in 30 sec
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Upload any document, paste a URL, or text. Cardify instantly generates
                smart flashcards that boost recall and save hours of study time.
              </p>
              
              <div className="mb-8">
                <EmailSignupForm />
              </div>
              
              <div className="text-sm text-gray-500">
                No credit card required. Get 2 free decks instantly.
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Study smarter, not harder
              </h2>
              <p className="text-lg text-gray-600">
                Cardify uses AI to identify key concepts and create effective flashcards
                that follow proven learning science principles.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-5">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Multiple Sources</h3>
                <p className="text-gray-600">
                  Upload PDFs, paste URLs, or enter text directly. Study from any source.
                </p>
              </div>
              
              <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-5">
                  <Zap className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Smart Generation</h3>
                <p className="text-gray-600">
                  AI focuses on key concepts and adjusts to your custom instructions.
                </p>
              </div>
              
              <div className="p-6 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-5">
                  <BarChart4 className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-xl mb-3">Effective Learning</h3>
                <p className="text-gray-600">
                  Cloze deletion cards follow proven principles for maximum retention.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How Cardify works
              </h2>
              <p className="text-lg text-gray-600">
                From content to completed flashcards in three simple steps
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                <h3 className="font-semibold text-xl mb-3">Upload or paste content</h3>
                <p className="text-gray-600">
                  Add your PDF, webpage URL, or paste text directly.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                <h3 className="font-semibold text-xl mb-3">Customize & generate</h3>
                <p className="text-gray-600">
                  Set card count, style, and add custom instructions.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                <h3 className="font-semibold text-xl mb-3">Edit & export</h3>
                <p className="text-gray-600">
                  Review cards, make changes, and export to Anki or Quizlet.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-blue-600 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Start creating effective flashcards today
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Join thousands of students who save hours of study time with Cardify's
              AI-powered flashcard generation.
            </p>
            <div className="mb-4 max-w-md mx-auto">
              <EmailSignupForm />
            </div>
            <div className="flex items-center justify-center text-sm opacity-80">
              <Share2 size={16} className="mr-2" />
              <span>Get 1 free deck credit for each friend who signs up</span>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default LandingPage;