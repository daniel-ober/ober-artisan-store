const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall } = require('firebase-functions/v2/https');
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

// ───────────────────────────────────────────────────────────────────────────────
// Main Express app (JSON)
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

// Helpers
const stripeFromSecret = () => stripeLib(STRIPE_SECRET_KEY.value());
const pHeaders = () => ({
  Authorization: `Bearer ${PRINTIFY_API_KEY.value()}`,
  'Content-Type': 'application/json',
});

// ───────────────────────────────────────────────────────────────────────────────
// NEW: Admin — list Printify products for picker
app.get('/printify/catalog', async (req, res) => {
  try {
    const shopId = PRINTIFY_SHOP_ID.value();
    const { data } = await axios.get(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      { headers: pHeaders() }
    );
    const list = data?.data || data || [];
    const slim = list.map((p) => ({
      id: p.id,
      title: p.title,
      images: p.images || [],
      variants:
        (p.variants || []).map((v) => ({
          id: v.id,
          sku: v.sku,
          title: v.title,
          options: v.options,
          price: v.price,
          is_enabled: v.is_enabled,
          quantity: v.quantity,
        })) || [],
    }));
    res.json({ products: slim });
  } catch (e) {
    console.error('Printify catalog error', e?.response?.data || e);
    res.status(500).json({ error: 'Failed to fetch Printify catalog' });
  }
});

