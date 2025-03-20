const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");
const stripeLib = require("stripe");

// ✅ Define Secrets
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const PRINTIFY_API_KEY = defineSecret("PRINTIFY_API_KEY");

// ✅ Initialize Firebase
admin.initializeApp();

// ✅ Allowed Frontend Origins for CORS
const allowedOrigins = [
  "https://oberartisandrums.com",
  "https://danoberartisandrums.web.app"
];

// ✅ Stripe Checkout Session Creation (Fixed CORS)
exports.createCheckoutSession = onRequest(
  { region: "us-central1", secrets: [STRIPE_SECRET_KEY] },
  async (req, res) => {
    // Handle CORS preflight request (OPTIONS method)
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      if (allowedOrigins.includes(req.headers.origin)) {
        res.set("Access-Control-Allow-Origin", req.headers.origin);
      }
      return res.status(204).send("");
    }

    try {
      // Retrieve Stripe Secret Key
      const stripeKey = STRIPE_SECRET_KEY.value();
      const stripe = stripeLib(stripeKey);

      const {
        products,
        userId,
        customerFirstName,
        customerLastName,
        customerEmail,
        customerPhone,
        shippingAddress,
      } = req.body;

      const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ error: "Invalid or empty cart." });
      }

      const lineItems = products.map((product) => {
        console.log(`🟢 Processing Product: ${product.name || "Unnamed"}`);
        console.log(`   ➝ ID: ${product.id || "No ID"}`);
        console.log(`   ➝ Price: ${product.price}`);
        console.log(`   ➝ Quantity: ${product.quantity}`);
      
        if (!product.price || product.price <= 0) {
          console.error(`❌ Error: Invalid price for ${product.name}`);
        }
      
        if (!product.quantity || product.quantity < 1) {
          console.error(`❌ Error: Invalid quantity for ${product.name}`);
        }
      
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name || "Unnamed Product",
              description: product.description || "No description available",
              metadata: { productId: product.id },
            },
            unit_amount: Math.round(product.price * 100), // Stripe requires cents
          },
          quantity: product.quantity || 1,
        };
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `https://oberartisandrums.com/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `https://oberartisandrums.com/cart`,

        metadata: {
          userId: userId || 'guest',
          guestToken,
          customerFirstName,
          customerLastName,
          customerEmail,
          customerPhone: customerPhone || 'No phone provided',
          shippingAddress: JSON.stringify(shippingAddress || {}),
        },
        customer_email: customerEmail,

        // ✅ Collect shipping address during checkout
        shipping_address_collection: {
          allowed_countries: ['US', 'CA'],
        },

        // ✅ Define shipping options
        shipping_options: [
          {
            shipping_rate_data: {
              type: 'fixed_amount',
              fixed_amount: { amount: 0, currency: 'usd' }, // Free shipping
              display_name: 'Standard Shipping',
              // delivery_estimate: {
              //   minimum: { unit: 'business_day', value: 3 },
              //   maximum: { unit: 'business_day', value: 7 },
              // },
            },
          },
        ],

        // ✅ Apply coupon codes if available
        allow_promotion_codes: true,
      });

      console.log("✅ Stripe Checkout Session Created:", session.id);

      if (allowedOrigins.includes(req.headers.origin)) {
        res.set("Access-Control-Allow-Origin", req.headers.origin);
      }

      return res.status(200).json({ url: session.url });
    } catch (error) {
      console.error("❌ Error Creating Stripe Checkout Session:", error);

      if (allowedOrigins.includes(req.headers.origin)) {
        res.set("Access-Control-Allow-Origin", req.headers.origin);
      }
      return res.status(500).json({ error: error.message });
    }
  }
);

// ✅ Printify Webhook Listener
exports.printifyWebhookListener = onRequest(
  { region: "us-central1", secrets: [PRINTIFY_API_KEY, STRIPE_SECRET_KEY] },
  async (req, res) => {
    try {
      const event = req.body;
      // console.log("📢 Printify Webhook Event Received:", event);

      if (!event || !event.data || !event.data.id) {
        return res.status(400).send("Invalid webhook event.");
      }

      const productId = event.data.id;
      const productStatus = event.data.status;

      if (productStatus !== "publishing") {
        // console.log(`❌ Product ${productId} is not being published, skipping.`);
        return res.status(200).send("No action needed.");
      }

      // console.log(`✅ Product ${productId} is being published. Creating Stripe product...`);

      const stripeKey = STRIPE_SECRET_KEY.value();
      if (!stripeKey) {
        console.error("❌ Missing Stripe API Key.");
        return res.status(500).send("Server misconfiguration: Missing Stripe API Key.");
      }

      // Fetch the product details from Printify
      const printifyResponse = await axios.get(
        `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products/${productId}.json`,
        {
          headers: {
            Authorization: `Bearer ${PRINTIFY_API_KEY.value()}`,
            "Content-Type": "application/json",
          },
        }
      );

      const product = printifyResponse.data;
      // console.log("✅ Retrieved Printify Product:", product);

      // Create product in Stripe
      const stripeResponse = await axios.post(
        "https://api.stripe.com/v1/products",
        new URLSearchParams({
          name: product.title,
          description: product.description || "Printify product",
          images: product.images.length ? product.images[0] : "",
        }),
        {
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const stripeProduct = stripeResponse.data;
      // console.log("✅ Created Stripe Product:", stripeProduct);

      // Create price in Stripe
      const stripePriceResponse = await axios.post(
        "https://api.stripe.com/v1/prices",
        new URLSearchParams({
          unit_amount: (product.variants[0].price * 100).toString(),
          currency: "usd",
          product: stripeProduct.id,
        }),
        {
          headers: {
            Authorization: `Bearer ${stripeKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const stripePrice = stripePriceResponse.data;
      // console.log("✅ Created Stripe Price:", stripePrice);

      // Store Stripe product & price IDs in Firestore
      await admin.firestore().collection("products").doc(productId).set(
        {
          stripeProductId: stripeProduct.id,
          stripePriceId: stripePrice.id,
          printifyProductId: product.id,
          printifyVariants: product.variants,
        },
        { merge: true }
      );

      return res.status(200).json({
        success: true,
        stripeProductId: stripeProduct.id,
        stripePriceId: stripePrice.id,
      });
    } catch (error) {
      console.error("❌ Error Processing Webhook:", error.response ? error.response.data : error.message);
      return res.status(500).send(error.response ? error.response.data : error.message);
    }
  }
);

// ✅ Restored createPrintifyOrder function
exports.createPrintifyOrder = onRequest(
  { region: "us-central1", secrets: [PRINTIFY_API_KEY] },
  async (req, res) => {
    try {
      const { orderData } = req.body;

      if (!orderData) {
        return res.status(400).json({ error: "Missing order data" });
      }

      const apiKey = PRINTIFY_API_KEY.value();
      if (!apiKey) {
        console.error("❌ Missing Printify API Key.");
        return res.status(500).json({ error: "Server misconfiguration: Missing Printify API Key." });
      }

      // console.log("📢 Creating Printify Order:", orderData);

      // Send order request to Printify API
      const response = await axios.post(
        `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/orders.json`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      // console.log("✅ Printify Order Created:", response.data);

      return res.status(200).json(response.data);
    } catch (error) {
      console.error("❌ Error Creating Printify Order:", error.response ? error.response.data : error.message);
      return res.status(500).json({ error: error.response ? error.response.data : error.message });
    }
  }
);