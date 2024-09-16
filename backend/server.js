// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const webhookRoutes = require('./webhooks');

// Firebase Admin setup
admin.initializeApp({
  credential: admin.credential.cert({
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
  }),
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
});

const db = admin.firestore();
const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
];

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.json());

// Import routes
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/products');

app.use('/api/contact', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/webhooks', webhookRoutes);

// Create Checkout Session Route
app.post('/create-checkout-session', async (req, res) => {
  const { products, userId } = req.body;

  try {
    console.log('Received products:', products); // Log products

    // Map through the products array and ensure that price_id is correctly used
    const lineItems = products.map(item => {
      if (!item.price || !item.name) {
        throw new Error(`Missing price or name for product: ${JSON.stringify(item)}`);
      }

      return {
        price: item.price, // Use the price ID from Stripe
        quantity: item.quantity,
      };
    });

    // Create a Checkout Session with Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: { userId },
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Webhook Endpoint for Stripe
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`Payment for session ${session.id} succeeded!`);
      // Fulfill the purchase here
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

app.get('/api/firestore-doc', async (req, res) => {
  try {
    const docRef = db.collection('products').doc('y0Z3azz4Dxzv7H3uyOMT');
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).send('Document not found');
    }
    res.json(doc.data());
  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