app.post('/admin/merch/ingest', async (req, res) => {
  try {
    const { printifyProductId, titleOverride, active = true } = req.body || {};
    if (!printifyProductId) return res.status(400).json({ error: 'printifyProductId required' });

    const shopId = PRINTIFY_SHOP_ID.value();
    const { data: p } = await axios.get(
      `https://api.printify.com/v1/shops/${shopId}/products/${printifyProductId}.json`,
      { headers: pHeaders() }
    );

    // 1) Get variant metadata so we can label size/color etc.
    const { data: variantMeta } = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/variants.json`,
      { headers: pHeaders() }
    );

    const metaById = new Map();
    (Array.isArray(variantMeta) ? variantMeta : []).forEach((m) => metaById.set(m.id, m));

    // 2) Enrich variants with readable fields and images scoped per variant
    const rawVariants = Array.isArray(p.variants) ? p.variants.filter(v => v.is_enabled) : [];
    const enrichedVariants = rawVariants.map((v) => {
      const m = metaById.get(v.id) || {};
      const optObj = (m.options || []).reduce((acc, opt) => {
        // opt.name might be "Size"/"Color" etc.; normalize to lower
        acc[opt.name?.toLowerCase?.() || ''] = opt.value;
        return acc;
      }, {});
      const vImages = (p.images || []).filter(img => Array.isArray(img.variant_ids) && img.variant_ids.includes(v.id));
      return {
        id: String(v.id),
        title: v.title || '',
        sku: v.sku || '',
        printifyPriceCents: Number(v.price || 0), // already retail cents
        quantity: v.quantity,
        is_enabled: !!v.is_enabled,
        options_array: v.options || [], // keep raw ids (for debugging)
        size: optObj.size || '',        // ← readable
        color: optObj.color || '',      // ← readable
        images: vImages.map(img => ({
          src: img.src,
          position: img.position,
          displayInGallery: true,
        })),
      };
    });

    // 3) Build options for selectors (Colors/Sizes with readable titles)
    //    Start from Printify product.options, but add only values that exist in enabled variants.
    const optionDefs = Array.isArray(p.options) ? p.options : [];
    const enabledByOptionId = new Map(); // optionId -> Set(valueId)
    enrichedVariants.forEach((v) => {
      (v.options_array || []).forEach((valId) => {
        // we don't know the option id here; Printify uses values that belong to an option.
        // We'll add values when we see them below by scanning variants against opt.values.
      });
    });

    const enrichedOptions = optionDefs.map((opt) => {
      const values = (opt.values || []).map((val) => {
        // Collect colors that actually appear for this value (via enrichedVariants)
        const usedColors = new Set();
        enrichedVariants.forEach((v) => {
          const hasThisValue = Array.isArray(v.options_array) && v.options_array.includes(val.id);
          if (hasThisValue && v.color) usedColors.add(v.color);
        });
        return { ...val, colors: [...usedColors] };
      });
      return {
        ...opt,
        values,
      };
    });

    // 4) Create Stripe Product + Prices (mirror retail price)
    const stripe = stripeFromSecret();
    const sp = await stripe.products.create({
      name: titleOverride || p.title,
      active,
      images: (p.images || []).slice(0, 8).map((i) => i.src).filter(Boolean),
      metadata: {
        printify_product_id: p.id,
        print_provider_id: String(p.print_provider_id || ''),
        blueprint_id: String(p.blueprint_id || ''),
      },
    });

    const stripePriceIds = {};
    for (const v of enrichedVariants) {
      if (!v.is_enabled) continue;
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: v.printifyPriceCents, // use Printify retail
        product: sp.id,
        nickname: v.title || undefined,
        metadata: {
          printify_variant_id: v.id,
          printify_sku: v.sku || '',
          variant_title: v.title || '',
        },
      });
      v.stripePriceId = price.id;                   // inline for convenience
      stripePriceIds[v.id] = { priceId: price.id, unitAmount: price.unit_amount }; // map for legacy UI
    }

    // 5) Compute min price for listing cards
    const minPriceCents = enrichedVariants.reduce((min, v) => {
      if (!v.is_enabled) return min;
      const cents = Number(v.printifyPriceCents || 0);
      return min === null ? cents : Math.min(min, cents);
    }, null);

    const preview = (p.images || []).find((i) => i.is_default) || p.images?.[0];

    const merchDoc = {
      id: p.id,
      title: p.title,
      description: p.description || '',
      images: (p.images || []).map((img) => ({ ...img, displayInGallery: true })),
      previewImage: preview?.src || '',
      tags: p.tags || [],
      visible: !!p.visible,

      stripeProductId: sp.id,
      stripePriceIds,               // ← for your existing UI paths
      variants: enrichedVariants,   // ← each variant has .stripePriceId, .size, .color

      options: enrichedOptions,     // ← Colors/Sizes structure your PDP expects
      minPriceCents: minPriceCents ?? null,

      status: active ? 'active' : 'inactive',
      printify: {
        productId: p.id,
        blueprint_id: p.blueprint_id || null,
        print_provider_id: p.print_provider_id || null,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('merchProducts').doc(p.id).set(merchDoc, { merge: true });
    res.json({ ok: true, merchProduct: merchDoc });
  } catch (e) {
    console.error('Ingest error', e?.response?.data || e);
    res.status(500).json({ error: 'Failed to ingest Printify product' });
  }
});

// NEW: Admin — manual stock refresh (used by ManageProducts button)
app.post('/admin/merch/refresh-stock', async (req, res) => {
  try {
    const shopId = PRINTIFY_SHOP_ID.value();
    const { data } = await axios.get(
      `https://api.printify.com/v1/shops/${shopId}/products.json`,
      { headers: pHeaders() }
    );
    const list = data?.data || data || [];

    for (const item of list) {
      try {
        const { data: p } = await axios.get(
          `https://api.printify.com/v1/shops/${shopId}/products/${item.id}.json`,
          { headers: pHeaders() }
        );
        const variants = (p.variants || []).map((v) => ({
          id: String(v.id),
          title: v.title,
          options: v.options || {},
          printifyPriceCents: Number(v.price || 0),
          quantity: v.quantity,
          sku: v.sku || '',
          is_enabled: !!v.is_enabled,
        }));

        await db.collection('merchProducts').doc(p.id).set(
          {
            title: p.title,
            images: p.images || [],
            variants,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            syncedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error('Refresh single product failed', item?.id, e?.response?.data || e);
      }
    }

    res.json({ ok: true, count: list.length });
  } catch (err) {
    console.error('Refresh stock error', err?.response?.data || err);
    res.status(500).json({ error: 'Failed to refresh stock' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Existing endpoints (kept exactly as in your file, with minimal edits)

app.post('/createCheckoutSession', async (req, res) => {
  try {
    const stripeKey = STRIPE_SECRET_KEY.value();
    const clientUrlRaw = CLIENT_URL.value();
    if (!stripeKey) {
      console.error('❌ Missing STRIPE_SECRET_KEY secret');
      return res.status(500).json({ error: 'Server misconfiguration (stripe key).' });
    }
    if (!clientUrlRaw) {
      console.error('❌ Missing CLIENT_URL secret');
      return res.status(500).json({ error: 'Server misconfiguration (client url).' });
    }

    const stripe = stripeLib(stripeKey);
    const clientUrl = clientUrlRaw.trim().replace(/\/+$/, '');

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
    } = req.body || {};

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart.' });
    }

    const guestToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    await db.collection('pending_checkouts').doc(guestToken).set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      products,
      userId: userId || 'guest',
    });

    const lineItems = [];
    for (const p of products) {
      const isMerch = p?.category === 'merch';
      const cfg = p?.config || {};
      const priceNumber = Number(p?.price || 0);
      const unitAmount = Math.round(priceNumber * 100);
      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        console.error('❌ Bad unit_amount for product:', p);
        return res.status(400).json({ error: 'Invalid item price.' });
      }
      const images = typeof p?.image === 'string' && /^https?:\/\//i.test(p.image) ? [p.image] : [];

      if (isMerch) {
        const color = String(cfg.colorName || cfg.color || cfg.Colors || '').trim();
        const size = String(cfg.sizeName || cfg.size || cfg.Sizes || '').trim();
        const vId = String(cfg.variantId || '').trim();
        const parts = [];
        if (color) parts.push(`Color: ${color}`);
        if (size) parts.push(`Size: ${size}`);
        const variantSummary = parts.length ? parts.join(' • ') : undefined;

        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: p?.name || 'Ober Merch',
              ...(images.length ? { images } : {}),
              ...(variantSummary ? { description: variantSummary } : {}),
              metadata: {
                category: 'merch',
                productId: String(p?.productId || ''),
                variantId: vId,
                sizeName: size,
                colorName: color,
              },
            },
          },
          quantity: Math.max(1, parseInt(p?.quantity || 1, 10)),
        });
      } else {
        const cfgA = cfg;
        const descParts = [
          cfgA.size ? `Size: ${cfgA.size}"` : '',
          cfgA.depth ? `Depth: ${cfgA.depth}"` : '',
          cfgA.lugQuantity ? `${cfgA.lugQuantity} Lugs` : '',
          cfgA.staveQuantity ? `${cfgA.staveQuantity} Staves` : '',
          typeof cfgA.reRing !== 'undefined' ? (cfgA.reRing ? 'Re-Rings' : 'No Re-Rings') : '',
          cfgA.hardwareColor ? `Hardware: ${cfgA.hardwareColor}` : '',
        ].filter(Boolean);

        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: p?.name || 'Ober Artisan Product',
              ...(images.length ? { images } : {}),
              ...(descParts.length ? { description: descParts.join(' • ') } : {}),
            },
          },
          quantity: Math.max(1, parseInt(p?.quantity || 1, 10)),
        });
      }
    }

    const sessionParams = {
      mode: 'payment',
      line_items: lineItems,
      success_url: `${clientUrl}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${clientUrl}/cart`,
      allow_promotion_codes: true,
      metadata: {
        userId: userId || 'guest',
        guestToken,
        customerPhone: customerPhone || '',
        customerName: `${firstName || ''} ${lastName || ''}`.trim(),
        promoCode: promoCode || '',
        shipTo: shippingAddress?.line1 || '',
      },
    };

    if (customerEmail && /\S+@\S+\.\S+/.test(customerEmail)) {
      sessionParams.customer_email = customerEmail;
    }
    sessionParams.shipping_address_collection = { allowed_countries: ['US', 'CA'] };
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    const msg = err?.raw?.message || err?.message || 'Unknown error creating checkout session';
    console.error('❌ Error creating checkout session:', msg, err);
    return res.status(500).json({ error: msg });
  }
});

