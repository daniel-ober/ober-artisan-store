import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "./Checkout.css";

// Use your REACT_APP_RECAPTCHA_SITE_KEY and VERIFY_URL
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const VERIFY_URL = process.env.REACT_APP_RECAPTCHA_VERIFY_URL;

// Stripe Initialization
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
if (!stripePublishableKey) {
  console.error("Stripe publishable key is missing");
}
const stripePromise = loadStripe(stripePublishableKey);

// Log the Stripe Publishable Key for debugging
console.log('Stripe Publishable Key:', process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Checkout = ({ cartItems, totalAmount, onApplyPromo }) => {
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(""); // To hold clientSecret from your server
  const stripe = useStripe();
  const elements = useElements();

  // Fetch client secret from the server to create the payment intent
  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalAmount * 100 }), // Convert to cents
        });
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("No client secret received");
        }
      } catch (error) {
        console.error("Error fetching client secret", error);
      }
    };

    if (totalAmount > 0) {
      fetchClientSecret();
    }
  }, [totalAmount]);

  const handleApplyPromo = () => {
    if (promoCode.trim() === "DRUM10") {
      setDiscount(0.1); // 10% discount
      setError("");
      onApplyPromo(0.1);
    } else {
      setDiscount(0);
      setError("Invalid promo code");
    }
  };

  const finalAmount = (totalAmount * (1 - discount)).toFixed(2);

  const handleCheckout = async () => {
    setLoading(true);

    if (!window.grecaptcha) {
      alert("⚠️ reCAPTCHA not loaded. Please refresh and try again.");
      setLoading(false);
      return;
    }

    try {
      // Execute reCAPTCHA v3 in the background
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "checkout" });

      // Log token to check it's being generated
      console.log("reCAPTCHA Token:", token);

      // Continue with the fetch request to verify reCAPTCHA
      const response = await fetch(VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      if (!data.success) {
        alert("❌ reCAPTCHA verification failed. Please try again.");
        setLoading(false);
        return;
      }

      // Use Stripe's confirmCardPayment with the clientSecret and cardElement
      const cardElement = elements.getElement(CardElement); // Get the CardElement
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret, // Use the clientSecret received from your server
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        alert(`❌ Payment failed: ${stripeError.message}`);
      } else {
        alert("✅ Checkout successful! Proceeding to payment...");
      }

    } catch (error) {
      console.error("❌ Error verifying reCAPTCHA:", error);
      alert("❌ Error verifying reCAPTCHA.");
    }

    setLoading(false);
  };

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>

      {/* Cart Items */}
      <div className="cart-summary">
        {cartItems.map((item) => (
          <div className="cart-item" key={item.id}>
            <img src={item.image} alt={item.name} className="item-image" />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p className="description">{item.description}</p>
              <p>Price: ${item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Total: ${(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="item-actions">
              <button className="remove-btn">Remove</button>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Section */}
      <div className="promo-code-section">
        <h2>Apply Promo Code</h2>
        <div className="promo-input-wrapper">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter Promo Code"
          />
          <button onClick={handleApplyPromo}>Apply</button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-line">
          <span>Subtotal:</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="summary-line discount">
            <span>Discount (10%):</span>
            <span>- ${(totalAmount * discount).toFixed(2)}</span>
          </div>
        )}
        <div className="summary-line total">
          <span>Total Amount:</span>
          <span>${finalAmount}</span>
        </div>
      </div>

      {/* Card Element */}
      <CardElement />

      {/* Checkout Button with reCAPTCHA v3 */}
      <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
        {loading ? "Processing..." : "Proceed to Payment"}
      </button>

      {/* reCAPTCHA v3 Script */}
      <script src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`} async defer></script>
    </div>
  );
};

export default Checkout;