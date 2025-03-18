require("dotenv").config();
const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const admin = require("firebase-admin");

// Ensure Firebase is initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // console.log(`📢 Received Stripe event: ${event.type}`);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fetch line items to get product details
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });

      // Extract ordered products (Only using Stripe Product ID)
      const orderedItems = lineItems.data.map((item) => ({
        name: item.price.product.name || "Unknown Product",
        price: item.amount_total / 100, // Convert to dollars
        quantity: item.quantity,
      }));

      // console.log("🛒 Extracted Ordered Items:", orderedItems);

      // Prepare order data
      const orderData = {
        stripeSessionId: session.id,
        userId: session.metadata?.userId || "guest",
        guestToken: session.metadata?.guestToken || null,
        customerName: session.customer_details?.name || "Guest",
        customerEmail: session.customer_details?.email || "No email provided",
        customerPhone: session.customer_details?.phone || "No phone provided",
        customerAddress: session.shipping?.address
          ? `${session.shipping.address.line1}, ${session.shipping.address.city}, ${session.shipping.address.state}, ${session.shipping.address.postal_code}, ${session.shipping.address.country}`
          : "No Shipping Details Provided",
        totalAmount: session.amount_total / 100, // Convert to dollars
        currency: session.currency || "usd",
        paymentMethod: session.payment_method_types[0] || "card",
        status: session.payment_status,
        items: orderedItems,
        stripeSessionId: session.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        shippingDetails: session.shipping ? session.shipping.address : "No Shipping Details Provided",
        relatedProjects: [], // Can be populated if related projects exist
        systemHistory: [
          {
            event: `Project created: ${orderedItems.map(item => item.name).join(", ")}`,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // console.log("📦 Order Data Prepared:", orderData);

      const db = admin.firestore();

      // Save the order in Firestore
      await db.collection("orders").doc(session.id).set(orderData);
      // console.log("✅ Order successfully saved to Firestore with ID:", session.id);

      // **Update Inventory for Each Product**
      const batch = db.batch();
      for (const item of orderedItems) {
        // Fetch product from Firestore using Stripe Product ID
        const productSnapshot = await db.collection("products")
          .where("stripeProductId", "==", item.productId)
          .limit(1)
          .get();

        if (productSnapshot.empty) {
          console.warn(`⚠️ No Firestore product found for Stripe Product ID: ${item.productId}`);
          continue;
        }

        const productDoc = productSnapshot.docs[0];
        const productRef = productDoc.ref;
        const productData = productDoc.data();

        // Update inventory
        const currentStock = productData.currentQuantity || 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        // console.log(`🔄 Updating stock for ${productData.name} (${item.productId}): ${currentStock} -> ${newStock}`);

        batch.update(productRef, { currentQuantity: newStock });
      }

      // Clear the User's Cart if it's not a guest
      if (orderData.userId !== "guest") {
        const cartRef = db.collection("carts").doc(orderData.userId);
        // console.log(`🛒 Clearing cart for user: ${orderData.userId}`);
        batch.delete(cartRef);
      }

      // Commit Firestore batch
      try {
        await batch.commit();
        // console.log("✅ Firestore Batch Commit Successful!");
      } catch (err) {
        console.error("❌ Firestore Batch Commit Failed:", err.message);
      }

    } else {
      // console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("❌ Error processing webhook event:", err.message);
    return res.status(500).send(`Server Error: ${err.message}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;