import React, { useState } from "react";
import { db } from "../firebaseConfig";
import { collection, doc, setDoc, deleteDoc } from "firebase/firestore";
import "./SubscribeForm.css";

const SubscribeForm = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubscription = async (action) => {
    if (!email || !email.includes("@")) {
      setStatus("⚠️ Please enter a valid email.");
      return;
    }

    setLoading(true);
    const emailRef = doc(collection(db, "email_subscriptions"), email);

    try {
      if (action === "subscribe") {
        await setDoc(emailRef, { email, subscribedAt: new Date() });
        setStatus("✅ Subscribed! You'll receive updates.");
      } else {
        await deleteDoc(emailRef);
        setStatus("❌ Unsubscribed! You won’t receive further emails.");
      }
      setEmail("");
    } catch (error) {
      setStatus("❌ Error. Try again later.");
      console.error("Subscription error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscribe-container">
      <h3>Stay Updated!</h3>
      <p>Subscribe for drum updates, discounts, and more.</p>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="subscribe-input"
      />
      <div className="subscribe-buttons">
        <button onClick={() => handleSubscription("subscribe")} disabled={loading}>
          {loading ? "Subscribing..." : "Subscribe"}
        </button>
        <button onClick={() => handleSubscription("unsubscribe")} disabled={loading}>
          {loading ? "Processing..." : "Unsubscribe"}
        </button>
      </div>
      {status && <p className="subscribe-status">{status}</p>}
    </div>
  );
};

export default SubscribeForm;