import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "../context/CartContext"; // ✅ Import Cart Context
import "./Checkout.css";

// Environment Variables
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const VERIFY_URL = process.env.REACT_APP_RECAPTCHA_VERIFY_URL;
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// Stripe Initialization
if (!stripePublishableKey) {
  console.error("⚠️ Stripe publishable key is missing. Check your .env file.");
}
console.log("Stripe Publishable Key in Checkout:", process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const stripePromise = loadStripe(`${process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY}`);

const Checkout = ({ cartItems, totalAmount, onApplyPromo }) => {
  const { clearCartOnCheckout } = useCart(); // ✅ Ensure useCart() is properly placed at the top
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(""); // Holds clientSecret from your server
  const stripe = useStripe();
  const elements = useElements();

  // Fetch client secret from the server
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
          console.error("⚠️ No client secret received from the backend.");
        }
      } catch (error) {
        console.error("❌ Error fetching client secret:", error);
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
      setError("Invalid promo code.");
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
      // Execute reCAPTCHA v3
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "checkout" });

      // Verify reCAPTCHA token
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

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        alert(`❌ Payment failed: ${stripeError.message}`);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        alert("✅ Payment successful! Clearing cart...");

        try {
          await clearCartOnCheckout(); // ✅ Cart will be cleared after successful checkout
          console.log("🛒 Cart successfully cleared.");
        } catch (error) {
          console.error("❌ Error clearing cart:", error);
        }
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