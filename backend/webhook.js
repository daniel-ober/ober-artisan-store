const express = require('express');
const { buffer } = require('micro');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { updateProductInventory } = require('./services/productService');
const { db } = require('./firebaseConfig');
const { doc, setDoc, serverTimestamp, getDoc } = require('firebase/firestore');

const router = express.Router();

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      console.log('[checkout.session.completed] Session:', session);

      // Retrieve the session to get line items
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });

      console.log('[checkout.session.completed] Line Items:', lineItems);

      // Retrieve payment intent for card details
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      const paymentDetails = paymentIntent.charges.data[0]?.payment_method_details?.card;

      console.log('[checkout.session.completed] Payment Details:', paymentDetails);

      // Prepare order data
      const orderData = {
        stripeSessionId: session.id,
        guestToken: session.metadata.guestToken || null,
        userId: session.metadata.userId || 'guest',
        customerName: session.customer_details.name || 'No Name Provided',
        customerEmail: session.customer_details.email || 'No Email Provided',
        customerPhone: session.metadata.customerPhone || 'No Phone Provided',
        customerAddress: `${session.customer_details.address.line1}, ${session.customer_details.address.city}, ${session.customer_details.address.state}, ${session.customer_details.address.country}, ${session.customer_details.address.postal_code}`,
        paymentMethod: {
          type: paymentDetails?.brand || 'Unknown', // Card type
          lastFour: paymentDetails?.last4 || 'N/A', // Last 4 digits
        },
        totalAmount: session.amount_total / 100, // Convert to dollars
        currency: session.currency,
        products: [],
        createdAt: serverTimestamp(),
      };

      // Add product details
      for (const item of lineItems.data) {
        const productMetadata = item.price.product.metadata || {};
        const productId = productMetadata.firestoreProductId;
        const quantityPurchased = item.quantity;

        if (!productId || !quantityPurchased) {
          console.warn('[checkout.session.completed] Missing product ID or quantity.');
          continue;
        }

        // Fetch the product from Firestore
        const productDoc = doc(db, 'products', productId);
        const productSnapshot = await getDoc(productDoc);

        if (!productSnapshot.exists()) {
          console.warn(`[checkout.session.completed] Product with ID ${productId} not found.`);
          continue;
        }

        const productData = productSnapshot.data();

        // Add product to the order's product list
        orderData.products.push({
          productId,
          name: productData.name,
          description: productData.description || 'No description available',
          quantity: quantityPurchased,
          unitPrice: item.price.unit_amount / 100, // Convert to dollars
          totalPrice: (item.price.unit_amount * quantityPurchased) / 100,
        });

        console.log('[checkout.session.completed] Product Added to Order:', {
          productId,
          name: productData.name,
          quantity: quantityPurchased,
        });
      }

      // Log the final orderData for debugging
      console.log('[checkout.session.completed] Final Order Data:', JSON.stringify(orderData, null, 2));

      // Save the order to Firestore
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
  }

  res.status(200).json({ received: true });
});

module.exports = router;