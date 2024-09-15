require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const webhookRoutes = require('./webhooks'); // Import webhook route

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

// Define allowed origins for CORS
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

// Middleware for parsing raw body (for Stripe webhooks)
app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.json());

// Import routes
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/products');

// Use routes
app.use('/api/contact', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/webhooks', webhookRoutes); // Webhook route

// Create Checkout Session Route
app.post('/create-checkout-session', async (req, res) => {
  const { products, userId } = req.body; // Include userId in the request body

  try {
    const lineItems = products.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Ensure this is an integer
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}`, // Include userId in the success URL
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: { userId }, // Store userId in metadata
    });

    res.json({ url: session.url });  // Return the Stripe Checkout URL
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
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET); // Use Webhook Secret
  } catch (err) {
    console.error('⚠️  Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log(`Payment for session ${session.id} succeeded!`);
      // Fulfill the purchase here
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
});

// Start Server
const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
