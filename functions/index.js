const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const express = require('express');
const stripeLib = require('stripe');
const axios = require('axios');
const crypto = require('crypto');
const functions = require('firebase-functions/v2');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const sgMail = require('@sendgrid/mail');

const SENDGRID_API_KEY = defineSecret('SENDGRID_API_KEY');

const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const CLIENT_URL = defineSecret('CLIENT_URL');
const PRINTIFY_API_KEY = defineSecret('PRINTIFY_API_KEY');
const PRINTIFY_SHOP_ID = defineSecret('PRINTIFY_SHOP_ID');
const PRINTIFY_WEBHOOK_SECRET = defineSecret('PRINTIFY_WEBHOOK_SECRET');
const RECAPTCHA_SECRET_KEY = defineSecret('RECAPTCHA_SECRET_KEY');

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
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

app.post('/createCheckoutSession', async (req, res) => {
  try {
    const stripe = stripeLib(STRIPE_SECRET_KEY.value());
    const clientUrl = CLIENT_URL.value().trim();

    const {
      products,
      userId,
      customerEmail,
      customerPhone,
      firstName,
      lastName,
      promoCode,
      shippingAddress,
      billingAddress,
    } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart.' });
    }

    // 🔐 Stable token to join Stripe session ↔ our cart snapshot later
    const guestToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // 📝 Save the entire cart snapshot BEFORE creating Stripe session
    await db
      .collection('pending_checkouts')
      .doc(guestToken)
      .set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        products, // <-- full snapshot with variant info
        userId: userId || 'guest',
      });

    // 🧾 Build Stripe line items
    // 🧾 Build Stripe line items
    // --- REPLACE the whole "build Stripe line items" loop ---
// --- inside app.post('/createCheckoutSession' ... ) ---
// Build Stripe line items
const lineItems = [];

