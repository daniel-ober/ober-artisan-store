import React, { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

// Environment Variables
const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
const VERIFY_URL = process.env.REACT_APP_RECAPTCHA_VERIFY_URL;
const stripePublishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// ✅ Debugging Log: Ensure the API URL is correctly loaded
console.log("🌍 API Base URL:", process.env.REACT_APP_API_URL);
console.log("🔑 Stripe Publishable Key:", stripePublishableKey);

const stripePromise = loadStripe(stripePublishableKey);

const Checkout = ({ cartItems, totalAmount, onApplyPromo }) => {
  const { clearCartOnCheckout } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const stripe = useStripe();
  const elements = useElements();

  // ✅ Ensure reCAPTCHA script is loaded dynamically
  useEffect(() => {
    if (RECAPTCHA_SITE_KEY) {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    } else {
      console.warn("⚠️ reCAPTCHA site key is missing.");
    }
  }, []);

  // ✅ Fetch client secret from the backend
  useEffect(() => {
    const fetchClientSecret = async () => {
      if (totalAmount <= 0) return; // Ensure totalAmount is greater than 0
    
      try {
        console.log("📡 Sending Payment Intent Request to:", process.env.REACT_APP_API_URL);

        const response = await fetch(`${process.env.REACT_APP_API_URL}/create-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: totalAmount * 100 }), // Convert to cents
        });

        const data = await response.json();
        console.log("✅ Payment Intent Response:", data);

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("⚠️ No client secret received from the backend.");
        }
      } catch (error) {
        console.error("❌ Error fetching client secret:", error);
      }
    };

    fetchClientSecret();
  }, [totalAmount]);

  // ✅ Handle Promo Code Application
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

  // ✅ Handle Checkout with Stripe
  const handleCheckout = async () => {
    if (!clientSecret) {
      console.error("❌ No client secret. Payment cannot proceed.");
      return;
    }

    setLoading(true);

    try {
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
          // console.log("🛒 Cart successfully cleared.");
        } catch (error) {
          console.error("❌ Error clearing cart:", error);
        }
        alert("✅ Payment successful!");
        await clearCartOnCheckout(); // Clear cart after successful checkout
      }
    } catch (error) {
      console.error("❌ Payment processing error:", error);
      alert("❌ Payment failed. Please try again.");
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

      {/* Checkout Button */}
      <button className="checkout-btn" onClick={handleCheckout} disabled={loading}>
        {loading ? "Processing..." : "Proceed to Payment"}
      </button>
    </div>
  );
};

export default Checkout;
