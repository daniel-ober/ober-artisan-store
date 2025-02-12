// backend/webhook.js
const express = require('express');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Middleware to handle raw Stripe webhook body
router.post(
  '/api/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`❌ Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📩 Received Stripe event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('✅ Checkout session completed:', session);

      // Fetch line items for the session
      let lineItems;
      try {
        const lineItemsResponse = await stripe.checkout.sessions.listLineItems(
          session.id,
          {
            expand: ['data.price.product'],
          }
        );

        lineItems = lineItemsResponse.data.map((item) => ({
          stripeProductId: item.price.product?.id || null, // ✅ Corrected!
          stripePriceId: item.price.id || null,
          quantity: item.quantity,
          price: item.amount_total / 100,
        }));

        console.log(
          '✅ Processed Line Items:',
          JSON.stringify(lineItems, null, 2)
        );
      } catch (error) {
        console.error('❌ Error fetching line items:', error.message);
        return res.status(500).send('Error fetching line items.');
      }

      try {
        console.log('📦 Updating Inventory for Ordered Items...');

        for (const item of lineItems) {
          console.log(
            `🔍 Searching for Firestore product with stripeProductId: ${item.stripeProductId}`
          );

          console.log(
            `🛠️ Debug: Searching for product with stripeProductId = ${item.stripeProductId}`
          );

          let productSnapshot = await admin
            .firestore()
            .collection('products')
            .where('stripeProductId', '==', item.stripeProductId)
            .limit(1)
            .get();

          console.log(
            `🛠️ Debug: Searching for product with stripeProductId = ${item.stripeProductId}`
          );
          console.log(
            `🛠️ Debug: Found ${productSnapshot.size} products matching stripeProductId = ${item.stripeProductId}`
          );

          if (!productSnapshot || productSnapshot.empty) {
            console.error(
              `❌ No product found for Stripe Product ID: ${item.stripeProductId}. Skipping inventory update.`
            );
            continue;
          }

          const productDoc = productSnapshot.docs[0];
          const productRef = productDoc.ref;
          const productData = productDoc.data();

          console.log(
            `✅ Matched Firestore Product: ${productData.name} (ID: ${productData.id}, Current Quantity: ${productData.currentQuantity})`
          );

          const matchedOptionIndex = (
            productData.pricingOptions || []
          ).findIndex((option) => option.stripePriceId === item.stripePriceId);

          if (matchedOptionIndex === -1) {
            console.warn(
              `⚠️ No matching variant found for stripePriceId: ${item.stripePriceId}`
            );
            console.log(
              `🔄 Defaulting to updating product-level currentQuantity for: ${productData.id}`
            );
          }

          // Update inventory using transaction
          await admin.firestore().runTransaction(async (transaction) => {
            const freshProductDoc = await transaction.get(productRef);
            if (!freshProductDoc.exists) {
              console.error(`❌ Firestore product missing: ${productData.id}`);
              return;
            }

            const freshProductData = freshProductDoc.data();
            const newQuantity = Math.max(
              0,
              (freshProductData.currentQuantity || 0) - item.quantity
            );

            console.log(
              `🔄 Updating stock for ${productData.id}: ${freshProductData.currentQuantity} -> ${newQuantity}`
            );

            // ✅ Always update `currentQuantity`
            transaction.update(productRef, {
              currentQuantity: newQuantity,
              isAvailable: newQuantity > 0,
            });

            console.log(
              `✅ Inventory Updated for ${productData.name} - New Quantity: ${newQuantity}`
            );
          });
        }

        console.log('✅ Inventory Updated Successfully!');
        res.status(200).send('✅ Event processed successfully.');
      } catch (error) {
        console.error('❌ Error processing order:', error.message);
        res.status(500).send('Internal Server Error');
      }
    } else {
      console.log(`⚠️ Unhandled Stripe event type: ${event.type}`);
      res.status(200).send('Event received.');
    }
  }
);

// Function to generate a unique custom ID for orders
function generateCustomId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

module.exports = router;
