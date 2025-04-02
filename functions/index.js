/*******************************************************
 * functions/index.js
 *******************************************************/
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const express = require('express');
const stripeLib = require('stripe');
const axios = require('axios');

// Define Firebase secrets
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const CLIENT_URL = defineSecret('CLIENT_URL');

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Express app for the main API (Stripe, etc.)
const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://oberartisandrums.com',
  'https://danoberartisandrums.web.app',
];
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Stripe checkout session creation endpoint
app.post('/createCheckoutSession', async (req, res) => {
  try {
    const stripe = stripeLib(STRIPE_SECRET_KEY.value());
    const clientUrl = CLIENT_URL.value().trim();
    const { products, userId, customerEmail } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart.' });
    }

    const guestToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const lineItems = products.map(p => ({
      price_data: {
        currency: 'usd',
        product_data: { name: p.name, metadata: { productId: p.id } },
        unit_amount: Math.round(p.price * 100),
      },
      quantity: p.quantity || 1,
    }));

    const successUrl = `${clientUrl}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`;
    const cancelUrl = `${clientUrl}/cart`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      allow_promotion_codes: true,
      metadata: { userId: userId || 'guest', guestToken }
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fetch order details by Stripe session ID
app.get('/orders/by-session/:sessionId', async (req, res) => {
  try {
    const snapshot = await db.collection('orders')
      .where('stripeSessionId', '==', req.params.sessionId)
      .limit(1)
      .get();
    if (snapshot.empty) return res.status(404).json({ error: 'Order not found' });
    res.json(snapshot.docs[0].data());
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: err.message });
  }
});

// Stripe webhook listener to handle events such as checkout.session.completed
const stripeWebhookApp = express();
stripeWebhookApp.use(express.raw({ type: 'application/json' }));

stripeWebhookApp.post('/', async (req, res) => {
  const stripe = stripeLib(STRIPE_SECRET_KEY.value());
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET.value());
  } catch (err) {
    console.error('Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const sessionId = event.data.object.id;

    try {
      // Expand session to get full customer and payment details
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['customer', 'payment_intent.payment_method'],
      });

      const paymentIntent = session.payment_intent;
      const card = paymentIntent?.payment_method?.card || {};

      const customer = session.customer || {};
      const shipping = session.customer_details?.address || {};

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });

      const items = lineItems.data.map(item => ({
        name: item.price.product?.name || item.description,
        quantity: item.quantity,
        price: item.amount_total / 100,
        shippingDetails: 'No Shipping Details Provided',
        status: 'Order Successful'
      }));

      const orderData = {
        stripeSessionId: session.id,
        userId: session.metadata?.userId || 'guest',
        guestToken: session.metadata?.guestToken || null,
        customerName: customer.name || session.customer_details?.name || '',
        customerEmail: customer.email || session.customer_details?.email || '',
        customerPhone: customer.phone || session.customer_details?.phone || '',
        customerAddress: shipping
          ? `${shipping.line1}, ${shipping.city}, ${shipping.postal_code}, ${shipping.country}`
          : '',
        paymentMethod: session.payment_method_types[0],
        cardDetails: {
          brand: card.brand || '',
          lastFour: card.last4 || '',
          expMonth: card.exp_month || null,
          expYear: card.exp_year || null
        },
        items,
        totalAmount: session.amount_total / 100,
        currency: session.currency,
        status: 'Order Successful',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        systemHistory: [{
          event: 'Order created from Stripe checkout session',
          timestamp: new Date().toISOString()
        }]
      };

      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      orderData.orderId = orderId; 
      await db.collection('orders').doc(orderId).set(orderData);
      console.log(`✅ Order created: ${orderId}`);
    } catch (error) {
      console.error('❌ Failed to enrich and save order:', error.message);
      return res.status(500).send('Internal error processing order.');
    }
  }

  res.sendStatus(200);
});

// Printify Webhook Listener
const printifyWebhookApp = express();
printifyWebhookApp.use(express.raw({ type: 'application/json' }));

printifyWebhookApp.post('/printify-webhook', async (req, res) => {
  try {
    console.log('Received Printify webhook:', req.body);  // Log the incoming webhook data for debugging

    // Process Printify event data
    const event = JSON.parse(req.body);
    if (event.type === 'product.created') {
      const product = event.data;
      await handleProductCreated(product); // Save the product to Firestore
    }

    // Respond to Printify
    res.status(200).send('Webhook received successfully');
  } catch (error) {
    console.error('Error processing Printify webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Function to handle product creation event
const handleProductCreated = async (product) => {
  try {
    await db.collection('products').doc(product.id.toString()).set({
      name: product.title,
      description: product.description,
      price: product.price,
      status: product.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Product ${product.title} saved to Firestore.`);
  } catch (error) {
    console.error('Error saving product to Firestore:', error);
  }
};

// Export the functions to Firebase
exports.api = onRequest({ region: 'us-central1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLIENT_URL] }, app);
exports.stripeWebhook = onRequest({ region: 'us-central1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], cors: true }, stripeWebhookApp);
exports.printifyWebhookListener = onRequest({ region: 'us-central1' }, printifyWebhookApp);