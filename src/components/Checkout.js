// src/components/Checkout.js
import React, { useState, useEffect, useMemo } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "../context/CartContext";
import { getRecaptchaToken } from "../utils/loadRecaptchaEnterprise";
import "./Checkout.css";

// Env vars
const RECAPTCHA_SITE_KEY =
  process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY ||
  process.env.REACT_APP_RECAPTCHA_SITE_KEY ||
  "";
const API_BASE = process.env.REACT_APP_API_URL; // your backend base url
const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// Load Stripe once (parent should wrap with <Elements stripe={stripePromise}>)
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || "");

const Checkout = ({ cartItems = [], totalAmount = 0, onApplyPromo = () => {} }) => {
  const { clearCartOnCheckout } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState("");
  const [flowMsg, setFlowMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  const stripe = useStripe();
  const elements = useElements();

  // Final amount after discount (in dollars shown to user)
  const finalAmount = useMemo(() => {
    const n = Number(totalAmount) || 0;
    const d = 1 - (Number(discount) || 0);
    return Math.max(0, n * d);
  }, [totalAmount, discount]);

  // Convert to cents (integer) for backend/Stripe
  const finalAmountCents = useMemo(() => Math.round(finalAmount * 100), [finalAmount]);

  // Create/refresh a PaymentIntent when amount changes
  useEffect(() => {
    const createIntent = async () => {
      setClientSecret("");
      setFlowMsg("");
      if (!API_BASE) {
        console.error("❌ Missing REACT_APP_API_URL.");
        return;
      }
      if (finalAmountCents <= 0) return;

      try {
        // Best-effort reCAPTCHA Enterprise token
        let recaptchaToken = "";
        if (RECAPTCHA_SITE_KEY) {
          try {
            recaptchaToken = await getRecaptchaToken(
              RECAPTCHA_SITE_KEY,
              "create_payment_intent"
            );
          } catch (e) {
            console.warn("⚠️ reCAPTCHA token unavailable (create PI):", e);
          }
        }

        const res = await fetch(`${API_BASE}/create-payment-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalAmountCents, // cents (integer)
            recaptchaToken,          // let backend verify with Recaptcha Enterprise
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error("❌ create-payment-intent failed:", data);
          setError(data?.message || "Unable to initialize payment.");
          return;
        }

        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          console.error("⚠️ No clientSecret returned.");
          setError("Unable to initialize payment.");
        }
      } catch (err) {
        console.error("❌ Error creating PaymentIntent:", err);
        setError("Unable to initialize payment. Please try again.");
      }
    };

    createIntent();
  }, [API_BASE, finalAmountCents]);

  // Promo handling
  const handleApplyPromo = () => {
    setError("");
    if (promoCode.trim().toUpperCase() === "DRUM10") {
      setDiscount(0.10);
      onApplyPromo(0.10);
    } else {
      setDiscount(0);
      onApplyPromo(0);
      setError("Invalid promo code.");
    }
  };

  // Checkout flow
  const handleCheckout = async () => {
    setFlowMsg("");
    setError("");

    if (!stripe || !elements) {
      setError("Payment is not ready yet. Please wait a moment.");
      return;
    }
    if (!clientSecret) {
      setError("No client secret. Payment cannot proceed.");
      return;
    }

    setLoading(true);

    try {
      // Fresh reCAPTCHA token for payment confirmation (best-effort)
      if (RECAPTCHA_SITE_KEY) {
        try {
          await getRecaptchaToken(RECAPTCHA_SITE_KEY, "confirm_payment");
        } catch (e) {
          console.warn("⚠️ reCAPTCHA token unavailable (confirm):", e);
        }
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError("Payment form is not ready. Please refresh and try again.");
        setLoading(false);
        return;
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: { card: cardElement },
        }
      );

      if (stripeError) {
        setError(stripeError.message || "Payment failed.");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        setFlowMsg("✅ Payment successful! Clearing cart…");
        try {
          await clearCartOnCheckout();
        } catch (cartErr) {
          console.error("❌ Error clearing cart:", cartErr);
        }
        setFlowMsg("✅ Payment successful!");
      } else {
        setError("Payment was not completed. Please try again.");
      }
    } catch (err) {
      console.error("❌ Payment processing error:", err);
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isPayDisabled =
    loading ||
    !stripe ||
    !elements ||
    !clientSecret ||
    finalAmountCents <= 0 ||
    cartItems.length === 0;

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
              <p>Price: ${Number(item.price).toFixed(2)}</p>
              <p>Quantity: {item.quantity}</p>
              <p>Total: {(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div className="promo-code-section">
        <h2>Apply Promo Code</h2>
        <div className="promo-input-wrapper">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter Promo Code"
            disabled={loading}
          />
          <button onClick={handleApplyPromo} disabled={loading}>
            Apply
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
        {flowMsg && <p className="info-message">{flowMsg}</p>}
      </div>

      {/* Order Summary */}
      <div className="order-summary">
        <h2>Order Summary</h2>
        <div className="summary-line">
          <span>Subtotal:</span>
          <span>${Number(totalAmount).toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div className="summary-line discount">
            <span>Discount ({Math.round(discount * 100)}%):</span>
            <span>- {(Number(totalAmount) * Number(discount)).toFixed(2)}</span>
          </div>
        )}
        <div className="summary-line total">
          <span>Total Amount:</span>
          <span>${finalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Card Element */}
      <div className="card-element-wrapper">
        <CardElement options={{ hidePostalCode: true }} />
      </div>

      {/* Checkout Button */}
      <button className="checkout-btn" onClick={handleCheckout} disabled={isPayDisabled}>
        {loading ? "Processing..." : "Proceed to Payment"}
      </button>
    </div>
  );
};

export default Checkout;