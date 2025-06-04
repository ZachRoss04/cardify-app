import React from 'react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar'; // Assuming you have a Navbar

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  // Basic accordion state, can be enhanced with animation
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left text-lg font-medium text-gray-700 hover:text-blue-600 focus:outline-none"
      >
        <span>{question}</span>
        <svg 
          className={`w-5 h-5 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="mt-3 pl-2 pr-4 text-gray-600 leading-relaxed">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

const FAQPage: React.FC = () => {
  const faqs = [
    {
      question: 'What is Cardify?',
      answer: 'Cardify is an intelligent flashcard application that helps you create study materials from your notes, documents, or web content quickly and efficiently using AI.'
    },
    {
      question: 'How do I create a new deck?',
      answer: 'You can create a new deck by clicking the "Create New Deck" button on your dashboard. You can then choose to input text directly, upload a file (PDF, DOCX), or provide a URL. Our AI will then help generate flashcards for you.'
    },
    {
      question: 'What are tokens and how are they used?',
      answer: 'Tokens are used to power AI-driven features like flashcard generation. Each generation task consumes a certain number of tokens. You receive a set number of free tokens upon signing up, and more can be acquired through subscription plans.'
    },
    {
      question: 'Can I share my decks with others?',
      answer: 'Currently, decks are private to your account. We are working on features to allow sharing and collaboration in the future.'
    },
    {
      question: 'What file types are supported for card generation?',
      answer: 'We support plain text, PDF files, DOCX (Microsoft Word) documents, and direct URL inputs for web page content.'
    },
    {
      question: 'Is there a limit to the number of cards per deck?',
      answer: 'The number of cards that can be generated might depend on your subscription tier and the length of the source material. Free tiers may have lower limits than Pro tiers.'
    },
    {
      question: 'How does the AI generate flashcards?',
      answer: 'Our AI analyzes the content you provide and identifies key information to create relevant flashcards, often using techniques like cloze deletion (fill-in-the-blanks) to test your knowledge effectively.'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-10">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h1 className="text-4xl font-bold text-gray-800">Frequently Asked Questions</h1>
            <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-150">
              &larr; Back to Home
            </a>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
