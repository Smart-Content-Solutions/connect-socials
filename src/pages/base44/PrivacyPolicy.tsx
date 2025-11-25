// src/pages/base44/PrivacyPolicy.tsx
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

        <p className="text-gray-700 mb-4">
          This Privacy Policy explains how Smart Content Solutions (“we”, “our”, “us”) 
          collects, uses, and protects your information when you use our website, 
          dashboard, and related services.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">1. Information We Collect</h2>
        <p className="text-gray-700 mb-4">
          We collect information that you provide directly, including your name, email address,
          account details, uploaded images, brand assets, and data needed to authenticate 
          third-party platforms like Facebook, Instagram, LinkedIn, TikTok, and others.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">2. Social Media Integrations</h2>
        <p className="text-gray-700 mb-4">
          When you connect your social media accounts, we securely store access tokens and 
          permissions required to publish posts on your behalf.  
          We never store your passwords, and we never share your data with third parties.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">3. How We Use Your Information</h2>
        <p className="text-gray-700 mb-4">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-4">
          <li>Provide and improve our AI-driven content tools</li>
          <li>Authenticate your identity and connected accounts</li>
          <li>Publish content to your selected social media platforms</li>
          <li>Offer customer support</li>
          <li>Secure our systems and prevent abuse</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Storage & Security</h2>
        <p className="text-gray-700 mb-4">
          Access tokens and sensitive information are encrypted using industry-standard practices.
          We do not share or sell personal data.  
          You may request deletion of your data at any time.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">5. Cookies & Tracking</h2>
        <p className="text-gray-700 mb-4">
          We use cookies and analytics tools to understand usage patterns and improve the Service.
          You may disable cookies in your browser, but some features may not function properly.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">6. Third-Party Services</h2>
        <p className="text-gray-700 mb-4">
          We integrate with APIs such as Meta, LinkedIn, TikTok, Google, Pinterest, YouTube, and
          others. These services have their own privacy policies, which you should review.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">7. Your Rights</h2>
        <p className="text-gray-700 mb-4">
          Depending on your location, you may have the right to:
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-4">
          <li>Access your data</li>
          <li>Request correction or deletion</li>
          <li>Withdraw consent for integrations</li>
          <li>Download your data</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-3">8. Updates to This Policy</h2>
        <p className="text-gray-700 mb-4">
          We may update this Privacy Policy over time. Continued use of the Service constitutes 
          acceptance of the updated terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-3">9. Contact Us</h2>
        <p className="text-gray-700 mb-4">
          For privacy-related questions, email us at:
          <br />
          <span className="font-semibold">privacy@smartcontentsolutions.co.uk</span>
        </p>
      </div>
    </div>
  );
}
