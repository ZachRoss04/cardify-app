import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} CardsOnTheSpot. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            <a
              href="/terms"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms
            </a>
            <a
              href="/privacy"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;