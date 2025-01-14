import React, { forwardRef } from 'react';
import './TermsOfService.css';

const TermsOfService = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="terms-of-service-container">
      <h1>Terms of Service</h1>
      <p>Effective Date: January 1, 2025</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using the Dan Ober Artisan Drums website, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our website.
      </p>

      <h2>2. Use of the Website</h2>
      <p>
        You agree to use our website only for lawful purposes and in a manner that does not infringe on the rights of others or restrict their use of the website.
      </p>

      <h2>3. Account Registration</h2>
      <p>
        To make a purchase or access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
      </p>

      <h2>4. Product Information and Orders</h2>
      <p>
        We strive to provide accurate and up-to-date information about our products. However, we do not guarantee the accuracy, completeness, or reliability of product descriptions or prices. We reserve the right to refuse or cancel any order for any reason.
      </p>

      <h2>5. Payment</h2>
      <p>
        All payments must be made through our designated payment methods. By providing payment information, you authorize us to charge the applicable amount to your payment method.
      </p>

      <h2>6. Shipping and Delivery</h2>
      <p>
        We will make reasonable efforts to process and ship orders in a timely manner. Delivery times may vary depending on your location and other factors.
      </p>

      <h2>7. Returns and Refunds</h2>
      <p>
        Our return and refund policy is outlined separately on our website. Please review this policy before making a purchase.
      </p>

      <h2>8. Intellectual Property</h2>
      <p>
        All content on our website, including text, images, and logos, is owned by Dan Ober Artisan Drums or its licensors and is protected by intellectual property laws. You may not use or reproduce any content without our permission.
      </p>

      <h2>9. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Dan Ober Artisan Drums shall not be liable for any indirect, incidental, consequential, or punitive damages arising out of or related to your use of the website or our products.
      </p>

      <h2>10. Governing Law</h2>
      <p>
        These Terms of Service shall be governed by and construed in accordance with the laws of Tennessee, USA. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Tennessee, USA.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms of Service at any time. Any changes will be posted on this page, and your continued use of the website constitutes acceptance of the updated terms.
      </p>

      <h2>12. Contact Us</h2>
      <p>
        If you have any questions or concerns about these Terms of Service, please contact us at support@danoberartisan.com.
      </p>
    </div>
  );
});

// Add a display name to the component for debugging
TermsOfService.displayName = 'TermsOfService';

export default TermsOfService;
