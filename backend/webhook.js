const express = require('express');
const { buffer } = require('micro');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { updateProductInventory } = require('./services/productService');
const { db } = require('./firebaseConfig');
const { doc, setDoc, serverTimestamp } = require('firebase/firestore');

const router = express.Router();

// Middleware for parsing webhook events
router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Webhook Error] Invalid Signature:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Webhook Received] Event Type: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      try {
        console.log('[checkout.session.completed] Session:', session);

        // Retrieve the session to get line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
          expand: ['data.price.product'],
        });

        console.log('[checkout.session.completed] Line Items:', lineItems);

        // Prepare order data
        const orderData = {
          stripeSessionId: session.id,
          guestToken: session.metadata.guestToken || null,
          userId: session.metadata.userId || 'guest',
          customerName: session.customer_details.name,
          customerEmail: session.customer_details.email,
          customerPhone: session.metadata.customerPhone || 'Not provided',
          customerAddress: `${session.customer_details.address.line1}, ${session.customer_details.address.city}, ${session.customer_details.address.state}, ${session.customer_details.address.country}, ${session.customer_details.address.postal_code}`,
          paymentMethod: 'Card',
          cardLastFour: session.payment_method_details?.card?.last4 || 'N/A',
          totalAmount: session.amount_total / 100, // Convert to dollars
          products: [],
          createdAt: serverTimestamp(),
        };

        // Add product details and update inventory
        for (const item of lineItems.data) {
          const productMetadata = item.price.product.metadata || {};
          const productId = productMetadata.firestoreProductId;
          const quantityPurchased = item.quantity;

          if (!productId || !quantityPurchased) {
            console.warn('[checkout.session.completed] Missing product ID or quantity.');
            continue;
          }

          // Fetch the product from Firestore to get current inventory
          const productDoc = doc(db, 'products', productId);
          const productSnapshot = await getDoc(productDoc);

          if (!productSnapshot.exists()) {
            console.warn(`[checkout.session.completed] Product with ID ${productId} not found.`);
            continue;
          }

          const productData = productSnapshot.data();
          const currentQuantity = productData.currentQuantity || 0;
          const newQuantity = Math.max(currentQuantity - quantityPurchased, 0);

          console.log(
            `[checkout.session.completed] Updating Inventory for Product ID ${productId}: Current Quantity: ${currentQuantity}, New Quantity: ${newQuantity}`
          );

          // Update Firestore inventory
          await updateProductInventory(productId, { currentQuantity: newQuantity });

          // Add product to the order's product list
          orderData.products.push({
            name: productData.name,
            quantity: quantityPurchased,
            price: item.price.unit_amount / 100, // Convert to dollars
          });
        }

        // Save the order to Firestore
        console.log('[checkout.session.completed] Saving Order:', orderData);
        const ordersCollection = doc(db, 'orders', session.id); // Use Stripe session ID as the Firestore doc ID
        await setDoc(ordersCollection, orderData);

        console.log('[checkout.session.completed] Order successfully saved to Firestore.');
      } catch (err) {
        console.error(
          `[checkout.session.completed] Error Processing Event: ${err.message}`,
          err.stack
        );
        return res.status(500).send('Webhook Handler Error');
      }

      break;
    }

    case 'payment_intent.succeeded':
      console.log('[payment_intent.succeeded] Payment Intent:', event.data.object);
      break;

    default:
      console.log(`[Webhook] Unhandled Event Type: ${event.type}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;