const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

const PRINTIFY_SHOP_ID = "20308920";
const PRINTIFY_API_KEY = defineSecret("PRINTIFY_API_KEY");
const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");

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

      const apiKey = STRIPE_SECRET_KEY.value();
      if (!apiKey) {
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
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const stripeProduct = stripeResponse.data;
      // console.log("✅ Created Stripe Product:", stripeProduct);

      // Create price in Stripe (assuming only one price for now)
      const stripePriceResponse = await axios.post(
        "https://api.stripe.com/v1/prices",
        new URLSearchParams({
          unit_amount: (product.variants[0].price * 100).toString(), // Stripe uses cents
          currency: "usd",
          product: stripeProduct.id,
        }),
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
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