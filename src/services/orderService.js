// src/services/orderService.js
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const router = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to format addresses
const formatAddress = (address) => {
  if (!address) return 'No address provided';
  const { line1, line2, city, state, postal_code, country } = address;
  return `${line1 || ''}${line2 ? `, ${line2}` : ''}, ${city || ''}, ${state || ''} ${postal_code || ''}, ${country || ''}`;
};

// Webhook handler
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`Received Stripe event: ${event.type}`);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Fetch the payment intent for card details
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      const cardDetails = paymentIntent.charges.data[0]?.payment_method_details?.card;

      // Fetch line items to get product details
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });

      // Prepare order data
      const orderData = {
        stripeSessionId: session.id,
        userId: session.metadata?.userId || 'guest',
        guestToken: session.metadata?.guestToken || null,
        customerName: session.customer_details?.name || 'Guest',
        customerEmail: session.customer_details?.email || 'No email provided',
        customerPhone: session.customer_details?.phone || 'No phone provided',
        customerAddress: formatAddress(session.customer_details?.address),
        shippingDetails: formatAddress(session.shipping?.address) || 'No Shipping Details Provided',
        paymentMethod: {
          type: cardDetails?.brand || 'Unknown', // Card type (e.g., Visa)
          lastFour: cardDetails?.last4 || 'N/A', // Last 4 digits
        },
        currency: session.currency,
        totalAmount: session.amount_total / 100, // Convert to dollars
        status: session.payment_status,
        products: lineItems.data.map((item) => ({
          name: item.description || item.price.product.name,
          price: item.price.unit_amount / 100,
          quantity: item.quantity,
        })),
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // Firestore timestamp
      };

      console.log('Order Data Prepared:', orderData);

      // Save the order to Firestore
      await admin.firestore().collection('orders').doc(session.id).set(orderData);
      console.log('Order successfully saved to Firestore with ID:', session.id);
    } else {
      console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('Error processing webhook event:', err.message);
    return res.status(500).send(`Server Error: ${err.message}`);
  }

  res.status(200).json({ received: true });
});

module.exports = router;