for (const p of products) {
  const isMerch = p.category === 'merch';
  const cfg = p.config || {};

  if (isMerch) {
    // normalize values from whatever keys your cart uses
    const color = (cfg.colorName || cfg.color || cfg.Colors || '').toString().trim();
    const size  = (cfg.sizeName  || cfg.size  || cfg.Sizes  || '').toString().trim();
    const vId   = (cfg.variantId || '').toString().trim();

    const parts = [];
    if (color) parts.push(`Color: ${color}`);
    if (size)  parts.push(`Size: ${size}`);
    const variantSummary = parts.length ? parts.join(' • ') : 'Options: Standard';

    const images =
      typeof p.image === 'string' && p.image.startsWith('http') ? [p.image] : [];

    // ✅ Use price_data so we can control the description text
    // ✅ Put all variant info in product_data.metadata so the webhook can read it back
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(p.price || 0) * 100),
        product_data: {
          name: p.name || 'Ober Merch',
          images,
          description: variantSummary, // shows on Stripe Checkout UI
          metadata: {
            category: 'merch',
            productId: String(p.productId || ''),
            variantId: vId,
            sizeName: size,
            colorName: color
          }
        }
      },
      quantity: p.quantity || 1
    });
  } else {
    // (leave your artisan branch as-is)
    const images =
      typeof p.image === 'string' && p.image.startsWith('http') ? [p.image] : [];

    const cfgA = p.config || {};
    const descParts = [
      cfgA.size ? `Size: ${cfgA.size}"` : '',
      cfgA.depth ? `Depth: ${cfgA.depth}"` : '',
      cfgA.lugQuantity ? `${cfgA.lugQuantity} Lugs` : '',
      cfgA.staveQuantity ? `${cfgA.staveQuantity} Staves` : '',
      typeof cfgA.reRing !== 'undefined' ? (cfgA.reRing ? 'Re-Rings' : 'No Re-Rings') : '',
      cfgA.hardwareColor ? `Hardware: ${cfgA.hardwareColor}` : ''
    ].filter(Boolean);

    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(Number(p.price || 0) * 100),
        product_data: {
          name: p.name || 'Ober Artisan Product',
          images,
          ...(descParts.length ? { description: descParts.join(' • ') } : {})
        }
      },
      quantity: p.quantity || 1
    });
  }
}
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: `${clientUrl}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${clientUrl}/cart`,
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      allow_promotion_codes: true,
      metadata: {
        userId: userId || 'guest',
        guestToken,
        customerPhone: customerPhone || '',
        customerName: `${firstName || ''} ${lastName || ''}`.trim(),
        promoCode: promoCode || '',
        shipTo: shippingAddress?.line1 || '',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Error creating checkout session:', err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Add reCAPTCHA verification endpoint HERE
app.post('/verifyRecaptcha', async (req, res) => {
  const token = req.body.token;
  const email = req.body.email || 'unknown';

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing token' });
  }

  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: RECAPTCHA_SECRET_KEY.value(),
          response: token,
        },
      }
    );

    const { success, score } = response.data;

    if (!success || score < 0.5) {
      // 🚨 Log risky attempt to Firestore
      await admin.firestore().collection('risk_notifications').add({
        type: 'login',
        source: 'admin-signin',
        email,
        score,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return res.status(403).json({ success: false, score });
    }

    return res.status(200).json({ success: true, score });
  } catch (err) {
    console.error('❌ reCAPTCHA verification failed:', err.message);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/orders/by-session/:sessionId', async (req, res) => {
  try {
    const snapshot = await db
      .collection('orders')
      .where('stripeSessionId', '==', req.params.sessionId)
      .limit(1)
      .get();
    if (snapshot.empty)
      return res.status(404).json({ error: 'Order not found' });
    res.json(snapshot.docs[0].data());
  } catch (err) {
    console.error('❌ Error fetching order:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const stripeWebhookApp = express();
stripeWebhookApp.use(express.raw({ type: 'application/json' }));

// Helper: parse something like "Black / L" → { color: "Black", size: "L" }
function parseTitleColorSize(title) {
  if (!title || typeof title !== 'string') return { color: '', size: '' };
  const parts = title
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 2) return { color: parts[0], size: parts[1] };
  // Sometimes Printify flips or includes extra text; be forgiving
  if (parts.length > 2)
    return { color: parts[0], size: parts[parts.length - 1] };
  return { color: '', size: '' };
}

stripeWebhookApp.post('/', async (req, res) => {
  const stripe = stripeLib(STRIPE_SECRET_KEY.value());
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      req.headers['stripe-signature'],
      STRIPE_WEBHOOK_SECRET.value()
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  let session = event.data.object;

  // Expand payment intent/payment method when present (unchanged)
  if (session.payment_intent) {
    session = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['payment_intent.payment_method'],
    });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      // 👉 Expand price.product so we at least have product info;
      // we will still fetch the Price directly to get metadata.
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ['data.price.product'],
        }
      );

      // Defensive check (unchanged)
      if (
        !session.customer_details?.email ||
        !session.customer_details?.name ||
        !session.shipping_details?.address ||
        lineItems.data.length === 0
      ) {
        console.warn(
          '⚠️ Skipping incomplete order creation. Missing important customer info.'
        );
        return res
          .status(200)
          .send('Skipped: Incomplete session, no order created.');
      }

      // 🔎 Pull our pre-checkout snapshot by guestToken
      const guestToken = session.metadata?.guestToken || '';
      let snapshotProducts = [];
      if (guestToken) {
        try {
          const snapDoc = await db
            .collection('pending_checkouts')
            .doc(guestToken)
            .get();
          if (snapDoc.exists) {
            const snap = snapDoc.data();
            if (Array.isArray(snap?.products)) snapshotProducts = snap.products;
          } else {
            console.warn(
              '⚠️ No pending_checkouts snapshot for guestToken:',
              guestToken
            );
          }
        } catch (e) {
          console.warn('⚠️ Failed to read pending_checkouts:', e.message);
        }
      } else {
        console.warn('⚠️ Session missing guestToken metadata.');
      }

      // 🧩 Build final items array
  // --- inside stripeWebhookApp.post('/', ... ) after you fetched lineItems ---
const items = [];
for (const li of lineItems.data) {
  const priceId     = li.price?.id || '';
  const unitAmount  = li.price?.unit_amount ?? null;
  const productObj  = li.price?.product || {};
  const pMeta       = productObj?.metadata || {};        // 👈 our metadata from product_data.metadata
  const pDesc       = productObj?.description || '';     // "Color: X • Size: Y" we set earlier
  const pImages     = Array.isArray(productObj?.images) ? productObj.images : [];

  // Try to match to snapshot (still useful for artisan etc.)
  let matched =
    (Array.isArray(snapshotProducts) ? snapshotProducts : []).find(
      (p) => p.stripePriceId && p.stripePriceId === priceId
    ) ||
    (Array.isArray(snapshotProducts) ? snapshotProducts : []).find(
      (p) => !p.stripePriceId && Math.round(Number(p.price || 0) * 100) === unitAmount
    );

  // Price metadata fallback (for legacy Stripe saved prices)
  let stripePriceMeta = { variantId: '', title: '', sku: '' };
  try {
    if (priceId) {
      const priceObj = await stripe.prices.retrieve(priceId);
      const md = priceObj?.metadata || {};
      stripePriceMeta.variantId = md.variantId || '';
      stripePriceMeta.title     = md.title || '';
      stripePriceMeta.sku       = md.sku || '';
    }
  } catch (e) {
    console.warn('⚠️ Could not retrieve Stripe Price metadata for', priceId, e.message);
  }

  // Build variant (prefer metadata we set during session creation)
  let variant = {
    variantId: pMeta.variantId || '',
    size:      pMeta.sizeName  || '',
    color:     pMeta.colorName || '',
    sku:       stripePriceMeta.sku   || '',
    title:     stripePriceMeta.title || ''
  };

  // If we matched snapshot and it’s merch, prefer the snapshot’s friendly names
  if (matched?.category === 'merch') {
    const cfg = matched.config || {};
    variant.variantId = variant.variantId || (cfg.variantId ? String(cfg.variantId) : '');
    variant.size      = variant.size      || (cfg.sizeName || cfg.size || cfg.Sizes || '');
    variant.color     = variant.color     || (cfg.colorName || cfg.color || cfg.Colors || '');
  } else if (matched) {
    // artisan path
    const cfg = matched.config || {};
    variant = {
      ...variant,
      size:         variant.size || (cfg.size || ''),
      color:        variant.color || (cfg.hardwareColor || ''),
      lugQuantity:  cfg.lugQuantity || '',
      staveQuantity:cfg.staveQuantity || '',
      depth:        cfg.depth || '',
      reRing:       typeof cfg.reRing !== 'undefined' ? (cfg.reRing ? 'Yes' : 'No') : ''
    };
  }

  // Backfill from "Color: X • Size: Y" description if still missing
  if ((!variant.color || !variant.size) && pDesc) {
    const parts = pDesc.split('•').map(s => s.trim());
    for (const part of parts) {
      if (part.toLowerCase().startsWith('color:')) variant.color = variant.color || part.split(':')[1].trim();
      if (part.toLowerCase().startsWith('size:'))  variant.size  = variant.size  || part.split(':')[1].trim();
    }
  }

  // As a last fallback, try the saved Price metadata title ("Black / L")
  if ((!variant.color || !variant.size) && stripePriceMeta.title) {
    const t = stripePriceMeta.title.split('/').map(s => s.trim());
    if (!variant.color && t[0]) variant.color = t[0];
    if (!variant.size  && t[t.length - 1]) variant.size = t[t.length - 1];
  }

  // Final fields (prefer snapshot, then product metadata)
  const finalCategory = matched?.category || pMeta.category || '';
  const finalProductId = matched?.productId || pMeta.productId || '';
  const finalName = matched?.name || productObj?.name || li.description || 'Ober Product';
  const finalImage = matched?.image || (pImages[0] || '');

  items.push({
    priceId,
    description: li.description, // Stripe’s own line description (usually the product name)
    quantity: li.quantity,
    price: (li.amount_total || 0) / 100,
    name: finalName,
    category: finalCategory,
    productId: finalProductId,
    image: finalImage,
    variant
  });
}

      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const orderDoc = {
        stripeSessionId: session.id,
        customerEmail: session.customer_details.email,
        customerPhone: session.metadata?.customerPhone || '',
        customerName: session.customer_details.name,
        customerAddress: `${session.shipping_details.address.line1}, ${session.shipping_details.address.city}, ${session.shipping_details.address.state} ${session.shipping_details.address.postal_code}, ${session.shipping_details.address.country}`,
        amountTotal: session.amount_total || 0,
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency || 'usd',
        paymentMethod: '',
        cardDetails: { brand: '', lastFour: '' },
        status: 'order successful',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: session.metadata?.userId || 'guest',
        guestToken: session.metadata?.guestToken || '',
        items,
        orderId,
        promoCode: session.total_details?.amount_discount
          ? session.discounts?.[0]?.promotion_code || ''
          : '',
      };

      await db.collection('orders').doc(orderId).set(orderDoc);

      // Clean up snapshot (best effort)
      if (session.metadata?.guestToken) {
        db.collection('pending_checkouts')
          .doc(session.metadata.guestToken)
          .delete()
          .catch(() => {});
      }

      return res.status(200).send('Order created');
    }

    if (
      event.type === 'checkout.session.expired' ||
      event.type === 'checkout.session.async_payment_failed'
    ) {
      console.warn('⚠️ Stripe session failed or expired, no order created.');
      return res.status(200).send('Skipped: Session failed or expired.');
    }

    res.status(200).send('Unhandled event received');
  } catch (err) {
    console.error('❌ Failed processing event:', err);
    return res.status(500).send('Internal Server Error');
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

  if (
    event.topic === 'product.publish' ||
    event.topic === 'product:publish:started'
  ) {
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

    const response = await axios.get(
      `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

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

      const variantImages = (product.images || []).filter(
        (img) =>
          Array.isArray(img.variant_ids) && img.variant_ids.includes(variant.id)
      );

      return {
        ...variant,
        images: variantImages.map((img) => ({
          src: img.src,
          position: img.position,
          displayInGallery: true,
        })),
        ...(matchingMeta?.options?.reduce((acc, opt) => {
          acc[opt.name.toLowerCase()] = opt.value;
          return acc;
        }, {}) || {}),
      };
    });

    const filteredVariants = enrichedVariants.filter((v) => v.is_enabled);

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
          colors: [...usedColors],
        };
      });
      return { ...opt, values: enrichedValues };
    });

    const stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description || '',
      images: product.images?.[0]?.src ? [product.images[0].src] : [],
      metadata: { printifyProductId: product.id },
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
          sku: variant.sku,
        },
      });
      stripePriceIds[variant.id] = {
        priceId: price.id,
        unitAmount: price.unit_amount,
      };
    }

    const payload = {
      id: product.id,
      title: product.title,
      description: product.description || '',
      images:
        product.images?.map((img) => ({
          ...img,
          displayInGallery: true,
        })) || [],
      tags: product.tags,
      variants: filteredVariants,
      options: enrichedOptions,
      visible: product.visible,
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      stripeProductId: stripeProduct.id,
      stripePriceIds,
      status: 'inactive',
    };

    await db.collection('merchProducts').doc(productId).set(payload);
  } catch (error) {
    console.error('❌ Failed to sync Printify product:', error.message);
  }
};

exports.refreshPrintifyStock = onSchedule(
  {
    schedule: '0 * * * *',
    timeZone: 'America/Chicago',
    secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID],
  },
  async () => {
    const shopId = PRINTIFY_SHOP_ID.value();
    const apiKey = PRINTIFY_API_KEY.value();

    const merchSnapshot = await db.collection('merchProducts').get();

    for (const doc of merchSnapshot.docs) {
      const productId = doc.id;
      try {
        const response = await axios.get(
          `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        const printifyProduct = response.data;
        const productDoc = doc.data();
        const enrichedOptions = productDoc.options || [];

        await doc.ref.update({
          variants: printifyProduct.variants.filter((v) => v.is_enabled),
          options: enrichedOptions,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (err) {
        console.error(`❌ Failed to update ${productId}:`, err.message);
      }
    }
  }
);

exports.autoReplyInquiry = onDocumentCreated(
  {
    document: 'inquiries/{docId}',
    secrets: [SENDGRID_API_KEY],
  },
  async (event) => {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY.value());

    const data = event.data.data();
    const { email, firstName } = data;

    const msg = {
      to: email,
      from: {
        name: 'Ober Artisan Drums',
        email: 'support@oberartisandrums.com',
      },
      replyTo: 'support@oberartisandrums.com',
      bcc: ['support@oberartisandrums.com'],
      subject: `We've Received Your Message`,
      html: `...`,
    };

    try {
      const response = await sgMail.send(msg);
      console.log('✅ Auto-reply sent:', response);
    } catch (error) {
      console.error('❌ Error sending auto-reply:', error);
    }
  }
);

exports.autoReplySoundlegend = onDocumentCreated(
  {
    document: 'soundlegend_submissions/{docId}',
    secrets: [SENDGRID_API_KEY],
  },
  async (event) => {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY.value());

    const data = event.data.data();
    const { email, firstName } = data;

    const msg = {
      to: email,
      from: {
        name: 'Ober Artisan Drums',
        email: 'soundlegend@oberartisandrums.com',
      },
      bcc: ['soundlegend@oberartisandrums.com'],
      subject: `Welcome to the SoundLegend Experience`,
      html: `...`,
    };

    try {
      const response = await sgMail.send(msg);
      console.log('✅ Auto-reply sent (SoundLegend):', response);
    } catch (error) {
      console.error('❌ Error sending SoundLegend auto-reply:', error);
    }
  }
);

