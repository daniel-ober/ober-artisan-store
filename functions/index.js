// functions/index.js
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { onSchedule } = require('firebase-functions/v2/scheduler');
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
      price: p.stripePriceId,
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

const printifyWebhookApp = express();
printifyWebhookApp.use(express.raw({ type: '*/*' }));

printifyWebhookApp.post('/', async (req, res) => {
  const raw = req.rawBody?.toString('utf8');
  const signatureHeader = req.headers['x-pfy-signature'];
  const secret = PRINTIFY_WEBHOOK_SECRET.value();

  if (!signatureHeader && (!raw || raw.trim() === '' || raw.trim() === '{}')) {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(secret);
  }

  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
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
    return res.status(401).send('Invalid signature');
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch (e) {
    return res.status(400).send('Invalid JSON');
  }

  if (event.topic === 'product.publish' || event.topic === 'product:publish:started') {
    const productId = event.resource?.id || event.data?.id;
    if (productId) {
      await handlePrintifyProductPublished(productId);
    }
  }

  res.status(200).send('Webhook received');
});

const handlePrintifyProductPublished = async (productId) => {
  try {
    const shopId = PRINTIFY_SHOP_ID.value();
    const apiKey = PRINTIFY_API_KEY.value();
    const stripe = stripeLib(STRIPE_SECRET_KEY.value());

    const response = await axios.get(`https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });

    const product = response.data;
    if (!product || !product.id) return;

    const variantMetaRes = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${product.blueprint_id}/print_providers/${product.print_provider_id}/variants.json`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    const variantMeta = variantMetaRes.data;
    const enrichedVariants = product.variants.map((variant) => {
      const matchingMeta = Array.isArray(variantMeta)
        ? variantMeta.find((meta) => meta.id === variant.id)
        : null;
    
      // Find all images where variant_ids includes this variant.id
      const variantImages = (product.images || []).filter((img) =>
        Array.isArray(img.variant_ids) && img.variant_ids.includes(variant.id)
      );
    
      return {
        ...variant,
        images: variantImages.map((img) => ({ src: img.src, position: img.position })),
        ...(matchingMeta?.options?.reduce((acc, opt) => {
          acc[opt.name.toLowerCase()] = opt.value;
          return acc;
        }, {}) || {})
      };
    });

    const filteredVariants = enrichedVariants.filter(v => v.is_enabled);

    const enrichedOptions = (product.options || []).map((opt) => {
      const enrichedValues = opt.values.map((val) => {
        const usedColors = new Set();
        for (const variant of filteredVariants) {
          if (variant.options?.includes(val.id) && variant.color) {
            usedColors.add(variant.color);
          }
        }
        return {
          ...val,
          colors: [...usedColors]
        };
      });
      return { ...opt, values: enrichedValues };
    });

    const stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description || '',
      images: product.images?.[0]?.src ? [product.images[0].src] : [],
      metadata: { printifyProductId: product.id }
    });

    const stripePriceIds = {};
    for (const variant of filteredVariants) {
      const price = await stripe.prices.create({
        unit_amount: Math.round(variant.price),
        currency: 'usd',
        product: stripeProduct.id,
        metadata: {
          variantId: variant.id.toString(),
          title: variant.title,
          sku: variant.sku
        }
      });
      stripePriceIds[variant.id] = {
        priceId: price.id,
        unitAmount: price.unit_amount
      };
    }

    const payload = {
      id: product.id,
      title: product.title,
      description: product.description || '',
      images: product.images,
      tags: product.tags,
      variants: filteredVariants,
      options: enrichedOptions,
      visible: product.visible,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeProductId: stripeProduct.id,
      stripePriceIds,
      status: 'inactive'
    };

    await db.collection('merchProducts').doc(productId).set(payload);
    console.log(`✅ Created merchProduct: ${productId}`);
  } catch (error) {
    console.error('❌ Failed to sync Printify product:', error.message);
    console.error('🛠 Error detail:', error.response?.data || error.stack || error);
  }
};

exports.refreshPrintifyStock = onSchedule({
  schedule: '0 * * * *',
  timeZone: 'America/Chicago',
  secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID]
}, async () => {
  const shopId = PRINTIFY_SHOP_ID.value();
  const apiKey = PRINTIFY_API_KEY.value();

  const merchSnapshot = await db.collection('merchProducts').get();

  for (const doc of merchSnapshot.docs) {
    const productId = doc.id;
    try {
      const response = await axios.get(`https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      const printifyProduct = response.data;
      const variants = printifyProduct.variants
        .filter(v => v.is_enabled)
        .map((v) => {
          const normalizedOptions = {};
          if (Array.isArray(v.options)) {
            for (const opt of productDoc.options || []) {
              const valMatch = opt.values.find(val => v.options.includes(val.id));
              if (valMatch) {
                normalizedOptions[opt.title] = valMatch.title;
              }
            }
          }
          return {
            id: v.id,
            is_enabled: v.is_enabled,
            is_available: v.is_available,
            options: v.options,
            normalizedOptions,
          };
        });

        const productDoc = doc.data();
        const enrichedOptions = (productDoc.options || []).map((opt) => {
          const enrichedValues = opt.values.map((val) => {
            const matchingOriginal = opt.values.find(v => v.id === val.id);
            const originalColors = matchingOriginal?.colors || [];
            return {
              ...val,
              colors: Array.isArray(originalColors) ? originalColors : [],
            };
          });
          return { ...opt, values: enrichedValues };
        });
        
        await doc.ref.update({
          variants,
          options: enrichedOptions,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
      console.error(`❌ Failed to update ${productId}:`, err.message);
    }
  }
});

exports.api = onRequest({
  region: 'us-central1',
  secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLIENT_URL]
}, app);

exports.stripeWebhook = onRequest({
  region: 'us-central1',
  secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
  cors: true
}, stripeWebhookApp);

exports.printifyWebhookListener = onRequest({
  region: 'us-central1',
  secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID, PRINTIFY_WEBHOOK_SECRET, STRIPE_SECRET_KEY]
}, printifyWebhookApp);

exports.refreshPrintifyStockNow = onRequest({
  region: 'us-central1',
  secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID]
}, async (req, res) => {
  try {
    await exports.refreshPrintifyStock.run();
    res.status(200).send('✅ Manual refreshPrintifyStock executed successfully.');
  } catch (error) {
    console.error('❌ Manual refresh failed:', error);
    res.status(500).send('❌ Manual refresh failed.');
  }
});