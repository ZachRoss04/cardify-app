import React from 'react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-10">
          <div className="flex justify-between items-center mb-8 border-b pb-4">
            <h1 className="text-4xl font-bold text-gray-800">Privacy Policy</h1>
            <a href="/" className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
              &larr; Back to Home
            </a>
          </div>

          <section className="mb-6 prose prose-indigo lg:prose-lg max-w-none">
            <p className="text-gray-500 text-sm mb-4"><strong>Last Updated:</strong> January 1, 2025</p>
            <hr className="my-6 border-gray-300" />
            <p className="text-gray-700 leading-relaxed">
              Cardify (“we,” “us,” “our”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our Service.
            </p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">1. Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">1.1 Personal Information — data you provide directly:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5">
              <li>Name, email, password</li>
              <li>Profile and billing details</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">1.2 Usage Data — automatically collected:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5">
              <li>Pages visited, features used, timestamps</li>
              <li>Device and browser information, IP address</li>
            </ul>
            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">1.3 AI-Generated Content</h3>
            <p className="text-gray-700 leading-relaxed pl-5">Flashcard decks and related metadata that you create.</p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5 mt-2">
              <li>Provide, maintain and improve the Service;</li>
              <li>Authenticate and manage your account;</li>
              <li>Process payments and credits;</li>
              <li>Personalize your experience (e.g., recommendations);</li>
              <li>Communicate updates, promotions, and support;</li>
              <li>Conduct analytics and monitor performance;</li>
              <li>Comply with legal obligations.</li>
            </ul>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">3. Sharing Your Information</h2>
            <p className="text-gray-700 leading-relaxed">We do <strong>not</strong> sell or rent your personal information. We may share data with:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5 mt-2">
              <li><strong>Service Providers</strong> (e.g., Supabase, Stripe, OpenAI) to operate our Service;</li>
              <li><strong>Affiliates</strong> or successors in a merger or acquisition;</li>
              <li><strong>Legal Authorities</strong> when required by law or to protect rights.</li>
            </ul>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">4. Cookies & Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed">We use cookies, web beacons, and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5 mt-2">
              <li>Authenticate users, manage sessions;</li>
              <li>Analyze usage patterns (via Google Analytics or Mixpanel);</li>
              <li>Deliver and measure marketing campaigns.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">You can manage cookie preferences via your browser settings; however, disabling cookies may affect functionality.</p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">5. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide the Service. We may also retain data to comply with legal obligations or resolve disputes.
            </p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">6. Security Measures</h2>
            <p className="text-gray-700 leading-relaxed">We implement industry-standard organizational and technical safeguards:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5 mt-2">
              <li>Encryption of data in transit (HTTPS) and at rest;</li>
              <li>Secure password hashing;</li>
              <li>Regular security audits and vulnerability assessments.</li>
            </ul>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">7. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed pl-5 mt-2">
              <li>Access, correct or delete your personal data;</li>
              <li>Restrict or object to certain processing;</li>
              <li>Request a copy of your data in a portable format;</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-3">To exercise these rights, contact <a href="mailto:support@cardify.ai" className="text-blue-600 hover:text-blue-700 hover:underline"><strong>support@cardify.ai</strong></a>.</p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">8. Children’s Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our Service is not directed to individuals under 16. We do not knowingly collect data from minors. If you believe we have inadvertently collected a child’s information, please contact us to request deletion.
            </p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">9. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Policy to reflect changes in our practices or legal requirements. We will notify you by posting the updated Policy on our site with a revised “Last Updated” date.
            </p>
            <hr className="my-6 border-gray-300" />

            <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-3">10. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions or concerns about this Privacy Policy, please contact:<br />
              <a href="mailto:support@cardify.ai" className="text-blue-600 hover:text-blue-700 hover:underline"><strong>support@cardify.ai</strong></a>
            </p>
            <p className="text-gray-700 leading-relaxed mt-6">
              Thank you for trusting Cardify with your data. We take your privacy seriously.
            </p>

          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
