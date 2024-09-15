import React, { forwardRef } from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="privacy-policy-container">
      <h1>Privacy Policy</h1>
      <p>Effective Date: January 1, 2024</p>
      <h2>1. Introduction</h2>
      <p>
        Welcome to Dan Ober Artisan Drums. We are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner. This Privacy Policy explains how we collect, use, and share information about you when you visit our website or make a purchase from us.
      </p>
      <h2>2. Information We Collect</h2>
      <p>
        We may collect the following types of information:
        <br />
        <strong>Personal Information:</strong> When you create an account, make a purchase, or contact us, we may collect personal information such as your name, email address, phone number, and shipping address.
        <br />
        <strong>Payment Information:</strong> We may collect payment information, including credit card details or other payment methods, to process transactions.
        <br />
        <strong>Usage Data:</strong> We collect information about your interactions with our website, such as your IP address, browser type, and pages visited.
        <br />
        <strong>Cookies:</strong> We use cookies to enhance your experience on our website. Cookies are small data files stored on your device.
      </p>
      <h2>3. How We Use Your Information</h2>
      <p>
        We use your information for the following purposes:
        <br />
        To process and fulfill orders.
        <br />
        To communicate with you about your orders and provide customer support.
        <br />
        To improve our website and services.
        <br />
        To send promotional emails and offers, if you have opted-in to receive them.
        <br />
        To comply with legal obligations.
      </p>
      <h2>4. Sharing Your Information</h2>
      <p>
        We do not sell or rent your personal information to third parties. We may share your information with the following entities:
        <br />
        <strong>Service Providers:</strong> We may share information with third-party service providers who assist us with processing payments, shipping orders, and other business functions.
        <br />
        <strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights and the rights of others.
      </p>
      <h2>5. Security</h2>
      <p>
        We implement reasonable security measures to protect your information from unauthorized access or disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure.
      </p>
      <h2>6. Your Rights</h2>
      <p>
        You have the right to access, correct, or delete your personal information. You may also opt-out of receiving promotional communications from us at any time.
      </p>
      <h2>7. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be posted on this page, and we encourage you to review it periodically.
      </p>
      <h2>8. Contact Us</h2>
      <p>
        If you have any questions or concerns about this Privacy Policy, please contact us at:
        <br />
        Dan Ober Artisan Drums
        <br />
        Email: legal@danoberartisan.com
      </p>
    </div>
  );
});

// Add a display name to the component for debugging
PrivacyPolicy.displayName = 'PrivacyPolicy';

export default PrivacyPolicy;
