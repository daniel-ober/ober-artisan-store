// src/components/PrivacyPolicy.js

import React, { forwardRef } from 'react';
import './PrivacyPolicy.css';

const PrivacyPolicy = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="privacy-policy-container">
      <h1>Privacy Policy</h1>

      <p>
        This Privacy Policy applies to all interactions with Ober Artisan Drums,
        including browsing our website, using our tools, submitting inquiries,
        and making purchases. By using our services, you agree to the practices
        described here. We may update this policy at any time without prior
        notice, and the version in effect at the time of your interaction will
        apply. We encourage all users to read this policy carefully to
        understand their rights and our obligations.
      </p>

      <h2>1. Introduction</h2>
      <p>
        Welcome to Ober Artisan Drums. We are committed to protecting your
        privacy and handling your personal information responsibly. This Privacy
        Policy outlines how we collect, use, disclose, and safeguard
        information when you visit our website, use interactive site features,
        submit lead forms through any source, or make a purchase via Stripe.
      </p>

      <h2>2. Information We Collect</h2>
      <p>
        <strong>Personal Information:</strong> Your name, email, phone number,
        and shipping/billing address when you place an order or contact us.
        <br />
        <br />
        <strong>Payment Information:</strong> Payment is securely processed via
        Stripe. We do not store full credit card numbers or sensitive payment
        credentials.
        <br />
        <br />
        <strong>Lead Form Submissions:</strong> If you submit a form through any
        platform (including but not limited to LinkedIn, Facebook, Instagram,
        TikTok, or third-party tools), we may collect your name, email address,
        company, or other voluntarily submitted information. This includes all
        forms of inbound lead capture, regardless of source.
        <br />
        <br />
        <strong>Tool Input and Interaction Data:</strong> If you use interactive
        features such as the Ober LegacyPrint™ Voicing Engine or related build
        tools, we may collect the selections, configuration inputs, generated
        outputs, session interaction patterns, and related diagnostic or usage
        information needed to operate, improve, secure, troubleshoot, and
        analyze those features.
        <br />
        <br />
        <strong>Usage Data:</strong> We may collect browser and session data
        such as IP address, approximate location derived from IP, device type,
        referral URL, pages viewed, interaction timing, crash/error events, and
        general analytics information.
        <br />
        <br />
        <strong>Cookies and Similar Technologies:</strong> Small data files or
        related technologies may be used to optimize your experience, maintain
        sessions, detect abuse, track activity, and improve website performance.
      </p>

      <h2>3. How We Use Your Information</h2>
      <ul>
        <li>To process and fulfill orders via Stripe</li>
        <li>To communicate with you regarding inquiries, submissions, or purchases</li>
        <li>To provide, operate, and maintain site features and customer accounts</li>
        <li>To generate voicing estimates, build recommendations, and related tool outputs</li>
        <li>To improve user experience and refine our products, services, and interactive tools</li>
        <li>To send updates or marketing communications if you opt in</li>
        <li>To comply with legal, tax, security, or operational obligations</li>
        <li>To detect, prevent, investigate, or respond to fraud, abuse, or misuse</li>
      </ul>

      <h2>4. Ober LegacyPrint™ Voicing Engine</h2>
      <p>
        The Ober LegacyPrint™ Voicing Engine is a proprietary interactive tool
        that generates Ober voicing estimates and related recommendations based
        on user-provided build selections and internal logic. When you use this
        tool, we may process the options you enter, the resulting outputs,
        and related interaction data to provide the feature, improve the user
        experience, maintain system security, and support internal analytics and
        product refinement.
      </p>
      <p>
        Tool outputs are generated from internal heuristics and artistic build
        logic. They are informational and are not laboratory measurements or
        guaranteed acoustic results.
      </p>

      <h2>5. Sharing Your Information</h2>
      <p>
        We do not sell or rent your personal data. We may share your data with:
        <br />
        <br />
        <strong>Trusted Service Providers:</strong> Such as Stripe (payments),
        hosting platforms, analytics tools, security and anti-abuse providers,
        storage providers, shipping providers, email providers, and other
        vendors that help us operate the business and website.
        <br />
        <br />
        <strong>Professional or Legal Advisors:</strong> When reasonably
        necessary for compliance, dispute resolution, risk management, or
        enforcement of our rights.
        <br />
        <br />
        <strong>Legal Authorities:</strong> When required by law or when we
        believe disclosure is reasonably necessary to protect our business,
        systems, brand, customers, or users from fraud, misuse, security
        threats, or harm.
      </p>

      <h2>6. Payment Processing</h2>
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

      <h3>6A. Klarna Payments</h3>
      <p>
        We offer certain “buy now, pay later” options through Klarna via Stripe.
        If you choose Klarna at checkout, Klarna will collect and process
        personal data as an independent controller to assess eligibility, which
        may include a credit check, help prevent fraud, and manage your
        repayment plan. We share limited order details with Klarna to enable the
        transaction. Your use of Klarna is subject to Klarna’s{' '}
        <a
          href="https://www.klarna.com/us/privacy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy Policy
        </a>{' '}
        and legal terms.
      </p>
      <p>
        Klarna may contact you directly about your payments and may report
        payment behavior as permitted by law. For more information about
        Klarna’s data practices and your rights with Klarna, please review
        Klarna’s policies directly.
      </p>

      <h2>7. reCAPTCHA &amp; Bot Protection</h2>
      <p>
        This site may use Google reCAPTCHA or similar anti-abuse technologies to
        prevent spam, fraud, and misuse. Use of reCAPTCHA is subject to
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

      <h2>8. Cookies and Analytics</h2>
      <p>
        We and our service providers may use cookies, local storage, analytics,
        or similar technologies to remember user preferences, maintain sessions,
        understand site performance, measure tool usage, improve navigation, and
        help detect suspicious or abusive behavior.
      </p>

      <h2>9. Data Retention</h2>
      <p>
        We retain personal information for as long as reasonably necessary for
        the purposes described in this Privacy Policy, including to provide
        services, maintain records, support security and fraud prevention,
        comply with legal obligations, resolve disputes, and enforce our
        agreements.
      </p>

      <h2>10. Your Rights</h2>
      <p>
        Depending on your location and applicable law, you may request access
        to, correction of, or deletion of certain personal information we hold
        about you. You may also request information about the categories of data
        we collect and how we use it. To make a request, contact us using the
        information below.
      </p>

      <h2>11. Data Security</h2>
      <p>
        We implement reasonable administrative, technical, and organizational
        safeguards designed to protect your information. However, no method of
        transmission, storage, or security is fully guaranteed. We reserve the
        right to restrict access, suspend accounts, block users, or block IP
        addresses that demonstrate suspicious, abusive, or unauthorized
        behavior.
      </p>

      <h2>12. External Links and Third-Party Services</h2>
      <p>
        We may link to or rely on third-party services such as Stripe, Klarna,
        LinkedIn, Meta properties, Google services, analytics providers, or
        other third-party tools. We are not responsible for their privacy
        practices. Please review those third-party policies before submitting
        your information to them.
      </p>

      <h2>13. Children’s Privacy</h2>
      <p>
        Our website and services are not directed to children under 13, and we
        do not knowingly collect personal information from children under 13. If
        you believe a child has provided us with personal information, please
        contact us so we can review and address the matter.
      </p>

      <h2>14. Changes to This Policy</h2>
      <p>
        We may update this policy periodically. The most current version will
        always appear here, and your continued use of our site implies
        acceptance of the current policy.
      </p>

      <h2>15. Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests, please contact us at{' '}
        <strong>support@oberartisandrums.com</strong>.
      </p>
    </div>
  );
});

PrivacyPolicy.displayName = 'PrivacyPolicy';
export default PrivacyPolicy;