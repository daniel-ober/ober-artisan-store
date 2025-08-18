import React, { forwardRef } from 'react';
import './TermsOfService.css';

const TermsOfService = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="terms-of-service-container">
      <h1>Terms of Service</h1>

      <p>
        These Terms of Service outline the rules and responsibilities when using our site or making a purchase.
        By continuing to use our services, you agree to abide by these terms in full. We may update these terms at
        any time without prior notice, and the version in effect at the time of your interaction or transaction
        will apply. We recommend reviewing them carefully.
      </p>

      <h2>1. Agreement to Terms</h2>
      <p>
        By accessing or using the Ober Artisan Drums website or services, you agree to these Terms and our Privacy Policy.
        If you do not agree, you must not use this site.
      </p>

      <h2>2. Permitted Use</h2>
      <p>
        You agree to use our website for lawful purposes only and in ways that do not violate the rights of others or
        disrupt the site&apos;s functionality.
      </p>

      <h2>3. Account Registration</h2>
      <p>
        Certain features may require account registration. You are responsible for safeguarding your account credentials
        and for all actions taken under your account.
      </p>

      <h2>4. Orders and Product Information</h2>
      <p>
        We strive for accuracy in product listings but do not guarantee it. We reserve the right to cancel or modify
        orders at our discretion, particularly in cases of suspected misuse or fraud.
      </p>

      <h2>5. Payments</h2>
      <p>
        Payments are securely processed via Stripe or other authorized gateways. By ordering, you authorize us to charge
        your selected payment method for the displayed amount.
      </p>

      {/* NEW: Klarna terms for BNPL + capture window */}
      <h2>5A. Klarna “Buy Now, Pay Later” Options</h2>
      <p>
        We offer Klarna through Stripe. When you select Klarna, your payment contract is with Klarna, and additional
        Klarna terms apply at checkout. For “Monthly Financing,” credit is issued by WebBank, subject to approval; APR
        may range from 0.00%–35.99% depending on creditworthiness and term length. Minimum purchase and/or a down
        payment may be required. Taxes and shipping are excluded from estimated monthly payment examples shown at
        checkout.
      </p>
      <p>
        Klarna authorizations must be captured when we ship your order. By default, if an order is not shipped/captured
        within approximately 28 days, the authorization may expire and your order may be cancelled or require
        re-authorization. For made-to-order items with longer lead times, we may (i) use a different payment method,
        (ii) offer Klarna Monthly Financing only, or (iii) cancel and reissue the order once the item is ready to ship.
      </p>

      <h2>6. Shipping and Delivery</h2>
      <p>
        Orders are typically fulfilled and shipped promptly, but we cannot guarantee delivery times. Shipping costs and
        timelines may vary by location.
      </p>

      <h2>7. Returns and Refunds</h2>
      <p>
        Our refund and return policy is available on our site. By placing an order, you acknowledge and agree to those
        terms, including all provisions related to payment plans, promotional pricing, and non-refundable items.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        All site content—including text, graphics, media, and design—is the exclusive property of Ober Artisan Drums
        or its licensors. No content may be reused, distributed, or reproduced without written permission.
      </p>

      <h2>9. Prohibited Conduct</h2>
      <ul>
        <li>Submit fraudulent or misleading information</li>
        <li>Attempt to access restricted areas or data</li>
        <li>Probe, scan, or test site vulnerabilities</li>
        <li>Use the site for unlawful purposes</li>
        <li>Disrupt or degrade website functionality</li>
      </ul>
      <p>
        We reserve the right to restrict access, block IPs, or take legal action in response to any prohibited behavior.
      </p>

      <h2>10. Limitation of Liability</h2>
      <p>
        Use of this site is at your own risk. We are not liable for indirect, incidental, or consequential damages, or
        for service interruptions, data loss, or third-party breaches.
      </p>

      <h2>11. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Tennessee, USA. All disputes shall be resolved exclusively
        in courts located in Tennessee.
      </p>

      <h2>12. Modifications to Terms</h2>
      <p>
        We may update these Terms periodically. The most current version will always appear here, and your continued use
        of the site implies agreement to the current version.
      </p>

      <h2>13. Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests, please contact us at <strong>support@oberartisandrums.com</strong>.
      </p>
    </div>
  );
});

TermsOfService.displayName = 'TermsOfService';
export default TermsOfService;