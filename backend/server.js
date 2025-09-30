// backend/server.js

// Load .env.* locally (Cloud Run/Functions will inject envs)
const path = require('path');
const fs = require('fs');

const envFileFromNodeEnv = (() => {
  const env = (process.env.NODE_ENV || '').trim();
  if (env === 'production' || env === 'prod') return '.env.prod';
  if (env === 'staging' || env === 'stg') return '.env.stg';
  return '.env.dev';
})();

const envPath = path.resolve(__dirname, envFileFromNodeEnv);
if (fs.existsSync(envPath)) {
  // eslint-disable-next-line global-require
  require('dotenv').config({ path: envPath });
  console.log(`Loaded env file: ${envFileFromNodeEnv}`);
}

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const Stripe = require('stripe');

// ---- Validate required env vars ---------------------------------------------
const required = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'CLIENT_URL',
];

const missing = required.filter((k) => !process.env[k] || `${process.env[k]}`.trim() === '');
if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// ---- Stripe init -------------------------------------------------------------
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Keep this aligned with your CLI; if unsure, omit and use account default
  apiVersion: '2024-06-20',
});

// ---- Firebase Admin init -----------------------------------------------------
if (!admin.apps.length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
  });
}
const db = admin.firestore();

// ---- App + CORS --------------------------------------------------------------
const app = express();

// Trust Proxy for hosting behind a proxy (Cloud Run / Functions)
app.set('trust proxy', true);

// Allowed origins for CORS
const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://danoberartisandrums-dev.web.app',
  'https://danoberartisandrums-stg.web.app',
  'https://danoberartisandrums.web.app',
  'https://oberartisandrums.com',
  'https://www.oberartisandrums.com',
  'https://oberdrums.com',
  'https://danoberartisan.com',
  'https://oberartisan.com',
  'https://us-central1-danoberartisandrums.cloudfunctions.net',
]);

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins.has(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
  })
);

// IMPORTANT: do NOT JSON-parse the Stripe webhook body.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') return next();
  return express.json({ limit: '2mb' })(req, res, next);
});

// ---- Healthcheck -------------------------------------------------------------
app.get('/', (_req, res) => res.status(200).send('ok'));

// ---- Helpers ----------------------------------------------------------------
const generateCustomId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
};

// Small safe getter
const centsToDollars = (v) => Math.round(Number(v || 0)) / 100;

// ---- Stripe Webhook (RAW BODY) ----------------------------------------------
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Minimal event logging
  try {
    console.log(`➡️  Received event: ${event.type} (id=${event.id})`);

    if (event.type !== 'checkout.session.completed') {
      // Acknowledge other events so the CLI shows 200s
      return res.status(200).send('Event received (ignored).');
    }

    const session = event.data.object;

    // Defensive: log small, safe summary of the session (no PII dump)
    console.log('🧾 Session summary:', {
      id: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_intent: session.payment_intent || null,
      customer_email: session.customer_details?.email || session.customer_email || null,
      metadata: session.metadata || {},
    });

    // Enriched line items with expanded product (metadata)
    let lineItems;
    try {
      const li = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });
      lineItems = li.data;
      console.log(`🧺 Got ${lineItems.length} line item(s).`);
    } catch (e) {
      console.error('❌ listLineItems failed:', e?.message || e);
      // Keep going with an empty array rather than 500
      lineItems = [];
    }

    const items = lineItems.map((item) => {
      const product = item.price?.product;
      const md = product?.metadata || {};
      // amount_total can be missing on some API versions; fall back safely
      const cents =
        (item.amount_total ?? item.amount_subtotal ?? item.price?.unit_amount ?? 0);

      return {
        name: product?.name || item.description || 'Unnamed Product',
        quantity: item.quantity ?? 1,
        price: Math.round(Number(cents)) / 100,
        variantId: md.variantId || '',
        size: md.size || md.sizeName || '',
        depth: md.depth || '',
        color: md.color || md.colorName || '',
        reRing: md.reRing || '',
        lugQuantity: md.lugQuantity || '',
        staveQuantity: md.staveQuantity || '',
        outerShell: md.outerShell || '',
        innerStave: md.innerStave || '',
        status: 'Order Successful',
      };
    });

    // Card details (brand/last4) — only if a PI exists
    let cardDetails = {};
    if (session.payment_intent) {
      try {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent, {
          expand: ['payment_method'],
        });
        const card = pi.payment_method?.card;
        if (card) {
          cardDetails = {
            brand: card.brand,
            lastFour: card.last4,
            expMonth: card.exp_month,
            expYear: card.exp_year,
          };
        }
      } catch (e) {
        console.warn('⚠️ Could not fetch payment method details:', e?.message || e);
      }
    } else {
      console.log('ℹ️ Session has no payment_intent (fine for some test fixtures).');
    }

    const order = {
      stripeSessionId: session.id,
      userId: session.metadata?.userId || 'guest',
      guestToken: session.metadata?.guestToken || null,
      customerName:
        session.customer_details?.name ||
        `${session.metadata?.customerFirstName || ''} ${session.metadata?.customerLastName || ''}`.trim() ||
        'No Name Provided',
      customerEmail: session.customer_details?.email || session.customer_email || 'No Email Provided',
      customerPhone: session.customer_details?.phone || session.metadata?.customerPhone || 'No Phone Provided',
      customerAddress: session.customer_details?.address
        ? `${session.customer_details.address.line1 || ''}, ${session.customer_details.address.city || ''}, ${session.customer_details.address.postal_code || ''}, ${session.customer_details.address.country || ''}`
        : 'No Address Provided',
      shippingDetails: session.shipping?.address
        ? `${session.shipping.address.line1 || ''}, ${session.shipping.address.city || ''}, ${session.shipping.address.state || ''}, ${session.shipping.address.country || ''}, ${session.shipping.address.postal_code || ''}`
        : 'No Shipping Details Provided',
      paymentMethod: session.payment_method_types?.[0] || 'card',
      cardDetails,
      totalAmount: Math.round(Number(session.amount_total ?? 0)) / 100,
      currency: session.currency || 'usd',
      status: 'order successful',
      items,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      systemHistory: [
        { event: 'Order created from Stripe checkout session', timestamp: new Date().toISOString() },
      ],
    };

    try {
      const id = generateCustomId();
      await db.collection('orders').doc(id).set(order);
      console.log('✅ Order saved to Firestore with ID:', id);
      return res.status(200).send('Event processed successfully');
    } catch (e) {
      console.error('❌ Firestore write failed:', e?.message || e);
      return res.status(500).send('Internal Server Error (Firestore)');
    }
  } catch (err) {
    // Last line of defense: log full error
    console.error('❌ Webhook handler error (top-level):', err?.stack || err);
    return res.status(500).send('Internal Server Error');
  }
});

