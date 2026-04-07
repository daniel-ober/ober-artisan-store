// src/components/TermsOfService.js

import React, { forwardRef } from 'react';
import './TermsOfService.css';

const TermsOfService = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="terms-of-service-container">
      <h1>Terms of Service</h1>

      <p>
        These Terms of Service outline the rules and responsibilities when using
        our site, tools, content, or making a purchase. By continuing to use
        our services, you agree to abide by these terms in full. We may update
        these terms at any time without prior notice, and the version in effect
        at the time of your interaction or transaction will apply. We recommend
        reviewing them carefully.
      </p>

      <h2>1. Agreement to Terms</h2>
      <p>
        By accessing or using the Ober Artisan Drums website or services, you
        agree to these Terms and our Privacy Policy. If you do not agree, you
        must not use this site.
      </p>

      <h2>2. Permitted Use</h2>
      <p>
        You agree to use our website for lawful purposes only and in ways that
        do not violate the rights of others or disrupt the site&apos;s
        functionality.
      </p>

      <h2>3. Account Registration</h2>
      <p>
        Certain features may require account registration. You are responsible
        for safeguarding your account credentials and for all actions taken
        under your account.
      </p>

      <h2>4. Orders and Product Information</h2>
      <p>
        We strive for accuracy in product listings but do not guarantee it. We
        reserve the right to cancel, limit, refuse, or modify orders at our
        discretion, particularly in cases of suspected misuse, fraud, pricing
        errors, inventory issues, or other operational concerns.
      </p>

      <h2>5. Payments</h2>
      <p>
        Payments are securely processed via Stripe or other authorized gateways.
        By ordering, you authorize us to charge your selected payment method for
        the displayed amount.
      </p>

      <h2>5A. Klarna “Buy Now, Pay Later” Options</h2>
      <p>
        We offer Klarna through Stripe. When you select Klarna, your payment
        contract is with Klarna, and additional Klarna terms apply at checkout.
        For “Monthly Financing,” credit is issued by WebBank, subject to
        approval; APR may range from 0.00%–35.99% depending on creditworthiness
        and term length. Minimum purchase and/or a down payment may be required.
        Taxes and shipping are excluded from estimated monthly payment examples
        shown at checkout.
      </p>
      <p>
        Klarna authorizations must be captured when we ship your order. By
        default, if an order is not shipped/captured within approximately 28
        days, the authorization may expire and your order may be cancelled or
        require re-authorization. For made-to-order items with longer lead
        times, we may (i) use a different payment method, (ii) offer Klarna
        Monthly Financing only, or (iii) cancel and reissue the order once the
        item is ready to ship.
      </p>

      <h2>6. Shipping and Delivery</h2>
      <p>
        Orders are typically fulfilled and shipped promptly, but we cannot
        guarantee delivery times. Shipping costs and timelines may vary by
        location.
      </p>
      <p>
        <strong>Free shipping eligibility:</strong> Free shipping promotions are
        valid only within the contiguous United States (the “lower 48” states).
        Orders shipped to Alaska, Hawaii, or U.S. territories do not qualify for
        free shipping and may require additional shipping charges.
      </p>
      <p>
        <strong>How shipping fees are handled:</strong> Standard shipping fees
        are shown at checkout for most orders. For Alaska, Hawaii, or U.S.
        territories, shipping rates may not be automatically calculated. If this
        happens, your order will be placed on hold and we will contact you with
        a separate payment link for the additional shipping cost. Orders will
        not ship until these charges are paid.
      </p>

      <h2>7. Returns and Refunds</h2>
      <p>
        Our refund and return policy is available on our site. By placing an
        order, you acknowledge and agree to those terms, including all
        provisions related to payment plans, promotional pricing, custom work,
        made-to-order items, and non-refundable items.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        All site content—including text, graphics, interfaces, branding, media,
        software, design, product presentation, and related materials—is the
        exclusive property of Ober Artisan Drums or its licensors, unless
        otherwise stated. No content may be reused, distributed, reproduced,
        republished, displayed, adapted, or exploited without prior written
        permission.
      </p>

      <h2>9. Ober LegacyPrint™ Voicing Engine</h2>
      <p>
        The <strong>Ober LegacyPrint™ Voicing Engine</strong>, including its
        name, presentation, scoring framework, tonal language, recommendation
        logic, visual output style, and related features, is proprietary to Ober
        Artisan Drums. Any rights not expressly granted are reserved.
      </p>
      <p>
        The Ober LegacyPrint™ Voicing Engine is provided solely as an
        informational shopping, education, and build-exploration tool. It
        generates Ober voicing estimates using proprietary heuristics, internal
        weighting logic, and artistic build methodology. It is not a laboratory
        acoustic measurement tool, certified test instrument, engineering
        specification, or guarantee of final acoustic outcome.
      </p>
      <p>
        By using this tool, you agree not to copy, scrape, systematically
        extract, mirror, republish, resell, reverse engineer, decompile,
        benchmark for competitive purposes, train models on, or otherwise
        exploit the tool, its outputs, or its underlying presentation or logic
        except as expressly permitted in writing by Ober Artisan Drums.
      </p>

      <h2>10. Product Estimates, Recommendations, and Disclaimers</h2>
      <p>
        Any tonal summaries, build suggestions, voicing estimates, ranges,
        recommendations, comparisons, or similar outputs shown on this website
        are informational only. Actual results may vary based on materials,
        craftsmanship, setup, tuning, environment, playing technique, aging,
        maintenance, and other real-world variables.
      </p>
      <p>
        We make no representation or warranty that any estimate, readout,
        recommendation, or generated output will match final performance exactly
        or be suitable for any specific commercial, technical, recording, or
        performance purpose.
      </p>

      <h2>11. Prohibited Conduct</h2>
      <ul>
        <li>Submit fraudulent, misleading, or abusive information</li>
        <li>Attempt to access restricted areas, systems, accounts, or data</li>
        <li>Probe, scan, test, or exploit site vulnerabilities</li>
        <li>Use automated means to scrape or extract content or tool outputs</li>
        <li>Use the site or tools for unlawful, infringing, or competitive misuse</li>
        <li>Disrupt, overload, degrade, or interfere with website functionality</li>
        <li>Impersonate another person or misrepresent your affiliation</li>
      </ul>
      <p>
        We reserve the right to suspend access, block IPs, disable accounts,
        cancel orders, preserve records, or take legal action in response to any
        prohibited behavior.
      </p>

      <h2>12. Limitation of Liability</h2>
      <p>
        Use of this site is at your own risk. To the fullest extent permitted by
        law, we are not liable for indirect, incidental, consequential, special,
        exemplary, or punitive damages, or for service interruptions, data loss,
        third-party conduct, inaccuracies, or outputs generated by site tools.
      </p>

      <h2>13. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless Ober Artisan Drums and
        its owners, affiliates, contractors, and service providers from and
        against claims, liabilities, damages, losses, and expenses arising out
        of your misuse of the site, your violation of these Terms, or your
        infringement of any rights of another person or entity.
      </p>

      <h2>14. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the State of Tennessee, USA,
        without regard to conflict-of-law principles. All disputes shall be
        resolved exclusively in courts located in Tennessee, unless applicable
        law requires otherwise.
      </p>

      <h2>15. Modifications to Terms</h2>
      <p>
        We may update these Terms periodically. The most current version will
        always appear here, and your continued use of the site implies agreement
        to the current version.
      </p>

      <h2>16. Contact Us</h2>
      <p>
        If you have any questions, concerns, or requests, please contact us at{' '}
        <strong>support@oberartisandrums.com</strong>.
      </p>
    </div>
  );
});

TermsOfService.displayName = 'TermsOfService';
export default TermsOfService;