// reCAPTCHA verification (unchanged)
app.post('/verifyRecaptcha', async (req, res) => {
  const token = req.body.token;
  const email = req.body.email || 'unknown';
  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing token' });
  }
  try {
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: { secret: RECAPTCHA_SECRET_KEY.value(), response: token },
    });
    const { success, score } = response.data;
    if (!success || score < 0.5) {
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
    const snapshot = await db.collection('orders').where('stripeSessionId', '==', req.params.sessionId).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ error: 'Order not found' });
    res.json(snapshot.docs[0].data());
  } catch (err) {
    console.error('❌ Error fetching order:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Stripe webhook app (raw body)
const stripeWebhookApp = express();
stripeWebhookApp.use(express.raw({ type: 'application/json' }));

function parseTitleColorSize(title) {
  if (!title || typeof title !== 'string') return { color: '', size: '' };
  const parts = title.split('/').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 2) return { color: parts[0], size: parts[1] };
  if (parts.length > 2) return { color: parts[0], size: parts[parts.length - 1] };
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
  if (session.payment_intent) {
    session = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['payment_intent.payment_method'],
    });
  }

  try {
    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product'],
      });

      const existing = await db
        .collection('orders')
        .where('stripeSessionId', '==', session.id)
        .limit(1)
        .get();
      if (!existing.empty) return res.status(200).send('Order already recorded for this session.');

      if (
        !session.customer_details?.email ||
        !session.customer_details?.name ||
        !session.shipping_details?.address ||
        lineItems.data.length === 0
      ) {
        console.warn('⚠️ Skipping incomplete order creation. Missing important customer info.');
        return res.status(200).send('Skipped: Incomplete session, no order created.');
      }

      const guestToken = session.metadata?.guestToken || '';
      let snapshotProducts = [];
      if (guestToken) {
        try {
          const snapDoc = await db.collection('pending_checkouts').doc(guestToken).get();
          if (snapDoc.exists) {
            const snap = snapDoc.data();
            if (Array.isArray(snap?.products)) snapshotProducts = snap.products;
          }
        } catch (e) {
          console.warn('⚠️ Failed to read pending_checkouts:', e.message);
        }
      }

      const items = [];
      for (const li of lineItems.data) {
        const priceId = li.price?.id || '';
        const unitAmount = li.price?.unit_amount ?? null;
        const productObj = li.price?.product || {};
        const pMeta = productObj?.metadata || {};
        const pDesc = productObj?.description || '';
        const pImages = Array.isArray(productObj?.images) ? productObj.images : [];

        let matched =
          (Array.isArray(snapshotProducts) ? snapshotProducts : []).find(
            (p) => p.stripePriceId && p.stripePriceId === priceId
          ) ||
          (Array.isArray(snapshotProducts) ? snapshotProducts : []).find(
            (p) => !p.stripePriceId && Math.round(Number(p.price || 0) * 100) === unitAmount
          );

        let stripePriceMeta = { variantId: '', title: '', sku: '' };
        try {
          if (priceId) {
            const priceObj = await stripe.prices.retrieve(priceId);
            const md = priceObj?.metadata || {};
            stripePriceMeta.variantId = md.variantId || md.printify_variant_id || '';
            stripePriceMeta.title = md.title || md.variant_title || '';
            stripePriceMeta.sku = md.sku || md.printify_sku || '';
          }
        } catch (e) {
          console.warn('⚠️ Could not retrieve Stripe Price metadata for', priceId, e.message);
        }

        let variant = {
          variantId: pMeta.variantId || pMeta.printify_variant_id || '',
          size: pMeta.sizeName || '',
          color: pMeta.colorName || '',
          sku: stripePriceMeta.sku || '',
          title: stripePriceMeta.title || '',
        };

        if (matched?.category === 'merch') {
          const cfg = matched.config || {};
          variant.variantId = variant.variantId || (cfg.variantId ? String(cfg.variantId) : '');
          variant.size = variant.size || cfg.sizeName || cfg.size || cfg.Sizes || '';
          variant.color = variant.color || cfg.colorName || cfg.color || cfg.Colors || '';
        } else if (matched) {
          const cfg = matched.config || {};
          variant = {
            ...variant,
            size: variant.size || cfg.size || '',
            color: variant.color || cfg.hardwareColor || '',
            lugQuantity: cfg.lugQuantity || '',
            staveQuantity: cfg.staveQuantity || '',
            depth: cfg.depth || '',
            reRing: typeof cfg.reRing !== 'undefined' ? (cfg.reRing ? 'Yes' : 'No') : '',
          };
        }

        if ((!variant.color || !variant.size) && pDesc) {
          const parts = pDesc.split('•').map((s) => s.trim());
          for (const part of parts) {
            if (part.toLowerCase().startsWith('color:'))
              variant.color = variant.color || part.split(':')[1].trim();
            if (part.toLowerCase().startsWith('size:'))
              variant.size = variant.size || part.split(':')[1].trim();
          }
        }

        if ((!variant.color || !variant.size) && stripePriceMeta.title) {
          const t = stripePriceMeta.title.split('/').map((s) => s.trim());
          if (!variant.color && t[0]) variant.color = t[0];
          if (!variant.size && t[t.length - 1]) variant.size = t[t.length - 1];
        }

        const finalCategory = matched?.category || pMeta.category || '';
        const finalProductId = matched?.productId || pMeta.productId || '';
        const finalName = matched?.name || productObj?.name || li.description || 'Ober Product';
        const finalImage = matched?.image || pImages[0] || '';

        items.push({
          priceId,
          description: li.description,
          quantity: li.quantity,
          price: (li.amount_total || 0) / 100,
          name: finalName,
          category: finalCategory,
          productId: finalProductId,
          image: finalImage,
          variant,
        });
      }

      const pm = session.payment_intent?.payment_method || null;
      const paymentMethodType = pm?.type || '';
      let cardDetails = null;
      if (paymentMethodType === 'card' && pm?.card) {
        cardDetails = { brand: pm.card.brand || '', lastFour: pm.card.last4 || '' };
      }
      const paymentMethodDetails =
        paymentMethodType && pm && pm[paymentMethodType] ? pm[paymentMethodType] : null;

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
        paymentMethod: paymentMethodType,
        cardDetails,
        paymentMethodDetails,
        stripePaymentStatus: session.payment_status || '',
        status: 'order successful',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        userId: session.metadata?.userId || 'guest',
        guestToken: session.metadata?.guestToken || '',
        items,
        orderId,
        promoCode: session.total_details?.amount_discount ? session.discounts?.[0]?.promotion_code || '' : '',
      };

      await db.collection('orders').doc(orderId).set(orderDoc);
      if (session.metadata?.guestToken) {
        db.collection('pending_checkouts').doc(session.metadata.guestToken).delete().catch(() => {});
      }
      return res.status(200).send('Order created');
    }

    if (event.type === 'checkout.session.expired' || event.type === 'checkout.session.async_payment_failed') {
      console.warn('⚠️ Stripe session failed or expired, no order created.');
      return res.status(200).send('Skipped: Session failed or expired.');
    }

    res.status(200).send('Unhandled event received');
  } catch (err) {
    console.error('❌ Failed processing event:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Printify webhook app (raw body)
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
  const expectedSignature = crypto.createHmac('sha256', secret).update(raw, 'utf8').digest('hex');

  const isValid = crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(expectedSignature));
  if (!isValid) return res.status(401).send('Invalid signature');

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
        (img) => Array.isArray(img.variant_ids) && img.variant_ids.includes(variant.id)
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
        return { ...val, colors: [...usedColors] };
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
      stripePriceIds[variant.id] = { priceId: price.id, unitAmount: price.unit_amount };
    }

    const payload = {
      id: product.id,
      title: product.title,
      description: product.description || '',
      images: product.images?.map((img) => ({ ...img, displayInGallery: true })) || [],
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

// ───────────────────────────────────────────────────────────────────────────────
// Scheduled refresh (unchanged)
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

    for (const docRef of merchSnapshot.docs) {
      const productId = docRef.id;
      try {
        const response = await axios.get(
          `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );

        const printifyProduct = response.data;
        const productDoc = docRef.data();
        const enrichedOptions = productDoc.options || [];

        await docRef.ref.update({
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

// Auto-replies (unchanged)
exports.autoReplyInquiry = onDocumentCreated(
  { document: 'inquiries/{docId}', secrets: [SENDGRID_API_KEY] },
  async (event) => {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY.value());
    const data = event.data.data();
    const { email } = data;
    const msg = {
      to: email,
      from: { name: 'Ober Artisan Drums', email: 'support@oberartisandrums.com' },
      replyTo: 'support@oberartisandrums.com',
      bcc: ['support@oberartisandrums.com'],
      subject: `We've Received Your Message`,
      html: `...`,
    };
    try { await sgMail.send(msg); } catch (error) { console.error('❌ Error sending auto-reply:', error); }
  }
);

exports.autoReplySoundlegend = onDocumentCreated(
  { document: 'soundlegend_submissions/{docId}', secrets: [SENDGRID_API_KEY] },
  async (event) => {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(SENDGRID_API_KEY.value());
    const data = event.data.data();
    const { email } = data;
    const msg = {
      to: email,
      from: { name: 'Ober Artisan Drums', email: 'soundlegend@oberartisandrums.com' },
      bcc: ['soundlegend@oberartisandrums.com'],
      subject: `Welcome to the SoundLegend Experience`,
      html: `...`,
    };
    try { await sgMail.send(msg); } catch (error) { console.error('❌ Error sending SoundLegend auto-reply:', error); }
  }
);

// Main API, Stripe webhook, Printify webhook, Manual refresh
exports.api = onRequest(
  { region: 'us-central1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CLIENT_URL, RECAPTCHA_SECRET_KEY, PRINTIFY_API_KEY, PRINTIFY_SHOP_ID] },
  app
);
exports.stripeWebhook = onRequest(
  { region: 'us-central1', secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET], cors: true },
  stripeWebhookApp
);
exports.printifyWebhookListener = onRequest(
  { region: 'us-central1', secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID, PRINTIFY_WEBHOOK_SECRET, STRIPE_SECRET_KEY] },
  printifyWebhookApp
);
exports.refreshPrintifyStockNow = onRequest(
  { region: 'us-central1', secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID] },
  async (req, res) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).send('');
    try {
      await exports.refreshPrintifyStock.run();
      res.status(200).send('✅ Manual refreshPrintifyStock executed successfully.');
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
      res.status(500).send('❌ Manual refresh failed.');
    }
  }
);

// Other callables unchanged
exports.adminCreateUser = functions.https.onCall(async (data, context) => {
  // ... unchanged ...
});
const { generateDrumMockup } = require('./generateDrumMockup');
exports.generateDrumMockup = generateDrumMockup;
exports.computeSoundPrism = onCall({ region: 'us-central1' }, async (request) => {
  const inputs = request.data?.inputs || {};
  const f = Number(inputs.fundamentalHz) || 200;
  const computed = {
    axis: { loHz: 140, hiHz: 360, tickHz: 20 },
    sweetSpots: [
      { id: 'low', label: 'Low', loHz: f * 2.05, hiHz: f * 2.3 },
      { id: 'legacy', label: 'Legacy', loHz: f * 2.35, hiHz: f * 2.65 },
      { id: 'high', label: 'High', loHz: f * 2.7, hiHz: f * 3.1 },
    ],
    legacyPrint: { bandId: 'legacy', why: ['placeholder analysis'] },
    harmonics: [2, 2.5, 3].map((m) => ({ multiple: m, hz: f * m })),
  };
  return { computed };
});