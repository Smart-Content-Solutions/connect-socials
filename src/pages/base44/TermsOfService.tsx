// src/pages/base44/TermsOfService.tsx
import React from "react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

        <p className="text-gray-700 mb-4">
          Welcome to Smart Content Solutions (“Company”, “we”, “our”, “us”). By using our website, dashboard, 
          AI tools, or any related services (collectively, the “Service”), you agree to these Terms of Service.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
        <p className="text-gray-700 mb-4">
          By accessing or using the Service, you confirm that you are at least 18 years old and legally capable
          of entering into this agreement. If you do not agree with these Terms, do not use the Service.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Use of the Service</h2>
        <p className="text-gray-700 mb-4">
          You agree not to misuse our platform, including attempting to reverse engineer, modify, or exploit 
          the system, or engage in automated scraping or malicious activity.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. Account Responsibilities</h2>
        <p className="text-gray-700 mb-4">
          You must keep your login credentials secure. We are not responsible for account misuse resulting 
          from lost or shared credentials.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Payments & Subscriptions</h2>
        <p className="text-gray-700 mb-4">
          By subscribing to a paid plan, you authorize recurring billing until cancellation. 
          Fees are non-refundable unless required by law.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. AI-Generated Content</h2>
        <p className="text-gray-700 mb-4">
          Our AI may produce creative outputs. You are responsible for reviewing and ensuring accuracy 
          before publishing. We are not liable for any content you submit or distribute.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Limitation of Liability</h2>
        <p className="text-gray-700 mb-4">
          To the fullest extent permitted by law, Smart Content Solutions is not liable for 
          any damages resulting from use of the Service, including lost profits, data issues,
          or platform downtime.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Termination</h2>
        <p className="text-gray-700 mb-4">
          We may suspend or terminate access to the Service for violations of these Terms or
          unsafe or fraudulent behavior.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">8. Changes to Terms</h2>
        <p className="text-gray-700 mb-4">
          We may update these Terms from time to time. Continued use of the Service indicates 
          your acceptance of the updated Terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h2>
        <p className="text-gray-700 mb-4">
          For questions regarding these Terms, contact us at:
          <br />
          <span className="font-semibold">support@smartcontentsolutions.co.uk</span>
        </p>
      </div>
    </div>
  );
}