// ---- Create Payment Intent ---------------------------------------------------
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body || {};
    const cents = Math.round(Number(amount));
    if (!Number.isFinite(cents) || cents <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be > 0' });
    }

    const pi = await stripe.paymentIntents.create({
      amount: cents,
      currency: 'usd',
      payment_method_types: ['card'],
    });

    return res.status(200).json({ clientSecret: pi.client_secret });
  } catch (error) {
    console.error('🔥 Stripe create-payment-intent error:', error?.message || error, error?.stack);
    return res.status(500).json({ error: error.message || 'Stripe error' });
  }
});

// ---- Create Checkout Session -------------------------------------------------
app.post('/api/createCheckoutSession', async (req, res) => {
  try {
    const {
      products = [],
      userId,
      customerFirstName,
      customerLastName,
      customerEmail,
      customerPhone,
      shippingAddress,
    } = req.body || {};

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart.' });
    }

    const guestToken = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    const line_items = products.map((p) => ({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(p.price || 0) * 100),
        product_data: {
          name: p.name || 'Unnamed Product',
          description: p.description || '',
          metadata: {
            productId: p.productId || p.id || '',
            variantId: p.variantId || p?.config?.variantId || '',
            size: p?.config?.size || p?.config?.sizeName || '',
            depth: p?.config?.depth || '',
            color: p?.config?.color || p?.config?.colorName || '',
            reRing: p?.config?.reRing ? 'Yes' : 'No',
            lugQuantity: p?.config?.lugQuantity || '',
            staveQuantity: p?.config?.staveQuantity || '',
            outerShell: p?.config?.outerShell || '',
            innerStave: p?.config?.innerStave || '',
          },
        },
      },
      quantity: Math.max(1, parseInt(p.quantity || 1, 10)),
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items,
      success_url: `${process.env.CLIENT_URL}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      allow_promotion_codes: true,
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      metadata: {
        userId: userId || 'guest',
        guestToken,
        customerFirstName: customerFirstName || '',
        customerLastName: customerLastName || '',
        customerPhone: customerPhone || '',
        shippingAddress: JSON.stringify(shippingAddress || {}),
      },
    });

    return res.status(200).json({ url: session.url, id: session.id, guestToken });
  } catch (err) {
    console.error('❌ Error creating checkout session:', err?.message || err, err?.stack);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// ---- Mount other routes (optional) ------------------------------------------
try {
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
} catch (e) {
  console.warn('Optional route modules not found or failed to load:', e?.message);
}

// ---- Error handler -----------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err?.message || err, err?.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ---- Start server ------------------------------------------------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`api listening on ${PORT}`);
});