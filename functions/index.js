const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const express = require('express');
const stripeLib = require('stripe');
const axios = require('axios');
const crypto = require('crypto');

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const CLIENT_URL = defineSecret('CLIENT_URL');
const PRINTIFY_API_KEY = defineSecret('PRINTIFY_API_KEY');
const PRINTIFY_SHOP_ID = defineSecret('PRINTIFY_SHOP_ID');
const PRINTIFY_WEBHOOK_SECRET = defineSecret('PRINTIFY_WEBHOOK_SECRET');

admin.initializeApp();
const db = admin.firestore();

// API App (Stripe)
const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://oberartisandrums.com',
  'https://www.oberartisandrums.com',
  'https://danoberartisandrums.web.app',
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

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

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${clientUrl}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${clientUrl}/cart`,
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

// Stripe Webhook
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
    res.sendStatus(200);
  } else {
    res.sendStatus(200);
  }
});

// 🔍 Printify Webhook Listener
const printifyWebhookApp = express();
printifyWebhookApp.use(express.raw({ type: '*/*' }));

printifyWebhookApp.post('/', async (req, res) => {
  const raw = req.rawBody?.toString('utf8');
  const signatureHeader = req.headers['x-pfy-signature'];
  const secret = PRINTIFY_WEBHOOK_SECRET.value();

  console.log('--- Printify Webhook Incoming ---');
  console.log('🟨 RAW BODY:', raw);
  console.log('🟥 Signature Header:', signatureHeader);
  console.log('🟩 HEADERS:', JSON.stringify(req.headers, null, 2));

  if (!signatureHeader && (!raw || raw.trim() === '' || raw.trim() === '{}')) {
    console.log('✅ Printify validation ping received — responding with secret');
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(secret);
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    console.error('❌ Missing or malformed signature');
    return res.status(400).send('Missing or malformed signature');
  }

  const receivedSignature = signatureHeader.split('=')[1];
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(raw, 'utf8')
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    console.error('❌ Signature mismatch');
    return res.status(401).send('Invalid signature');
  }

  console.log('✅ Signature verified');

  let event;
  try {
    event = JSON.parse(raw);
  } catch (e) {
    console.error('❌ Failed to parse body as JSON:', raw);
    return res.status(400).send('Invalid JSON');
  }

  if (event.topic === 'product.publish' || event.topic === 'product:publish:started') {
    const productId = event.resource?.id || event.data?.id;
    console.log('📌 Handling Printify product publish for ID:', productId);
    if (productId) {
      await handlePrintifyProductPublished(productId);
    } else {
      console.warn('⚠️ No product ID found in event:', JSON.stringify(event));
    }
  } else {
    console.log('📭 Unhandled Printify webhook topic:', event.topic);
  }

  res.status(200).send('Webhook received');
});

const handlePrintifyProductPublished = async (productId) => {
  try {
    const shopId = PRINTIFY_SHOP_ID.value();
    const apiKey = PRINTIFY_API_KEY.value();

    console.log(`🔍 Fetching product from Printify API for ID: ${productId}`);
    const response = await axios.get(
      `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    );

    console.log(`📡 Printify API response status: ${response.status}`);
    const product = response.data;

    if (!product || !product.id) {
      console.error('❌ No product data returned from Printify');
      return;
    }

    const payload = {
      id: product.id,
      title: product.title,
      description: product.description,
      images: product.images,
      tags: product.tags,
      variants: product.variants,
      options: product.options,
      visible: product.visible,
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    console.log('📦 Product payload to be saved:', JSON.stringify(payload, null, 2));

    await db.collection('merchProducts').doc(productId).set(payload);
    console.log(`✅ Product ${productId} synced to Firestore`);

  } catch (error) {
    console.error('❌ Failed to sync Printify product:', error.message);
    console.error('🛠 Error detail:', error.response?.data || error.stack || error);
  }
};

// Final exports
exports.api = onRequest({ region: 'us-central1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLIENT_URL] }, app);
exports.stripeWebhook = onRequest({ region: 'us-central1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], cors: true }, stripeWebhookApp);
exports.printifyWebhookListener = onRequest({
  region: 'us-central1',
  secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID, PRINTIFY_WEBHOOK_SECRET]
}, printifyWebhookApp);