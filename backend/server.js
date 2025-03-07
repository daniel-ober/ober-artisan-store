require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Loaded STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY);

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
console.log(`Using Firebase environment: ${env}`);

// Load the correct service account key
let serviceAccount;
try {
  const serviceAccountPath = path.resolve(
    __dirname,
    `./serviceAccountKey-${env}.json`
  );
  console.log(
    `Loading Firebase Service Account Key from: ${serviceAccountPath}`
  );
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
console.log(
  `Firestore initialized for project: ${process.env.FIREBASE_PROJECT_ID}`
);

const app = express();

// Trust Proxy for Firebase Hosting
app.set('trust proxy', true);

// CORS Configuration
const allowedOrigins =
  {
    dev: [
      'http://localhost:3000',
      'http://localhost:4949',
      'https://dev.danoberartisan.com',
    ],
    stg: ['http://localhost:3001', 'https://stg.danoberartisan.com'],
    prod: ['https://danoberartisan.com'],
  }[env] || [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  })
);

// Middleware: Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

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

    console.log(`Received Stripe event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      console.log('Checkout session completed:', session);

      // Fetch line items for the session
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ['data.price.product'],
        }
      );

      const items = lineItems.data.map((item) => ({
        name: item.description, // ❌ Incorrect - Using Stripe's name
        quantity: item.quantity,
        price: item.amount_total / 100, // Convert to dollars
      }));

      // Fetch payment intent to get card details
      let cardDetails = {};
      if (session.payment_intent) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent,
            {
              expand: ['payment_method'], // Expand payment method to get card details
            }
          );

          console.log('Fetched Payment Intent:', paymentIntent);

          if (
            paymentIntent.payment_method &&
            paymentIntent.payment_method.card
          ) {
            const card = paymentIntent.payment_method.card;

            cardDetails = {
              brand: card.brand || 'Unknown',
              lastFour: card.last4 || 'XXXX',
              expMonth: card.exp_month || 'XX',
              expYear: card.exp_year || 'XXXX',
            };
          } else {
            console.error('Card details are missing in payment intent');
          }
        } catch (error) {
          console.error(
            'Error fetching payment intent for card details:',
            error.message
          );
        }
      } else {
        console.error('Payment intent ID is missing in session');
      }

      console.log('Card Details Fetched:', cardDetails);

      // Update product quantities in Firestore
      try {
        for (const item of items) {
          const productSnapshot = await db
            .collection('products')
            .where('name', '==', item.name)
            .limit(1)
            .get();

          if (productSnapshot.empty) {
            console.error(
              `Product "${item.name}" does not exist in Firestore.`
            );
            continue;
          }

          const productDoc = productSnapshot.docs[0];
          const productData = productDoc.data();
          const newQuantity =
            (productData.currentQuantity || 0) - item.quantity;

          if (newQuantity < 0) {
            console.warn(`Insufficient stock for product "${item.name}".`);
          } else {
            await productDoc.ref.update({ currentQuantity: newQuantity });
            console.log(
              `Updated quantity for product "${item.name}" to ${newQuantity}.`
            );
          }
        }
      } catch (error) {
        console.error('Error updating product quantities:', error.message);
      }

      // Prepare order data
      const orderData = {
        stripeSessionId: session.id || null,
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
        paymentMethod: session.payment_method_types?.[0] || 'Unknown',
        cardDetails, // Include card details
        totalAmount: session.amount_total / 100 || 0, // Convert to dollars
        currency: session.currency || 'usd',
        status: 'Order Started', // Set to "Order Started" by default
        items, // Include line items
        createdAt: admin.firestore.FieldValue.serverTimestamp(), // Firestore timestamp
      };

      console.log('Order Data Prepared:', orderData);

      try {
        // Generate custom ID
        const customId = generateCustomId();

        // Save the order to Firestore
        const orderRef = db.collection('orders').doc(customId); // Use custom ID as document ID
        await orderRef.set(orderData);
        console.log('Order successfully saved to Firestore with ID:', customId);

        res.status(200).send('Event processed successfully');
      } catch (error) {
        console.error('Error saving order to Firestore:', error.message);
        res.status(500).send('Internal Server Error');
      }
    } else {
      console.log(`Unhandled event type: ${event.type}`);
      res.status(200).send('Event received');
    }
  }
);

// New Route for creating Stripe payment intents
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;  // Amount in cents
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    // Create payment intent with the specified amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',  // Set the currency to USD
      payment_method_types: ['card'],
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for creating Stripe checkout sessions
app.post('/api/create-checkout-session', async (req, res) => {
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

    if (!products || products.length === 0) {
      return res.status(400).json({ error: 'Invalid products array' });
    }

    const lineItems = products.map((product) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name || 'Unnamed Product',
          description: product.description || 'No description available',
          metadata: { productId: product.id }, // ✅ Ensure productId is included!
        },
        unit_amount: Math.round(product.price * 100),
      },
      quantity: product.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `http://localhost:3000/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      metadata: {
        userId: userId || 'guest',
        guestToken,
        customerFirstName,
        customerLastName,
        customerEmail,
        customerPhone: customerPhone || 'No phone provided',
        shippingAddress: JSON.stringify(shippingAddress || {}),
      },
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      allow_promotion_codes: true,
    });

    res.status(200).json({ url: session.url, id: session.id, guestToken });
  } catch (err) {
    console.error('Error creating Stripe session:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// New Route for Fetching Orders by Stripe Session ID
app.get('/api/orders/by-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const ordersSnapshot = await db
      .collection('orders')
      .where('stripeSessionId', '==', sessionId)
      .limit(1)
      .get();

    if (ordersSnapshot.empty) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderDoc = ordersSnapshot.docs[0];
    return res.status(200).json({ id: orderDoc.id, ...orderDoc.data() });
  } catch (err) {
    console.error('Error fetching order:', err.message);
    res.status(500).json({ error: 'Failed to fetch order' });
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

// Start the server, default to 4949 for local dev, but use PORT for cloud environments like Cloud Run
const PORT = process.env.PORT || 8080; // Make sure this is set to 8080 for Cloud Run
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});