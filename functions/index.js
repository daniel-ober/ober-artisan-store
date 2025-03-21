const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const stripeLib = require("stripe");

// ✅ Load Secrets
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = defineSecret("STRIPE_WEBHOOK_SECRET");
const PRINTIFY_API_KEY = defineSecret("PRINTIFY_API_KEY");

// ✅ Initialize Firebase
admin.initializeApp();
const db = admin.firestore();

// ✅ Initialize Express App
const app = express();
app.use(express.json()); // ✅ Use JSON for normal API requests

// ✅ CORS Middleware
const allowedOrigins = [
  "https://oberartisandrums.com",
  "https://danoberartisandrums.web.app"
];

app.use((req, res, next) => {
  if (allowedOrigins.includes(req.headers.origin)) {
    res.set("Access-Control-Allow-Origin", req.headers.origin);
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  next();
});

// ✅ Stripe Checkout Session Creation
app.post("/createCheckoutSession", async (req, res) => {
  try {
    console.log("🛒 Received Checkout Request:", req.body);

    const stripe = stripeLib(STRIPE_SECRET_KEY.value());

    const {
      products,
      userId,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      shippingAddress,
    } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Invalid or empty cart." });
    }

    const lineItems = products.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name || "Unnamed Product",
          description: product.description || "No description available",
          metadata: { productId: product.id },
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: product.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `https://oberartisandrums.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://oberartisandrums.com/cart`,
      metadata: {
        userId: userId || "guest",
        customerFirstName,
        customerLastName,
        customerEmail,
        customerPhone: customerPhone || "No phone provided",
        shippingAddress: JSON.stringify(shippingAddress || {}),
      },
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      allow_promotion_codes: true,
    });

    console.log("✅ Stripe Checkout Session Created:", session.url);
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Error Creating Stripe Checkout Session:", error);
    return res.status(500).json({ error: error.message });
  }
});

// ✅ Stripe Webhook Handling - **Fixed for Firebase v2**
exports.stripeWebhook = onRequest(
  { 
    region: "us-central1", 
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], 
    cors: true, // ✅ Ensure CORS is handled 
    maxInstances: 10 
  },
  async (req, res) => {
    console.log("📩 Incoming Stripe Webhook Request");

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      const stripe = stripeLib(STRIPE_SECRET_KEY.value());

      // ✅ Firebase v2 issue fix: Explicitly extract raw body
      const rawBody = Buffer.from(req.rawBody).toString("utf8");

      if (!sig || !rawBody) {
        console.error("❌ Missing rawBody or signature for Stripe verification.");
        return res.status(400).send("Missing rawBody or signature.");
      }

      event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET.value());
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📩 Received Stripe Webhook Event: ${event.type}`);

    // ✅ Handle Checkout Session Completion
    if (event.type === "checkout.session.completed") {
      console.log("✅ Checkout Session Completed Event Received");

      const session = event.data.object;
      if (!session.metadata || !session.metadata.userId) {
        console.error("❌ Missing user metadata in session.");
        return res.status(400).send("Missing user metadata.");
      }

      console.log("✅ Creating Order in Firestore...");
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const orderData = {
        orderId,
        userId: session.metadata.userId || "guest",
        email: session.customer_email || "unknown",
        totalAmount: session.amount_total / 100,
        currency: session.currency || "usd",
        status: "Processing",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paymentIntentId: session.payment_intent,
      };

      try {
        await db.collection("orders").doc(orderId).set(orderData);
        console.log(`✅ Order Created in Firestore: ${orderId}`);
        return res.status(200).send("✅ Webhook processed successfully.");
      } catch (error) {
        console.error("❌ Error writing to Firestore:", error);
        return res.status(500).send("Error saving order.");
      }
    }

    res.status(200).send("✅ Event received.");
  }
);

// ✅ Deploy Firebase Functions
exports.api = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PRINTIFY_API_KEY] },
  app
);