exports.api = onRequest(
  {
    region: 'us-central1',
    secrets: [
      STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET,
      CLIENT_URL,
      RECAPTCHA_SECRET_KEY,
    ],
  },
  app
);

exports.stripeWebhook = onRequest(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    cors: true,
  },
  stripeWebhookApp
);

exports.printifyWebhookListener = onRequest(
  {
    region: 'us-central1',
    secrets: [
      PRINTIFY_API_KEY,
      PRINTIFY_SHOP_ID,
      PRINTIFY_WEBHOOK_SECRET,
      STRIPE_SECRET_KEY,
    ],
  },
  printifyWebhookApp
);

exports.refreshPrintifyStockNow = onRequest(
  {
    region: 'us-central1',
    secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID],
  },
  async (req, res) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://oberartisandrums.com',
      'https://www.oberartisandrums.com',
    ];

    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(204).send('');
    }

    try {
      await exports.refreshPrintifyStock.run();
      res
        .status(200)
        .send('✅ Manual refreshPrintifyStock executed successfully.');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      res.status(500).send('❌ Manual refresh failed.');
    }
  }
);

exports.adminCreateUser = functions.https.onCall(async (data, context) => {
  // ... unchanged ...
});

const { generateDrumMockup } = require('./generateDrumMockup');
exports.generateDrumMockup = generateDrumMockup;
