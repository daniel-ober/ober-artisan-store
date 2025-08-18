import React, { forwardRef } from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="privacy-policy-container">
      <h1>Privacy Policy</h1>

      <p>
        This Privacy Policy applies to all interactions with Ober Artisan Drums, including browsing our website,
        submitting inquiries, and making purchases. By using our services, you agree to the practices described here.
        We may update this policy at any time without prior notice, and the version in effect at the time of your
        interaction will apply. We encourage all users to read this policy carefully to understand their rights and
        our obligations.
      </p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Ober Artisan Drums. We are committed to protecting your privacy and handling your personal
        information responsibly. This Privacy Policy outlines how we collect, use, and disclose information when
        you visit our website, submit lead forms through any source, or make a purchase via Stripe.
      </p>

      <h2>2. Information We Collect</h2>
      <p>
        <strong>Personal Information:</strong> Your name, email, phone number, and shipping/billing address when you
        place an order or contact us.<br /><br />
        <strong>Payment Information:</strong> Payment is securely processed via Stripe. We do not store full credit
        card numbers or sensitive payment credentials.<br /><br />
        <strong>Lead Form Submissions:</strong> If you submit a form through any platform (including but not limited to
        LinkedIn, Facebook, Instagram, TikTok, or third-party tools), we may collect your name, email address, company,
        or other voluntarily submitted information. This includes all forms of inbound lead capture, regardless of source.<br /><br />
        <strong>Usage Data:</strong> We collect browser and session data such as IP address, device type, referral URL,
        and pages viewed.<br /><br />
        <strong>Cookies:</strong> Small data files used to optimize your experience, track activity, and improve our
        website&apos;s performance.
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To process and fulfill orders via Stripe</li>
        <li>To communicate with you regarding inquiries, submissions, or purchases</li>
        <li>To send updates or marketing (if you opt in)</li>
        <li>To optimize user experience and improve our services</li>
        <li>To comply with legal, tax, or operational obligations</li>
        <li>To detect, prevent, or investigate fraud or misuse</li>
      </ul>

      <h2>4. Sharing Your Information</h2>
      <p>
        We do not sell or rent your personal data. We may share your data with:<br /><br />
        <strong>Trusted Service Providers:</strong> Such as Stripe (payments), hosting platforms, analytics tools, and
        shipping or email providers.<br /><br />
        <strong>Legal Authorities:</strong> When required by law or to protect our business, brand, or users from fraud
        or harm.
      </p>

      <h2>5. Payment Processing</h2>
      <p>
        We use Stripe to process all payments. Stripe uses encryption and follows PCI-DSS compliance standards to
        safeguard your payment data. Learn more at{' '}
        <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>.
      </p>

      {/* NEW: Klarna privacy disclosure */}
      <h3>5A. Klarna Payments</h3>
      <p>
        We offer certain “buy now, pay later” options through Klarna via Stripe. If you choose Klarna at checkout,
        Klarna will collect and process personal data as an independent controller to assess eligibility (which may
        include a credit check), prevent fraud, and manage your repayment plan. We share limited order details with
        Klarna to enable the transaction. Your use of Klarna is subject to Klarna’s{' '}
        <a href="https://www.klarna.com/us/privacy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and
        legal terms.
      </p>
      <p>
        Klarna may contact you directly about your payments (e.g., reminders, late notices) and may report payment
        behavior as permitted by law. For information about Klarna’s data practices and your rights with Klarna, please
        see{' '}
        <a href="https://www.klarna.com/us/privacy/" target="_blank" rel="noopener noreferrer">
          Klarna’s privacy center
        </a>.
      </p>

      <h2>6. reCAPTCHA &amp; Bot Protection</h2>
      <p>
        This site is protected by Google reCAPTCHA to prevent spam and abuse. Use of reCAPTCHA is subject to Google&apos;s{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a>.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        You may request access to, correct, or delete your personal information by contacting us. Because we only collect
        the minimum data required to process orders and communicate, there is no generalized opt-out.
      </p>

      <h2>8. Data Security</h2>
      <p>
        We implement standard security safeguards to protect your data, but no method is fully guaranteed. We reserve
        the right to block users or IP addresses that demonstrate suspicious, abusive, or unauthorized behavior.
      </p>

      <h2>9. External Links</h2>
      <p>
        We may link to third-party services such as Stripe, Klarna, LinkedIn, or Meta properties. We are not responsible
        for their privacy practices. Please review those third-party policies before submitting your data to them.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this policy periodically. The most current version will always appear here, and your continued use
        of our site implies acceptance of the current policy.
      </p>

      <h2>11. Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests, please contact us at <strong>support@oberartisandrums.com</strong>.
      </p>
    </div>
  );
});

PrivacyPolicy.displayName = 'PrivacyPolicy';
export default PrivacyPolicy;