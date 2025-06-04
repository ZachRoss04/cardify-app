import React from 'react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-10">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h1 className="text-4xl font-bold text-gray-800">Terms of Service</h1>
            <a href="/" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              &larr; Back to Home
            </a>
          </div>

          <section className="mb-6 prose prose-indigo lg:prose-lg max-w-none">
            <p className="text-gray-500 text-sm mb-4"><strong>Effective Date:</strong> January 1, 2025</p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By creating an account, logging in, or otherwise using any part of the Service, you agree to these Terms and our <a href="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">Privacy Policy</a>. We may update these Terms from time to time; continued use constitutes acceptance of the revised Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Cardify provides a web-based platform that uses AI to generate, customize and study flashcard decks from uploaded PDFs, URLs or text. Features include deck creation, preview & editing, in-app Study Mode, credit management, referral rewards and integrations with third-party tools.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">3. User Accounts</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5">
              <li>You must register for an account to use certain features.</li>
              <li>You are responsible for maintaining the confidentiality of your password and account, and for all activity under your credentials.</li>
              <li>You agree to notify us immediately of any unauthorized use of your account.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">4. User Conduct and Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5 mt-2">
              <li>Violate any applicable law or regulation;</li>
              <li>Infringe others’ intellectual property or privacy rights;</li>
              <li>Upload harmful, obscene, defamatory or illegal content;</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">We reserve the right to suspend or terminate accounts that violate these rules.</p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">5. Intellectual Property</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5">
              <li>All Service content—design, text, graphics, code and AI-generated tools—are the exclusive property of Cardify or its licensors.</li>
              <li>You retain ownership of any materials you upload (your “User Content”), but grant Cardify a worldwide, royalty-free license to use, store and display your User Content to provide the Service.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">6. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may suspend or terminate your access at any time, with or without cause. Upon termination, your right to use the Service will immediately cease, and we may delete your account and data in accordance with our Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">7. Disclaimers & Limitation of Liability</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5">
              <li><strong>No Warranty:</strong> The Service is provided “as is” and “as available.” We disclaim all warranties, express or implied, including merchantability or fitness for a particular purpose.</li>
              <li><strong>Limitation of Liability:</strong> To the fullest extent permitted by law, Cardify and its affiliates are not liable for any indirect, incidental, special or consequential damages arising out of your use of the Service, even if advised of the possibility of such damages.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">8. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We may modify these Terms at our sole discretion. If we make material changes, we will notify you at least 30 days before they take effect (by email or in-app notification). Continued use after that date constitutes acceptance.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">9. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms are governed by the laws of the State of Florida, without regard to conflict of laws principles. You agree to submit to the exclusive jurisdiction of the state and federal courts located in Florida.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">10. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms, please contact us at:<br />
              <a href="mailto:support@cardify.ai" className="text-blue-600 hover:text-blue-700 hover:underline"><strong>support@cardify.ai</strong></a>
            </p>
            <hr className="my-8 border-gray-300" />
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
