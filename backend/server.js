const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin'); 
require('dotenv').config();

// Firebase Admin setup (ensure correct env variables)
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

app.use(express.json());
app.use(bodyParser.json());

// Import routes
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/products');
const webhookRoutes = require('./webhooks'); // Optional

// Use routes
app.use('/api', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/webhooks', webhookRoutes); // Optional

// Create Checkout Session Route
app.post('/create-checkout-session', async (req, res) => {
  const { products, userId } = req.body; // Include userId in the request body

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: products.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100, // Stripe requires amount in cents
        },
        quantity: item.quantity,
      })),
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

// Start Server
const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
