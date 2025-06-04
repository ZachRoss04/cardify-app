import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, SlidersHorizontal, BrainCircuit, DownloadCloud, Gift, HelpCircle, UploadCloud, Settings2, Sparkles, GraduationCap, Briefcase, Brain, Users, Quote, CheckCircle2, type LucideIcon as LucideIconType } from 'lucide-react';

const iconMap: { [key: string]: LucideIconType } = {
  Zap,
  SlidersHorizontal,
  BrainCircuit,
  DownloadCloud,
  Gift,
  HelpCircle,
  UploadCloud,
  Settings2,
  Sparkles,
  GraduationCap,
  Briefcase,
  Brain,
  Users,
  Quote,
  CheckCircle2,
};
import Button from '../components/ui/Button';
import Footer from '../components/layout/Footer'; // Re-using existing footer if suitable
import DeckModalPreviewImage from '../assets/images/deck-modal-preview.png';

// Placeholder for a simple flashcard icon
const CardifyLogo = () => (
  <div className="flex items-center space-x-2">
    {/* Simple flashcard icon representation */}
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-600">
      <path d="M6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6C4 4.89543 4.89543 4 6 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 9H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 13H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <span className="font-bold text-2xl text-gray-800">Cardify</span>
  </div>
);

const NewLandingPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  // If still loading or user is logged in and redirecting, show a loader or null
  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg font-semibold text-gray-700">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white text-gray-800 font-sans">
      {/* 1. Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0">
              <a href="/"><CardifyLogo /></a>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
              <a href="/faq" className="text-gray-600 hover:text-blue-600 transition-colors">FAQ</a>
                <Button onClick={() => window.location.href = '/auth'} variant="primary" size="sm">
                  Login / Sign Up
                </Button>
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

      {/* 2. Hero Section */}
      <section id="hero" className="bg-gradient-to-br from-blue-100 via-white to-white pt-20 pb-20 md:pt-32 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 mb-6 font-['Inter',_sans-serif]">
                Decks in <span className="text-blue-600">30 Seconds</span>—Study Smarter with Cardify
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 mb-10 font-['Inter',_sans-serif]">
                Upload PDFs, paste URLs, or drop in text and instantly get cloze-deletion flashcards.
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Button onClick={() => window.location.href = '/auth'} variant="primary" size="lg" className="mr-4 mb-4 md:mb-0 bg-teal-500 hover:bg-teal-600 text-white">
                  Get 2 Free Decks
                </Button>
                <a 
                  href="#how-it-works" 
                  className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-gray-400 bg-transparent hover:bg-gray-100 text-gray-700 text-base h-11 px-6"
                >
                  See How It Works
                </a>
              </div>
            </div>
            {/* Right Column */}
            <div className="hidden md:block mt-10 md:mt-0">
              <div className="bg-gray-200 rounded-lg shadow-xl h-96 flex items-center justify-center">
                <img src={DeckModalPreviewImage} alt="Cardify Deck Modal Preview" className="object-contain h-full w-full rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why Cardify (Feature Highlights) */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 font-['Inter',_sans-serif]">
              Why Cardify?
            </h2>
            <p className="text-lg text-gray-600 font-['Inter',_sans-serif]">
              Everything you need to supercharge your study workflow.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-12">
            {[ // Array of feature objects
              {
                icon: 'Zap', // lucide-react icon name
                title: 'One-Click Decks',
                description: 'Skip manual formatting. In 30 seconds you get a full deck of 5–50 cards—automatically.',
              },
              {
                icon: 'SlidersHorizontal', // lucide-react icon name
                title: 'Fully Customizable',
                description: 'Choose single- or multi-blank style, set card count, add “must-include” terms or special instructions.',
              },
              {
                icon: 'BrainCircuit', // lucide-react icon name (alternative for AI)
                title: 'AI-Powered Accuracy',
                description: 'Cardify pulls testable facts, definitions, dates and formulas with precision.',
              },
              {
                icon: 'DownloadCloud', // lucide-react icon name
                title: 'Seamless Exports',
                description: 'Download CSVs formatted for Anki or Quizlet with one click—no copy-paste headaches.',
              },
              {
                icon: 'Gift', // lucide-react icon name
                title: 'Earn Bonus Credits',
                description: 'Share your referral link to unlock free extra decks.',
              },
              // You can add a 6th item here for a perfect 2x3 or 3x2 grid, or adjust grid-cols if 5 is final
            ].map((feature, index) => {
              const LucideIcon = iconMap[feature.icon] || iconMap['HelpCircle'];
              return (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <div className="p-3 bg-blue-100 rounded-full mb-4">
                    <LucideIcon size={32} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-['Inter',_sans-serif]">{feature.title}</h3>
                  <p className="text-gray-600 text-sm font-['Inter',_sans-serif]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 4. How It Works (3-Step Visual) */}
      <section id="how-it-works" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 font-['Inter',_sans-serif]">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 font-['Inter',_sans-serif]">
              Create flashcard decks in three simple steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-x-8 gap-y-12">
            {[ // Array of step objects
              {
                step: 1,
                icon: 'UploadCloud',
                title: 'Upload Your Content',
                description: 'Paste text, upload a PDF/DOCX, or drop a URL. Cardify handles the rest.',
              },
              {
                step: 2,
                icon: 'Settings2',
                title: 'Customize (Optional)',
                description: 'Set card count, style (single/multi-blank), or add must-include terms.',
              },
              {
                step: 3,
                icon: 'Sparkles',
                title: 'Generate & Export',
                description: 'Get your deck in seconds. Download for Anki/Quizlet or study in-app.',
              },
            ].map((item) => {
              const LucideIcon = iconMap[item.icon] || iconMap['HelpCircle'];
              return (
                <div key={item.step} className="flex flex-col items-center text-center p-6">
                  <div className="relative mb-6">
                    <div className="absolute -top-2 -left-2 w-12 h-12 bg-blue-600 text-white text-2xl font-bold rounded-full flex items-center justify-center shadow-lg">
                      {item.step}
                    </div>
                    <div className="p-4 bg-white rounded-full shadow-lg inline-block ml-5 mt-1">
                      <LucideIcon size={40} className="text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-['Inter',_sans-serif]">{item.title}</h3>
                  <p className="text-gray-600 text-sm font-['Inter',_sans-serif]">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 5. Perfect for Every Learner (Use Cases) */}
      <section id="use-cases" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 font-['Inter',_sans-serif]">
              Perfect for Every Learner
            </h2>
            <p className="text-lg text-gray-600 font-['Inter',_sans-serif]">
              Whether you're studying for exams, advancing your career, or exploring new passions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[ // Array of use case objects
              {
                icon: 'GraduationCap',
                title: 'Students',
                description: 'Ace exams by quickly turning lecture notes, textbooks, and articles into study decks.',
              },
              {
                icon: 'Briefcase',
                title: 'Professionals',
                description: 'Master new skills for career growth. Ideal for certifications, onboarding, and corporate training.',
              },
              {
                icon: 'Brain',
                title: 'Lifelong Learners',
                description: 'Explore new subjects or languages. Make learning efficient and engaging.',
              },
              {
                icon: 'Users', // Icon for Educators
                title: 'Educators',
                description: 'Create supplementary materials for your students in minutes.',
              },
            ].map((useCase, index) => {
              const LucideIcon = iconMap[useCase.icon] || iconMap['HelpCircle'];
              return (
                <div key={index} className="flex flex-col items-center text-center p-6 bg-gray-50 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300">
                  <div className="p-3 bg-teal-100 rounded-full mb-4">
                    <LucideIcon size={32} className="text-teal-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 font-['Inter',_sans-serif]">{useCase.title}</h3>
                  <p className="text-gray-600 text-sm font-['Inter',_sans-serif]">{useCase.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 6. Social Proof / Testimonials */}
      <section id="social-proof" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 font-['Inter',_sans-serif]">
              Loved by Learners Worldwide
            </h2>
            {/* Optional: <p className="text-lg text-gray-600">A short sentence here if needed</p> */}
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[ // Array of testimonial objects
              {
                quote: "Cardify cut my study time in half! AI-generated cards are surprisingly accurate.",
                name: 'Sarah L.',
                title: 'Med Student',
              },
              {
                quote: "Finally, a fast way to make flashcards for professional certs. The Anki export is a lifesaver.",
                name: 'John B.',
                title: 'Software Engineer',
              },
              {
                quote: "I use Cardify to learn new languages. It's much faster than making cards by hand.",
                name: 'Maria K.',
                title: 'Polyglot',
              },
            ].map((testimonial, index) => {
              const LucideQuote = iconMap['Quote'] || iconMap['HelpCircle'];
              return (
                <div key={index} className="bg-white p-8 rounded-lg shadow-lg flex flex-col">
                  <LucideQuote size={32} className="text-blue-500 mb-4" />
                  <p className="text-gray-700 italic mb-6 flex-grow font-['Inter',_sans-serif]">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-gray-900 font-['Inter',_sans-serif]">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 font-['Inter',_sans-serif]">{testimonial.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 7. Simple, Transparent Pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 font-['Inter',_sans-serif]">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600 font-['Inter',_sans-serif]">
              Choose the plan that's right for you.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row justify-center items-center lg:items-stretch gap-8">
            {[ // Array of pricing tier objects
              {
                name: 'Free Tier',
                title: 'Get Started',
                price: '$0',
                frequency: 'forever',
                features: [
                  '2 free decks',
                  '20 cards/deck',
                  'Basic AI model',
                  'Community support',
                ],
                cta: 'Sign Up for Free',
                variant: 'outline' as const,
                href: '/signup?tier=free',
                highlight: false,
              },
              {
                name: 'Pro Tier',
                title: '$5/month',
                price: '$5',
                frequency: 'per month',
                features: [
                  'Unlimited decks',
                  '50 cards/deck',
                  'Advanced AI model',
                  'Priority support',
                  'Early access to new features',
                ],
                cta: 'Go Pro',
                variant: 'primary' as const, 
                href: '/signup?tier=pro',
                highlight: true,
              },
            ].map((tier) => {
              const CheckIcon = iconMap['CheckCircle2'] || iconMap['HelpCircle'];
              return (
                <div key={tier.name} className={`bg-gray-50 p-8 rounded-xl shadow-lg w-full max-w-md flex flex-col ${tier.highlight ? 'border-4 border-blue-600 relative' : 'border border-gray-200'}`}>
                  {tier.highlight && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-md">POPULAR</span>
                    </div>
                  )}
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-2 font-['Inter',_sans-serif]">{tier.name}</h3>
                  <p className="text-gray-500 text-center mb-6 font-['Inter',_sans-serif]">{tier.title}</p>
                  <div className="text-center mb-6">
                    <span className="text-5xl font-bold text-gray-900 font-['Inter',_sans-serif]">{tier.price}</span>
                    <span className="text-gray-500 font-['Inter',_sans-serif]">/{tier.frequency}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckIcon size={20} className="text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 font-['Inter',_sans-serif]">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => window.location.href = '/auth'} 
                    variant={tier.variant} 
                    size="lg" 
                    fullWidth 
                    className={tier.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-600 border-blue-600 hover:bg-blue-50'}
                  >
                    {tier.cta}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 8. Final Call to Action (CTA) */}
      <section id="final-cta" className="py-20 md:py-28 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6 font-['Inter',_sans-serif]">
            Ready to Revolutionize Your Studying?
          </h2>
          <p className="text-xl text-blue-100 mb-10 font-['Inter',_sans-serif]">
            Sign up today and get 2 free decks on us. Experience the future of learning.
          </p>
          <Button 
            onClick={() => window.location.href = '/auth'}
            variant="secondary" 
            size="lg" 
            className="text-lg px-10 py-4" // Retain padding and text size, remove conflicting bg/text colors
          >
            Get Started Now – It's Free!
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default NewLandingPage;
