require('dotenv').config({ path: __dirname + '/.env.prod' });

// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log(
//   'Loaded STRIPE_SECRET_KEY:',
//   process.env.STRIPE_SECRET_KEY ? '✅ Exists' : '❌ Missing'
// );

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const path = require('path');

// Validate critical environment variables
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'FIREBASE_PROJECT_ID',
  'CLIENT_URL',
];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

// Determine the environment (dev, stg, prod)
const env = process.env.NODE_ENV || 'dev';
// console.log(`Using Firebase environment: ${env}`);

// Load the correct service account key
let serviceAccount;
try {
  const serviceAccountPath = path.resolve(
    __dirname,
    `./serviceAccountKey-${env}.json`
  );
  // console.log(
  //   `Loading Firebase Service Account Key from: ${serviceAccountPath}`
  // );
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error(`Failed to load service account key for environment: ${env}`);
  process.exit(1);
}

// Firebase Admin Initialization
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}

const db = admin.firestore();
// console.log(
//   `Firestore initialized for project: ${process.env.FIREBASE_PROJECT_ID}`
// );

const app = express();

// Trust Proxy for Firebase Hosting
app.set('trust proxy', true);

// Allow requests from frontend environments
const allowedOrigins = [
  'http://localhost:3000',
  'https://danoberartisandrums-dev.web.app',
  'https://danoberartisandrums-stg.web.app',
  'https://danoberartisandrums.web.app',
  'https://oberartisandrums.com',
  'https://oberdrums.com',
  'https://danoberartisan.com',
  'https://oberartisan.com',
  'https://us-central1-danoberartisandrums.cloudfunctions.net',
  'https://us-central1-danoberartisandrums.cloudfunctions.net/',
  'https://us-central1-danoberartisandrums.cloudfunctions.net/createCheckoutSession',
  'https://us-central1-danoberartisandrums.cloudfunctions.net/createCheckoutSession/',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Allows cookies and authentication headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware: JSON Parsing
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook')
    next(); // Skip JSON parsing for webhook
  else express.json({ limit: '1mb' })(req, res, next);
});

// Function to generate a custom ID
const generateCustomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    // Length of the ID
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Webhook Route for Stripe
// Webhook Route for Stripe
app.post(
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
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Process only the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
    
      // ✅ Retrieve enriched line items (with expanded product metadata)
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });
    
      const items = lineItems.data.map((item) => {
        const metadata = item.price?.product?.metadata || {};
    
        return {
          name: item.price?.product?.name || item.description || 'Unnamed Product',
          quantity: item.quantity,
          price: item.amount_total / 100,
          variantId: metadata.variantId || '',
          size: metadata.size || '',
          depth: metadata.depth || '',
          color: metadata.color || '',
          reRing: metadata.reRing || '',
          lugQuantity: metadata.lugQuantity || '',
          staveQuantity: metadata.staveQuantity || '',
          outerShell: metadata.outerShell || '',
          innerStave: metadata.innerStave || '',
          status: 'Order Successful',
        };
      });
    
      // ✅ Retrieve card details from payment intent
      let cardDetails = {};
      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent,
            { expand: ['payment_method'] }
          );
          const card = paymentIntent.payment_method?.card;
          if (card) {
            cardDetails = {
              brand: card.brand,
              lastFour: card.last4,
              expMonth: card.exp_month,
              expYear: card.exp_year,
            };
          }
        } catch (error) {
          console.error('❌ Error fetching payment intent card details:', error.message);
        }
      }
    
      // ✅ Final order data
      const orderData = {
        stripeSessionId: session.id,
        userId: session.metadata?.userId || 'guest',
        guestToken: session.metadata?.guestToken || null,
        customerName: session.customer_details?.name || 'No Name Provided',
        customerEmail: session.customer_details?.email || 'No Email Provided',
        customerPhone: session.customer_details?.phone || 'No Phone Provided',
        customerAddress: session.customer_details?.address
          ? `${session.customer_details.address.line1 || ''}, ${session.customer_details.address.city || ''}, ${session.customer_details.address.postal_code || ''}, ${session.customer_details.address.country || ''}`
          : 'No Address Provided',
        shippingDetails: session.shipping?.address
          ? `${session.shipping.address.line1 || ''}, ${session.shipping.address.city || ''}, ${session.shipping.address.state || ''}, ${session.shipping.address.country || ''}, ${session.shipping.address.postal_code || ''}`
          : 'No Shipping Details Provided',
        paymentMethod: session.payment_method_types?.[0] || 'card',
        cardDetails,
        totalAmount: session.amount_total / 100 || 0,
        currency: session.currency || 'usd',
        status: 'Order Started',
        items,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        systemHistory: [
          {
            event: `Order created from Stripe checkout session`,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    
      try {
        const customId = generateCustomId();
        await db.collection('orders').doc(customId).set(orderData);
        console.log('✅ Order saved to Firestore with ID:', customId);
        res.status(200).send('Event processed successfully');
      } catch (error) {
        console.error('❌ Error saving order to Firestore:', error.message);
        res.status(500).send('Internal Server Error');
      }
    } else {
      // For unhandled event types, simply acknowledge receipt.
      res.status(200).send('Event received');
    }
  }
);

// New Route for creating Stripe payment intents
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      console.error('🚨 Error: Amount is missing from request!');
      return res.status(400).json({ error: 'Amount is required' });
    }

    console.log('🟢 Creating payment intent for amount:', amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    console.log('✅ Payment intent created successfully:', paymentIntent.id);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('🔥 Stripe API Error:', error); // Log full error details
    res.status(500).json({ error: error.message });
  }
});

// Route for creating Stripe checkout sessions
app.post('/api/createCheckoutSession', async (req, res) => {
  try {
    const {
      products,
      userId,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      shippingAddress,
    } = req.body;

    const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart.' });
    }

    const lineItems = products.map((product) => ({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: product.name || 'Unnamed Product',
          description: product.description || '',
          metadata: {
            productId: product.productId || product.id || '',
            variantId: product.variantId || '',
            size: product.config?.size || '',
            depth: product.config?.depth || '',
            color: product.config?.color || '',
            reRing: product.config?.reRing ? 'Yes' : 'No',
            lugQuantity: product.config?.lugQuantity || '',
            staveQuantity: product.config?.staveQuantity || '',
            outerShell: product.config?.outerShell || '',
            innerStave: product.config?.innerStave || '',
          },
        },
      },
      quantity: product.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${process.env.CLIENT_URL}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      allow_promotion_codes: true,
      metadata: {
        userId: userId || 'guest',
        guestToken,
        customerFirstName,
        customerLastName,
        customerPhone: customerPhone || '',
        shippingAddress: JSON.stringify(shippingAddress || {}),
      },
    });

    res.status(200).json({ url: session.url, id: session.id, guestToken });
  } catch (err) {
    console.error('❌ Error creating checkout session:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Import and mount routes
const chatRoute = require('../functions/src/routes/chat');
const inquiriesRoute = require('../functions/src/routes/inquiries');
const productsRoute = require('../functions/src/routes/products');
const ordersRoute = require('../functions/src/routes/orders');
const usersRoute = require('../functions/src/routes/users');
const cartsRoute = require('../functions/src/routes/carts');

app.use('/api/chat', chatRoute);
app.use('/api/inquiries', inquiriesRoute);
app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/users', usersRoute);
app.use('/api/carts', cartsRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server, default to port for local dev, but use PORT for cloud environments like Cloud Run
const PORT = process.env.PORT || 8080; // Make sure this is set to 8080 for Cloud Run
app.listen(PORT, () => {
  // console.log(`Server is running on port ${PORT}`);
});
