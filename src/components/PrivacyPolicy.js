// src/components/PrivacyPolicy.js

import React, { forwardRef } from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="privacy-policy-container">
      <h1>Privacy Policy</h1>

      <p>
        This Privacy Policy applies to all interactions with Ober Artisan Drums,
        including browsing our website, submitting inquiries, using interactive
        tools, participating in account-based or archive features, and making
        purchases. By using our services, you agree to the practices described
        here. We may update this policy at any time without prior notice, and
        the version in effect at the time of your interaction will apply. We
        encourage all users to read this policy carefully to understand their
        rights and our obligations.
      </p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Ober Artisan Drums. We are committed to protecting your
        privacy and handling your personal information responsibly. This Privacy
        Policy outlines how we collect, use, and disclose information when you
        visit our website, submit forms through any source, use site tools or
        interactive features, create or access an account, contribute content to
        archive/storytelling features, or make a purchase via Stripe.
      </p>

      <h2>2. Information We Collect</h2>
      <p>
        <strong>Personal Information:</strong> Your name, email, phone number,
        shipping address, billing address, and other information you choose to
        provide when placing an order, contacting us, requesting a service, or
        creating an account.
        <br />
        <br />
        <strong>Payment Information:</strong> Payment is securely processed via
        Stripe or authorized payment partners. We do not store full credit card
        numbers or sensitive payment credentials.
        <br />
        <br />
        <strong>Lead Form Submissions:</strong> If you submit a form through any
        platform (including but not limited to LinkedIn, Facebook, Instagram,
        TikTok, or third-party tools), we may collect your name, email address,
        company, phone number, and other voluntarily submitted information. This
        includes all forms of inbound lead capture, regardless of source.
        <br />
        <br />
        <strong>Usage Data:</strong> We may collect browser and session data
        such as IP address, device type, referral URL, approximate location,
        pages viewed, on-site interactions, and general event/activity data used
        to improve performance, safety, and user experience.
        <br />
        <br />
        <strong>Cookies and Similar Technologies:</strong> Small data files and
        related tools used to optimize your experience, maintain sessions, track
        activity, improve performance, and help protect our site from abuse.
        <br />
        <br />
        <strong>Legacy Vault / Archive / Story Content:</strong> If you use
        Legacy Vault or related archive, owner-story, NFC, or memory-based
        features, we may collect text, stories, photos, media, external links,
        public/private visibility choices, and related metadata that you choose
        to submit.
        <br />
        <br />
        <strong>Tool and Build Input Data:</strong> If you use configuration,
        voicing, recommendation, or build-exploration tools on our site, we may
        collect or log the build inputs, option selections, outputs, and
        interaction events needed to operate, improve, secure, or troubleshoot
        those tools.
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To process and fulfill orders via Stripe and related providers</li>
        <li>To communicate with you regarding inquiries, submissions, purchases, or services</li>
        <li>To operate customer accounts, project portals, and gated features</li>
        <li>To review, moderate, publish, or manage Legacy Vault submissions</li>
        <li>To generate, display, or improve interactive tool outputs and recommendations</li>
        <li>To send updates or marketing communications if you opt in</li>
        <li>To optimize user experience and improve our products and services</li>
        <li>To maintain site security and detect, prevent, or investigate fraud or misuse</li>
        <li>To comply with legal, tax, operational, or recordkeeping obligations</li>
      </ul>

      <h2>4. Sharing Your Information</h2>
      <p>
        We do not sell or rent your personal data. We may share your data with:
        <br />
        <br />
        <strong>Trusted Service Providers:</strong> Such as Stripe, Klarna,
        hosting platforms, analytics providers, storage providers, email
        providers, shipping providers, customer-support tools, and other vendors
        reasonably required to operate our business.
        <br />
        <br />
        <strong>Public or Semi-Public Features You Choose to Use:</strong> If
        you submit content to Legacy Vault or similar features and mark content
        as public, approved content may be visible to other users or visitors.
        <br />
        <br />
        <strong>Legal Authorities:</strong> When required by law or when
        reasonably necessary to protect our business, brand, products, users, or
        systems from fraud, abuse, infringement, or harm.
      </p>

      <h2>5. Payment Processing</h2>
      <p>
        We use Stripe to process payments. Stripe uses encryption and follows
        PCI-DSS compliance standards to safeguard payment data. Learn more at{' '}
        <a
          href="https://stripe.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          stripe.com/privacy
        </a>
        .
      </p>

      <h2>5A. Klarna Payments</h2>
      <p>
        We offer certain “buy now, pay later” options through Klarna via Stripe.
        If you choose Klarna at checkout, Klarna will collect and process
        personal data as an independent controller to assess eligibility, which
        may include a credit check, prevent fraud, and manage your repayment
        plan. We share limited order details with Klarna to enable the
        transaction. Your use of Klarna is subject to Klarna&apos;s{' '}
        <a
          href="https://www.klarna.com/us/privacy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>{' '}
        and related legal terms.
      </p>
      <p>
        Klarna may contact you directly about your payments and may report
        payment behavior as permitted by law. For more information, please see{' '}
        <a
          href="https://www.klarna.com/us/privacy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Klarna&apos;s privacy center
        </a>
        .
      </p>

      <h2>6. reCAPTCHA &amp; Bot Protection</h2>
      <p>
        This site may use Google reCAPTCHA or similar anti-abuse protections to
        prevent spam, fraud, and misuse. Use of such tools is subject to
        Google&apos;s{' '}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>{' '}
        and{' '}
        <a
          href="https://policies.google.com/terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          Terms of Service
        </a>
        .
      </p>

      <h2>7. Legacy Vault / Public Submission Features</h2>
      <p>
        If you submit content to Legacy Vault or related storytelling, archive,
        owner-page, or NFC-linked experiences, we may collect the content,
        associated metadata, and your visibility settings. Content may be
        reviewed by us before publication. If you choose to make content public,
        approved content may be visible to others and may be indexed, shared, or
        accessed by third parties beyond our control.
      </p>
      <p>
        You should avoid submitting private, confidential, or sensitive
        information that you do not want displayed, stored, or reviewed in
        connection with these features.
      </p>

      <h2>8. Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal
        information by contacting us. Depending on the nature of your request,
        we may retain certain information where necessary for legal compliance,
        fraud prevention, order fulfillment, dispute resolution, internal
        records, or legitimate business operations.
      </p>

      <h2>9. Data Security</h2>
      <p>
        We implement reasonable administrative, technical, and operational
        safeguards to protect your data, but no method of transmission or
        storage is fully guaranteed. We reserve the right to monitor, block, or
        restrict accounts, submissions, devices, sessions, or IP addresses that
        demonstrate suspicious, abusive, or unauthorized behavior.
      </p>

      <h2>10. External Links</h2>
      <p>
        We may link to third-party services such as Stripe, Klarna, LinkedIn,
        Meta properties, Spotify, Apple Music, YouTube, or other outside
        platforms. We are not responsible for their privacy practices. Please
        review those third-party policies before submitting your information to
        them.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this policy periodically. The most current version will
        always appear here, and your continued use of our site implies
        acceptance of the current policy.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests, please contact us at{' '}
        <strong>support@oberartisandrums.com</strong>.
      </p>
    </div>
  );
});

PrivacyPolicy.displayName = 'PrivacyPolicy';
export default PrivacyPolicy;