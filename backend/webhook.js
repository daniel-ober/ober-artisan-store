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

    // console.log(`📩 Received Stripe event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // console.log('✅ Checkout session completed:', session);

      if (!session.metadata || !session.metadata.userId) {
        // console.error('❌ Missing user metadata in session.');
        return res.status(400).send('Missing user metadata.');
      }

      const userId = session.metadata.userId;
      const userEmail = session.customer_email;
      const totalAmount = session.amount_total / 100;

      let lineItems;
      try {
        const lineItemsResponse = await stripe.checkout.sessions.listLineItems(
          session.id,
          { expand: ['data.price.product'] }
        );

        // ✅ Ensure productId is included
        lineItems = lineItemsResponse.data.map((item) => {
          // console.log("🛒 Raw Line Item from Stripe:", item);

          return {
            stripeProductId: item.price.product?.id || null,
            stripePriceId: item.price.id || null,
            name: item.description || null,
            quantity: item.quantity,
            price: item.amount_total / 100,
          };
        });

        // console.log('✅ Processed Line Items:', JSON.stringify(lineItems, null, 2));
      } catch (error) {
        console.error('❌ Error fetching line items:', error.message);
        return res.status(500).send('Error fetching line items.');
      }

      try {
        // console.log('📦 Updating Inventory for Ordered Items...');

        for (const item of lineItems) {
          // console.log(`🔍 Searching for product with stripeProductId: ${item.stripeProductId}`);

          let productSnapshot = await admin
            .firestore()
            .collection('products')
            .where('stripeProductId', '==', item.stripeProductId)
            .limit(1)
            .get();

          // ✅ Fallback: If `stripeProductId` fails, try matching `name.toLowerCase()`
          if (!productSnapshot || productSnapshot.empty) {
            console.error(`❌ No product found for Stripe Product ID: ${item.stripeProductId}`);

            if (item.name) {
              console.warn(`⚠️ Attempting fallback lookup for product name: ${item.name}`);

              const formattedName = item.name.toLowerCase().replace(/\s+/g, ''); // Normalize name
              const fallbackSnapshot = await admin
                .firestore()
                .collection('products')
                .where('name', '>=', formattedName)
                .where('name', '<=', formattedName + '\uf8ff')
                .limit(1)
                .get();

              if (!fallbackSnapshot.empty) {
                // console.log(`✅ Fallback Matched Product: ${formattedName}`);
                productSnapshot = fallbackSnapshot;
              } else {
                console.error(`❌ Fallback failed. Product '${item.name}' not found in Firestore.`);
                continue;
              }
            } else {
              console.error(`❌ Skipping product due to missing name.`);
              continue;
            }
          }

          const productDoc = productSnapshot.docs[0];
          const productRef = productDoc.ref;
          const productData = productDoc.data();

          // console.log(`✅ Matched Product: ${productData.name} (Current Quantity: ${productData.currentQuantity})`);

          // ✅ Update inventory using transaction
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

            // console.log(`🔄 Updating stock for ${productData.id}: ${freshProductData.currentQuantity} -> ${newQuantity}`);

            transaction.update(productRef, {
              currentQuantity: newQuantity,
              isAvailable: newQuantity > 0,
            });

            // console.log(`✅ Inventory Updated for ${productData.name} - New Quantity: ${newQuantity}`);
          });
        }

        // console.log('✅ Inventory Updated Successfully!');

        // ✅ CREATE ORDER IN FIRESTORE
        const orderId = generateCustomId();
        const orderData = {
          orderId,
          userId,
          email: userEmail,
          items: lineItems.map((item) => ({
            ...item,
            productId: item.stripeProductId || item.name?.toLowerCase()?.replace(/\s+/g, ''),
          })), // Ensure productId is added
          totalAmount,
          currency: session.currency,
          status: 'Processing',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          paymentIntentId: session.payment_intent,
        };

        await admin.firestore().collection('orders').doc(orderId).set(orderData);
        // console.log(`✅ Order Created Successfully: ${orderId}`);

        res.status(200).send('✅ Event processed successfully.');
      } catch (error) {
        console.error('❌ Error processing order:', error.message);
        res.status(500).send('Internal Server Error');
      }
    } else {
      // console.log(`⚠️ Unhandled Stripe event type: ${event.type}`);
      res.status(200).send('Event received.');
    }
  }
);

// Function to generate a unique order ID
function generateCustomId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

module.exports = router;