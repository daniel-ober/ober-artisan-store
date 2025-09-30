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
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const CLIENT_URL = defineSecret('CLIENT_URL');
const PRINTIFY_API_KEY = defineSecret('PRINTIFY_API_KEY');
const PRINTIFY_SHOP_ID = defineSecret('PRINTIFY_SHOP_ID');
const PRINTIFY_WEBHOOK_SECRET = defineSecret('PRINTIFY_WEBHOOK_SECRET');
const RECAPTCHA_SECRET_KEY = defineSecret('RECAPTCHA_SECRET_KEY');

admin.initializeApp();
const db = admin.firestore();

// === Gmail API mailer (Workspace via service account DWD) ===
const { google } = require('googleapis');
const GMAIL_CLIENT_EMAIL = defineSecret('GMAIL_CLIENT_EMAIL');
const GMAIL_PRIVATE_KEY = defineSecret('GMAIL_PRIVATE_KEY');
const GMAIL_SENDER = defineSecret('GMAIL_SENDER'); // fallback
const GMAIL_IMPERSONATE = defineSecret('GMAIL_IMPERSONATE'); // Workspace user

// branding assets + CTAs
const LOGO_MAIN =
  'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/SendGridEmail%2Fblack_logo.png?alt=media&token=850410a6-4373-4194-803e-808c49cbc626';
const LOGO_SL =
  'https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/SendGridEmail%2Fsoundlegend-email.png?alt=media&token=2929bea0-5d78-4143-ab61-c4d543671a33';
const CTA_SL = 'https://www.youtube.com/watch?v=PW28PjMCpxg';
const CTA_SITE = 'https://www.oberartisandrums.com';

// email template helpers
const emailShell = ({ logo, bodyHtml }) => `
<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;line-height:1.55;background:#fff;padding:0;margin:0">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:collapse">
    <tr><td style="padding:32px 24px 8px;text-align:center">
      <img src="${logo}" alt="Ober Artisan Drums" style="max-width:260px;height:auto"/>
    </td></tr>
    <tr><td style="padding:8px 24px 24px">${bodyHtml}</td></tr>
    <tr><td style="padding:24px 24px 48px;border-top:1px solid #eee;color:#6b7280;font-size:13px;text-align:center">
      In craft and legacy,<br/>— The Ober Artisan Team<br/>
      <a href="https://www.oberartisandrums.com" style="color:#6b7280;text-decoration:none">www.oberartisandrums.com</a><br/>
      Handcrafted in Nashville, TN
    </td></tr>
  </table>
</div>
`;
const button = (label, href) => `
  <div style="text-align:center;margin:24px 0 8px">
    <a href="${href}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:#111;color:#fff;text-decoration:none;font-weight:600">
      ${label}
    </a>
  </div>`;
const greet = (name) => `Hi ${String(name || '').trim() || 'there'},`;

const bodySoundLegend = (name) => `
  <p style="margin:0 0 16px">${greet(name)}</p>
  <p style="margin:0 0 16px">You're in. We've received your SoundLegend submission — and we’re excited to hear your story.</p>
  <p style="margin:0 0 16px">This next chapter isn’t just about building a snare. It’s about honoring your legacy through sound — captured in wood, crafted by hand, and designed to last a lifetime.</p>
  <p style="margin:0 0 16px">We typically follow up within 24–48 hours to learn more about your vision. In the meantime, here’s a short video to get us both amped up about what’s ahead:</p>
  ${button('Watch the Teaser', CTA_SL)}
`;
const bodySupport = (name) => `
  <p style="margin:0 0 16px">${greet(name)}</p>
  <p style="margin:0 0 16px">Thanks for reaching out. Your message has been received, and we're looking forward to connecting with you.</p>
  <p style="margin:0 0 16px">At Ober Artisan Drums, every note and detail matters. Whether you're exploring a new build, asking a question, or simply saying hello, we treat it with the same level of care we bring to our instruments.</p>
  <p style="margin:0 0 16px">We typically respond within 24–48 hours. In the meantime, feel free to browse the shop or explore the stories behind our drums.</p>
  ${button('Visit Our Site', CTA_SITE)}
`;
const bodyEndorsement = (name, docId, tier) => `
  <p style="margin:0 0 16px">${greet(name)}</p>
  <p style="margin:0 0 16px">Thank you for your interest in representing the Ober Artisan Drums brand. We’ve received your application${docId ? ` (Reference: <strong>${docId}</strong>)` : ''}${tier ? ` for the <strong>${tier}</strong> tier` : ''}.</p>
  <p style="margin:0 0 16px">Our team typically reviews applications within <strong>5–10 business days</strong>. We'll reach out if we need anything else.</p>
  ${button('Visit Our Site', CTA_SITE)}
`;

function base64Url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

/** gmailSend with per-message From override */
async function gmailSend({
  to,
  subject,
  text,
  html,
  bcc = [],
  replyTo,
  fromName = 'Ober Artisan Drums',
  fromEmail, // 👈 NEW
}) {
  const auth = new google.auth.JWT({
    email: GMAIL_CLIENT_EMAIL.value(),
    key: (GMAIL_PRIVATE_KEY.value() || '').replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
    ],
    subject: GMAIL_IMPERSONATE.value(),
  });
  const gmail = google.gmail({ version: 'v1', auth });
  const fromAddr = fromEmail || GMAIL_SENDER.value();

  const headers = [
    `From: ${encodeRFC2047(fromName)} <${fromAddr}>`,
    `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    ...(bcc.length ? [`Bcc: ${bcc.join(', ')}`] : []),
    ...(replyTo ? [`Reply-To: ${replyTo}`] : []),
    `Subject: ${encodeRFC2047(subject)}`,
    'MIME-Version: 1.0',
    html
      ? 'Content-Type: text/html; charset=UTF-8'
      : 'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html || text || '',
  ].join('\r\n');

  const raw = base64Url(headers);
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
}

// ───────────────────────────────────────────────────────────────────────────────
// Main Express app (JSON)
const app = express();
app.use(express.json({ limit: '12mb' }));

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://oberartisandrums.com',
  'https://www.oberartisandrums.com',
  'https://danoberartisandrums.web.app',
  'https://admin.oberartisandrums.com',
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

// 🔹 Healthcheck for Cloud Run
app.get('/', (_req, res) => res.status(200).send('ok'));

// Helpers
const stripeFromSecret = () => stripeLib(STRIPE_SECRET_KEY.value());
const pHeaders = () => ({
  Authorization: `Bearer ${PRINTIFY_API_KEY.value()}`,
  'Content-Type': 'application/json',
});

// Put this near your other helpers
function encodeRFC2047(str = '') {
  return /[^\x00-\x7F]/.test(str)
    ? `=?UTF-8?B?${Buffer.from(String(str), 'utf8').toString('base64')}?=`
    : String(str);
}

// Build Printify line_items from your cart shape
const toPrintifyLineItems = (products = []) =>
  products.map((p) => {
    const quantity = Math.max(1, parseInt(p?.quantity || 1, 10));
    const variantId = String(p?.config?.variantId || p?.variantId || '').trim();
    const productId = String(p?.productId || p?.id || '').trim();
    const sku = String(p?.sku || '').trim();

    if (productId && variantId) {
      return {
        product_id: productId,
        variant_id: Number(variantId),
        quantity,
        ...(sku ? { external_id: sku } : {}),
      };
    }
    return {
      sku: sku || productId,
      quantity,
      ...(sku ? { external_id: sku } : {}),
    };
  });

// Build Printify address_to from your shippingAddress shape
const toPrintifyAddress = (
  addr = {},
  firstName = 'Customer',
  lastName = ''
) => ({
  first_name: addr.firstName || firstName,
  last_name: addr.lastName || lastName,
  email: addr.email || 'customer@example.com',
  phone: addr.phone || '',
  country: addr.country,
  region: addr.state || '',
  address1: addr.line1,
  address2: addr.line2 || '',
  city: addr.city,
  zip: addr.postal_code || addr.postalCode || addr.zip || '',
});

// Map Printify rates -> Stripe shipping_options
const mapRatesToStripeOptions = (rates, currency = 'usd') => {
  const candidates = [
    { key: 'economy', label: 'Economy' },
    { key: 'standard', label: 'Standard' },
    { key: 'priority', label: 'Priority' },
    { key: 'express', label: 'Express' },
    { key: 'printify_express', label: 'Printify Express' },
  ];
  const windowFor = (k) => {
    switch (k) {
      case 'economy':
        return {
          minimum: { unit: 'business_day', value: 5 },
          maximum: { unit: 'business_day', value: 12 },
        };
      case 'standard':
        return {
          minimum: { unit: 'business_day', value: 3 },
          maximum: { unit: 'business_day', value: 7 },
        };
      case 'priority':
        return {
          minimum: { unit: 'business_day', value: 2 },
          maximum: { unit: 'business_day', value: 4 },
        };
      case 'express':
      case 'printify_express':
        return {
          minimum: { unit: 'business_day', value: 1 },
          maximum: { unit: 'business_day', value: 2 },
        };
      default:
        return null;
    }
  };
  return candidates
    .filter(
      (c) =>
        rates && rates[c.key] != null && Number.isFinite(Number(rates[c.key]))
    )
    .map((c) => ({
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: Math.round(Number(rates[c.key])), currency },
        display_name: c.label,
        delivery_estimate: windowFor(c.key),
      },
    }));
};

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

// ───────────────────────────────────────────────────────────────────────────────
// Admin — ingest a single Printify product into Firestore + Stripe (hardened)
app.post('/admin/merch/ingest', async (req, res) => {
  const where = 'admin/merch/ingest';
  try {
    const { printifyProductId, titleOverride, active = true } = req.body || {};
    if (!printifyProductId) {
      return res.status(400).json({ error: 'printifyProductId required' });
    }

    const shopId = PRINTIFY_SHOP_ID.value();

    // 1) Fetch full Printify product
    let p;
    try {
      const { data } = await axios.get(
        `https://api.printify.com/v1/shops/${shopId}/products/${printifyProductId}.json`,
        { headers: pHeaders() }
      );
      p = data;
    } catch (e) {
      const detail = e?.response?.data || e?.message;
      console.error(`[${where}] fetch product failed`, detail);
      return res.status(e?.response?.status || 500).json({
        error: 'Failed to fetch Printify product',
        detail,
      });
    }

    if (!p || !p.id) {
      return res
        .status(404)
        .json({ error: 'Printify product not found or malformed' });
    }

    // 2) Fetch variant meta (optional, shape varies by blueprint/provider)
    let variantMeta = [];
    try {
      const { data } = await axios.get(
        `https://api.printify.com/v1/catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/variants.json`,
        { headers: pHeaders() }
      );
      variantMeta = Array.isArray(data) ? data : [];
    } catch (e) {
      // Don’t fail the whole ingest if meta call fails — we can still proceed
      console.warn(
        `[${where}] variant meta fetch warning`,
        e?.response?.data || e?.message
      );
    }
    const metaById = new Map();
    variantMeta.forEach((m) => metaById.set(m.id, m));

    // Helpers to extract readable size/color safely
    const readableFromMeta = (meta) => {
      const out = { size: '', color: '' };
      const arr = Array.isArray(meta?.options) ? meta.options : [];
      for (const o of arr) {
        const name = String(o?.name || '').toLowerCase();
        if (/size/.test(name)) out.size = o?.value || out.size;
        if (/colou?r/.test(name)) out.color = o?.value || out.color;
      }
      return out;
    };

    // 3) Enrich variants (guard all fields)
    const productImages = Array.isArray(p.images) ? p.images : [];
    const rawVariants = Array.isArray(p.variants) ? p.variants : [];

    const enrichedVariants = rawVariants.map((v) => {
      const mid = Number(v?.id);
      const m = metaById.get(mid) || null;

      // images that reference this variant
      const vImages = productImages.filter(
        (img) =>
          Array.isArray(img?.variant_ids) && img.variant_ids.includes(mid)
      );

      const readable = readableFromMeta(m);

      return {
        id: String(v?.id ?? ''),
        title: String(v?.title || ''),
        sku: String(v?.sku || ''),
        // Printify returns "price" already in retail cents; coerce to integer
        printifyPriceCents: Number.isFinite(Number(v?.price))
          ? Number(v.price)
          : null,
        quantity: Number.isFinite(Number(v?.quantity)) ? Number(v.quantity) : 0,
        is_enabled: !!v?.is_enabled,
        is_available: v?.is_available !== false,
        // raw options array of value IDs (sizeId, colorId, etc)
        options_array: Array.isArray(v?.options) ? v.options : [],
        // readable fields when meta is available
        size: readable.size,
        color: readable.color,
        images: vImages.map((img) => ({
          src: img?.src || '',
          position: img?.position || '',
          displayInGallery: true,
        })),
      };
    });

    // Only enabled & (available !== false)
    const enabledVariants = enrichedVariants.filter(
      (v) => v.is_enabled && v.is_available
    );

    if (!enabledVariants.length) {
      return res.status(400).json({
        error: 'No enabled variants found on this product',
      });
    }

    // 4) Build enriched options for UI (Colors/Sizes), but only keep values that
    // actually occur in an enabled variant. IMPORTANT: preserve Printify's hex colors.
    const optionDefs = Array.isArray(p.options) ? p.options : [];
    const enabledOptionValueIds = new Set(
      enabledVariants.flatMap((v) =>
        Array.isArray(v.options_array) ? v.options_array : []
      )
    );

    // helper: is a valid hex color
    const isHex = (s) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s || ''));

    const enrichedOptions = optionDefs.map((opt) => {
      const values = Array.isArray(opt?.values) ? opt.values : [];

      const filteredValues = values
        .filter((val) => enabledOptionValueIds.has(val.id)) // only values present on enabled variants
        .map((val) => {
          const rawColors = Array.isArray(val?.colors) ? val.colors : [];
          const hexColors = rawColors.filter(isHex);

          const nameTokens = new Set();
          enabledVariants.forEach((v) => {
            if (
              Array.isArray(v.options_array) &&
              v.options_array.includes(val.id) &&
              v.color
            ) {
              nameTokens.add(String(v.color));
            }
          });

          return {
            // spread FIRST so any existing fields are kept,
            // then override to guarantee hexes are used
            ...val,
            id: val.id,
            title: val.title,
            colors: hexColors, // keep hex list here
            hex_colors: hexColors, // mirror for redundancy
            name_tokens: Array.from(nameTokens),
          };
        });

      return { ...opt, values: filteredValues };
    });

    // 5) Stripe product
    let sp;
    try {
      sp = await stripeFromSecret().products.create({
        name: titleOverride || p.title || 'Merch',
        active: !!active,
        images: productImages
          .slice(0, 8)
          .map((i) => i?.src)
          .filter(Boolean),
        metadata: {
          printify_product_id: String(p.id),
          print_provider_id: String(p.print_provider_id || ''),
          blueprint_id: String(p.blueprint_id || ''),
        },
      });
    } catch (e) {
      const detail = e?.raw || e?.message || e;
      console.error(`[${where}] Stripe product create failed`, detail);
      return res
        .status(500)
        .json({ error: 'Stripe product create failed', detail });
    }

    // 6) Stripe prices (guard unit_amount)
    const stripe = stripeFromSecret();
    const stripePriceIds = {};
    for (const v of enabledVariants) {
      const cents = Number(v.printifyPriceCents);
      if (!Number.isFinite(cents) || cents < 50) {
        console.warn(
          `[${where}] skipping variant without valid price`,
          v.id,
          cents
        );
        continue; // don’t try to create $0 prices
      }
      try {
        const price = await stripe.prices.create({
          currency: 'usd',
          unit_amount: Math.round(cents),
          product: sp.id,
          nickname: v.title || undefined,
          metadata: {
            variantId: v.id,
            printify_variant_id: v.id,
            printify_sku: v.sku || '',
            variant_title: v.title || '',
          },
        });
        stripePriceIds[v.id] = {
          priceId: price.id,
          unitAmount: price.unit_amount,
        };
        // carry on the inline id for convenience
        v.stripePriceId = price.id;
      } catch (e) {
        const detail = e?.raw || e?.message || e;
        console.error(
          `[${where}] Stripe price create failed for variant ${v.id}`,
          detail
        );
        // don’t fail the whole ingest; just skip the bad variant
      }
    }

    // 7) Compute min price among variants we actually priced
    const pricedCents = Object.values(stripePriceIds).map((o) =>
      Number(o.unitAmount)
    );
    const minPriceCents = pricedCents.length ? Math.min(...pricedCents) : null;

    // 8) Determine preview
    const preview =
      productImages.find((i) => i?.is_default) || productImages[0] || null;

    // 9) Build Firestore payload
    const merchDoc = {
      id: String(p.id),
      title: p.title || '',
      description: p.description || '',
      images: productImages.map((img) => ({ ...img, displayInGallery: true })),
      previewImage: preview?.src || '',
      tags: Array.isArray(p.tags) ? p.tags : [],
      visible: !!p.visible,

      stripeProductId: sp.id,
      stripePriceIds, // map: variantId -> { priceId, unitAmount }
      variants: enabledVariants, // enriched (some may not have stripePriceId if skipped)

      options: enrichedOptions, // filtered to only enabled/used values
      minPriceCents,

      status: active ? 'active' : 'inactive',
      printify: {
        productId: String(p.id),
        blueprint_id: p.blueprint_id || null,
        print_provider_id: p.print_provider_id || null,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection('merchProducts')
      .doc(String(p.id))
      .set(merchDoc, { merge: true });
    return res.json({ ok: true, merchProduct: merchDoc });
  } catch (e) {
    const detail = e?.response?.data || e?.message || e;
    console.error('[admin/merch/ingest] unhandled error', detail);
    return res
      .status(500)
      .json({ error: 'Failed to ingest Printify product', detail });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Admin — HARD DELETE a product (Firestore + Stripe [+ Printify for merch])
app.post('/admin/hard-delete', async (req, res) => {
  const { productId, source = 'merchProducts' } = req.body || {};
  if (!productId) return res.status(400).json({ error: 'productId required' });
  if (!['merchProducts', 'products'].includes(source)) {
    return res
      .status(400)
      .json({ error: 'source must be "merchProducts" or "products"' });
  }

  try {
    const stripe = stripeLib(STRIPE_SECRET_KEY.value());
    const shopId = PRINTIFY_SHOP_ID.value();
    const apiKey = PRINTIFY_API_KEY.value();

    // 1) Read the doc
    const colRef = db.collection(source);
    const snap = await colRef.doc(productId).get();
    if (!snap.exists) {
      // If already gone, do nothing
      return res.json({
        ok: true,
        message: 'Doc not found; nothing to delete.',
      });
    }
    const doc = snap.data();

    // 2) Stripe cleanup (if present)
    // Prefer explicit product id first, else try to find from any price
    const stripeProductId = doc.stripeProductId || null;

    if (stripeProductId) {
      try {
        // List prices for the product and delete them
        const prices = await stripe.prices.list({
          product: stripeProductId,
          limit: 100,
        });
        for (const price of prices.data) {
          try {
            await stripe.prices.update(price.id, { active: false });
            await stripe.prices.del(price.id);
          } catch (e) {
            // Not all prices can be deleted (some might be used in payments); make inactive at least
            try {
              await stripe.prices.update(price.id, { active: false });
            } catch {}
          }
        }
        // Deactivate then delete the product
        try {
          await stripe.products.update(stripeProductId, { active: false });
        } catch {}
        try {
          await stripe.products.del(stripeProductId);
        } catch (e) {
          // If deletion fails (e.g. already used), at least leave it inactive
        }
      } catch (e) {
        console.warn('⚠️ Stripe cleanup warning:', e?.message || e);
      }
    }

    // 3) Printify cleanup (merch only) — best-effort
    if (source === 'merchProducts') {
      try {
        await axios.delete(
          `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
      } catch (e) {
        // If it 404s or the API forbids delete, just ignore.
        const code = e?.response?.status;
        if (code && code !== 404) {
          console.warn(
            '⚠️ Printify delete warning:',
            code,
            e?.response?.data || e.message
          );
        }
      }
    }

    // 4) Firestore: delete document
    await colRef.doc(productId).delete();

    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ Hard delete failed:', err?.response?.data || err);
    return res.status(500).json({ error: 'Hard delete failed' });
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

        await db
          .collection('merchProducts')
          .doc(p.id)
          .set(
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
        console.error(
          'Refresh single product failed',
          item?.id,
          e?.response?.data || e
        );
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
      return res
        .status(500)
        .json({ error: 'Server misconfiguration (stripe key).' });
    }
    if (!clientUrlRaw) {
      console.error('❌ Missing CLIENT_URL secret');
      return res
        .status(500)
        .json({ error: 'Server misconfiguration (client url).' });
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
      billingAddress, // not used here, but keep for parity
    } = req.body || {};

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty cart.' });
    }

    // Persist snapshot for webhook matching
    const guestToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await db
      .collection('pending_checkouts')
      .doc(guestToken)
      .set({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        products,
        userId: userId || 'guest',
      });

    // Build Stripe line_items from your cart
    const lineItems = [];
    for (const p of products) {
      const isMerch = p?.category === 'merch';
      const cfg = p?.config || {};
      const unitAmount = Math.round(Number(p?.price || 0) * 100);
      if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
        console.error('❌ Bad unit_amount for product:', p);
        return res.status(400).json({ error: 'Invalid item price.' });
      }
      const images =
        typeof p?.image === 'string' && /^https?:\/\//i.test(p.image)
          ? [p.image]
          : [];

      if (isMerch) {
        const color = String(
          cfg.colorName || cfg.color || cfg.Colors || ''
        ).trim();
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
        const a = cfg;
        const descParts = [
          a.size ? `Size: ${a.size}"` : '',
          a.depth ? `Depth: ${a.depth}"` : '',
          a.lugQuantity ? `${a.lugQuantity} Lugs` : '',
          a.staveQuantity ? `${a.staveQuantity} Staves` : '',
          typeof a.reRing !== 'undefined'
            ? a.reRing
              ? 'Re-Rings'
              : 'No Re-Rings'
            : '',
          a.hardwareColor ? `Hardware: ${a.hardwareColor}` : '',
        ].filter(Boolean);

        lineItems.push({
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: p?.name || 'Ober Artisan Product',
              ...(images.length ? { images } : {}),
              ...(descParts.length
                ? { description: descParts.join(' • ') }
                : {}),
            },
          },
          quantity: Math.max(1, parseInt(p?.quantity || 1, 10)),
        });
      }
    }

    // Base session params
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
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
    };

    if (customerEmail && /\S+@\S+\.\S+/.test(customerEmail)) {
      sessionParams.customer_email = customerEmail;
    }

    // ── Shipping rules
    const subtotalCents = products.reduce((sum, p) => {
      const qty = Math.max(1, parseInt(p?.quantity || 1, 10));
      const priceCents = Math.round(Number(p?.price || 0) * 100);
      return sum + (Number.isFinite(priceCents) ? priceCents * qty : 0);
    }, 0);

    const FREE_THRESHOLD = 7500; // $75.00
    const FALLBACK_UNDER75 = 999; // $9.99 when we can't live-quote
    const fallbackUnder75Option = {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: FALLBACK_UNDER75, currency: 'usd' },
        display_name: 'Standard',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 7 },
          maximum: { unit: 'business_day', value: 10 },
        },
      },
    };

    if (subtotalCents >= FREE_THRESHOLD) {
      // ✅ Free shipping for qualifying carts
      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Standard',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 7 },
              maximum: { unit: 'business_day', value: 10 },
            },
          },
        },
      ];
    } else {
      // < $75 → try live Printify quote, otherwise non-zero fallback
      const hasAddress =
        !!(shippingAddress && shippingAddress.country) &&
        !!(
          shippingAddress.postal_code ||
          shippingAddress.postalCode ||
          shippingAddress.zip
        );

      if (!hasAddress) {
        // No address yet: don't show $0
        sessionParams.shipping_options = [fallbackUnder75Option];
      } else {
        try {
          const shopId = PRINTIFY_SHOP_ID.value();
          const payload = {
            line_items: toPrintifyLineItems(products),
            address_to: toPrintifyAddress(
              shippingAddress || {},
              firstName || 'Customer',
              lastName || ''
            ),
          };
          const { data: rates } = await axios.post(
            `https://api.printify.com/v1/shops/${shopId}/orders/shipping.json`,
            payload,
            { headers: pHeaders() }
          );

          const shipping_options = mapRatesToStripeOptions(rates, 'usd');
          sessionParams.shipping_options = shipping_options.length
            ? shipping_options
            : [fallbackUnder75Option];
        } catch (e) {
          console.warn(
            '⚠️ Printify quote failed; using fallback:',
            e?.response?.data || e?.message || e
          );
          sessionParams.shipping_options = [fallbackUnder75Option];
        }
      }
    }

    // Create session
    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    const msg =
      err?.raw?.message ||
      err?.message ||
      'Unknown error creating checkout session';
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
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: { secret: RECAPTCHA_SECRET_KEY.value(), response: token },
      }
    );
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

// ───────────────────────────────────────────────────────────────────────────────
// Stripe webhook app (raw body)
const stripeWebhookApp = express();
stripeWebhookApp.use(express.raw({ type: 'application/json' }));

function parseTitleColorSize(title) {
  if (!title || typeof title !== 'string') return { color: '', size: '' };
  const parts = title
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 2) return { color: parts[0], size: parts[1] };
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
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ['data.price.product'],
        }
      );

      const existing = await db
        .collection('orders')
        .where('stripeSessionId', '==', session.id)
        .limit(1)
        .get();
      if (!existing.empty)
        return res.status(200).send('Order already recorded for this session.');

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
        const pImages = Array.isArray(productObj?.images)
          ? productObj.images
          : [];

        let matched =
          (Array.isArray(snapshotProducts) ? snapshotProducts : []).find(
            (p) => p.stripePriceId && p.stripePriceId === priceId
          ) ||
          (Array.isArray(snapshotProducts) ? snapshotProducts : []).find(
            (p) =>
              !p.stripePriceId &&
              Math.round(Number(p.price || 0) * 100) === unitAmount
          );

        let stripePriceMeta = { variantId: '', title: '', sku: '' };
        try {
          if (priceId) {
            const priceObj = await stripe.prices.retrieve(priceId);
            const md = priceObj?.metadata || {};
            stripePriceMeta.variantId =
              md.variantId || md.printify_variant_id || '';
            stripePriceMeta.title = md.title || md.variant_title || '';
            stripePriceMeta.sku = md.sku || md.printify_sku || '';
          }
        } catch (e) {
          console.warn(
            '⚠️ Could not retrieve Stripe Price metadata for',
            priceId,
            e.message
          );
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
          variant.variantId =
            variant.variantId || (cfg.variantId ? String(cfg.variantId) : '');
          variant.size =
            variant.size || cfg.sizeName || cfg.size || cfg.Sizes || '';
          variant.color =
            variant.color || cfg.colorName || cfg.color || cfg.Colors || '';
        } else if (matched) {
          const cfg = matched.config || {};
          variant = {
            ...variant,
            size: variant.size || cfg.size || '',
            color: variant.color || cfg.hardwareColor || '',
            lugQuantity: cfg.lugQuantity || '',
            staveQuantity: cfg.staveQuantity || '',
            depth: cfg.depth || '',
            reRing:
              typeof cfg.reRing !== 'undefined'
                ? cfg.reRing
                  ? 'Yes'
                  : 'No'
                : '',
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
        const finalName =
          matched?.name || productObj?.name || li.description || 'Ober Product';
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
        cardDetails = {
          brand: pm.card.brand || '',
          lastFour: pm.card.last4 || '',
        };
      }
      const paymentMethodDetails =
        paymentMethodType && pm && pm[paymentMethodType]
          ? pm[paymentMethodType]
          : null;

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
        promoCode: session.total_details?.amount_discount
          ? session.discounts?.[0]?.promotion_code || ''
          : '',
      };

      await db.collection('orders').doc(orderId).set(orderDoc);
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
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(raw, 'utf8')
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(receivedSignature),
    Buffer.from(expectedSignature)
  );
  if (!isValid) return res.status(401).send('Invalid signature');

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

// ───────────────────────────────────────────────────────────────────────────────
// Shipping — live Printify quote (returns exact rates for the given address/ZIP)
app.post('/shipping/printify/quote', async (req, res) => {
  try {
    const shopId = PRINTIFY_SHOP_ID.value();
    if (!shopId || !PRINTIFY_API_KEY.value()) {
      return res
        .status(500)
        .json({ error: 'Printify credentials not available' });
    }

    const { line_items, address_to, products, shippingAddress } =
      req.body || {};
    const payload = {
      line_items:
        Array.isArray(line_items) && line_items.length
          ? line_items
          : toPrintifyLineItems(products || []),
      address_to: address_to || toPrintifyAddress(shippingAddress || {}),
    };

    if (!Array.isArray(payload.line_items) || !payload.line_items.length) {
      return res.status(400).json({ error: 'Missing or empty line_items' });
    }
    if (!payload.address_to?.country || !payload.address_to?.zip) {
      return res
        .status(400)
        .json({ error: 'address_to must include country and zip' });
    }

    const { data } = await axios.post(
      `https://api.printify.com/v1/shops/${shopId}/orders/shipping.json`,
      payload,
      { headers: pHeaders() }
    );

    return res.json(data);
  } catch (e) {
    const detail = e?.response?.data || e?.message || e;
    console.error('❌ /shipping/printify/quote error:', detail);
    return res.status(502).json({ error: 'Failed to fetch shipping rates' });
  }
});

const handlePrintifyProductPublished = async (productId) => {
  try {
    const shopId = PRINTIFY_SHOP_ID.value();
    const apiKey = PRINTIFY_API_KEY.value();
    const stripe = stripeLib(STRIPE_SECRET_KEY.value());

    // Fetch product
    const { data: product } = await axios.get(
      `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!product || !product.id) return;

    // Variant meta describes readable option values per variant id
    const { data: variantMeta } = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${product.blueprint_id}/print_providers/${product.print_provider_id}/variants.json`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const metaById = new Map();
    (Array.isArray(variantMeta) ? variantMeta : []).forEach((m) =>
      metaById.set(m.id, m)
    );

    // Enrich variants
    const enrichedVariants = (product.variants || []).map((v) => {
      const m = metaById.get(v.id) || {};
      const optHuman = (m.options || []).reduce((acc, opt) => {
        acc[(opt.name || '').toLowerCase()] = opt.value;
        return acc;
      }, {});
      const vImages = (product.images || []).filter(
        (img) =>
          Array.isArray(img.variant_ids) && img.variant_ids.includes(v.id)
      );
      return {
        id: String(v.id),
        title: v.title || '',
        sku: v.sku || '',
        price: v.price,
        printifyPriceCents: Number(v.price || 0),
        quantity: v.quantity,
        is_enabled: !!v.is_enabled,
        is_available: v.is_available !== false,
        options: Array.isArray(v.options) ? v.options.slice() : [],
        options_array: Array.isArray(v.options) ? v.options.slice() : [],
        size: optHuman.size || '',
        color: optHuman.color || '',
        images: vImages.map((img) => ({
          src: img.src,
          position: img.position,
          displayInGallery: true,
        })),
      };
    });

    const enabled = enrichedVariants.filter((v) => v.is_enabled);

    const isHex = (s) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s || ''));

    const enrichedOptions = (product.options || []).map((opt) => {
      const values = (opt.values || []).map((val) => {
        const rawColors = Array.isArray(val?.colors) ? val.colors : [];
        const hexColors = rawColors.filter(isHex);

        const nameTokens = new Set();
        enabled.forEach((v) => {
          if (
            Array.isArray(v.options) &&
            v.options.includes(val.id) &&
            v.color
          ) {
            nameTokens.add(String(v.color));
          }
        });

        return {
          ...val,
          id: val.id,
          title: val.title,
          colors: hexColors,
          hex_colors: hexColors,
          name_tokens: Array.from(nameTokens),
        };
      });

      return { ...opt, values };
    });

    const stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description || '',
      images: product.images?.[0]?.src ? [product.images[0].src] : [],
      metadata: {
        printify_product_id: product.id,
        blueprint_id: String(product.blueprint_id || ''),
        print_provider_id: String(product.print_provider_id || ''),
      },
    });

    const stripePriceIds = {};
    for (const v of enabled) {
      const price = await stripe.prices.create({
        currency: 'usd',
        unit_amount: Number(v.printifyPriceCents) || 0,
        product: stripeProduct.id,
        nickname: v.title || undefined,
        metadata: {
          printify_variant_id: v.id,
          printify_sku: v.sku || '',
          variant_title: v.title || '',
        },
      });
      v.stripePriceId = price.id;
      stripePriceIds[v.id] = {
        priceId: price.id,
        unitAmount: price.unit_amount,
      };
    }

    const minPriceCents = enabled.reduce((min, v) => {
      const cents = Number(v.printifyPriceCents || 0);
      return min === null ? cents : Math.min(min, cents);
    }, null);

    const payload = {
      id: product.id,
      title: product.title,
      description: product.description || '',
      images: (product.images || []).map((img) => ({
        ...img,
        displayInGallery: true,
      })),
      previewImage: (product.images || [])[0]?.src || '',
      tags: product.tags || [],
      visible: !!product.visible,

      variants: enabled,
      options: enrichedOptions,
      stripeProductId: stripeProduct.id,
      stripePriceIds,
      minPriceCents,

      status: 'active',
      printify: {
        productId: product.id,
        blueprint_id: product.blueprint_id || null,
        print_provider_id: product.print_provider_id || null,
      },
      syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db
      .collection('merchProducts')
      .doc(productId)
      .set(payload, { merge: true });
  } catch (error) {
    console.error(
      '❌ Failed to sync Printify product:',
      error?.response?.data || error
    );
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

exports.autoReplyInquiry = onDocumentCreated(
  {
    document: 'inquiries/{docId}',
    region: 'us-central1',
    secrets: [
      GMAIL_CLIENT_EMAIL,
      GMAIL_PRIVATE_KEY,
      GMAIL_SENDER,
      GMAIL_IMPERSONATE,
    ],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data?.email) return;

    const html = emailShell({
      logo: LOGO_MAIN,
      bodyHtml: bodySupport(data.firstName || data.name),
    });

    try {
      await gmailSend({
        to: data.email,
        subject: "We've Received Your Message",
        html,
        fromEmail: 'support@oberartisandrums.com',
        replyTo: 'support@oberartisandrums.com',
        bcc: ['support@oberartisandrums.com'],
      });
    } catch (error) {
      console.error('autoReplyInquiry (gmail) failed:', error);
    }
  }
);

exports.autoReplySoundlegend = onDocumentCreated(
  {
    document: 'soundlegend_submissions/{docId}',
    region: 'us-central1',
    secrets: [
      GMAIL_CLIENT_EMAIL,
      GMAIL_PRIVATE_KEY,
      GMAIL_SENDER,
      GMAIL_IMPERSONATE,
    ],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data?.email) return;

    const html = emailShell({
      logo: LOGO_SL,
      bodyHtml: bodySoundLegend(data.firstName || data.name),
    });

    try {
      await gmailSend({
        to: data.email,
        subject: 'Welcome to the SoundLegend Experience',
        html,
        fromEmail: 'soundlegend@oberartisandrums.com',
        replyTo: 'soundlegend@oberartisandrums.com',
        bcc: ['soundlegend@oberartisandrums.com'],
      });
    } catch (error) {
      console.error('autoReplySoundlegend (gmail) failed:', error);
    }
  }
);

exports.autoReplyEndorsement = onDocumentCreated(
  {
    document: 'endorsement_applications/{docId}',
    region: 'us-central1',
    secrets: [
      GMAIL_CLIENT_EMAIL,
      GMAIL_PRIVATE_KEY,
      GMAIL_SENDER,
      GMAIL_IMPERSONATE,
    ],
  },
  async (event) => {
    const id = event.params?.docId || event.params?.id || '';
    const data = event.data?.data();
    if (!data?.email) return;

    const html = emailShell({
      logo: LOGO_MAIN,
      bodyHtml: bodyEndorsement(
        data.fullName || data.name,
        id,
        data.tierInterest
      ),
    });

    try {
      await gmailSend({
        to: data.email,
        subject: 'Thanks for your Endorsement Application',
        html,
        fromEmail: 'endorsements@oberartisandrums.com',
        replyTo: 'endorsements@oberartisandrums.com',
        bcc: ['endorsements@oberartisandrums.com'],
      });
    } catch (err) {
      console.error('autoReplyEndorsement (gmail) failed:', err);
    }
  }
);

// Main API (same URL), but with more headroom for image work
exports.api = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 300,
    memory: '1GiB',
    maxInstances: 2,
    secrets: [
      STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET,
      CLIENT_URL,
      RECAPTCHA_SECRET_KEY,
      PRINTIFY_API_KEY,
      PRINTIFY_SHOP_ID,
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
  { region: 'us-central1', secrets: [PRINTIFY_API_KEY, PRINTIFY_SHOP_ID] },
  async (req, res) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin))
      res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(204).send('');
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

// ───────────────────────────────────────────────────────────────────────────────
// Resin Accent Generator — keep veneer color; fill only darkest pits
app.post('/resin/generate', async (req, res) => {
  let sharp;
  try {
    sharp = require('sharp');
  } catch (e) {
    console.error('Sharp failed to load:', e);
    return res.status(500).json({ error: 'Image engine unavailable' });
  }

  try {
    const {
      veneerDataUrl,
      hex = '#1aa7ff',
      intensity = 'medium', // 'light' | 'medium' | 'heavy'
      coverage = 0.45, // tiny nudge of selectivity
      size = 1536,
    } = req.body || {};

    if (
      !veneerDataUrl ||
      !/^data:image\/(png|jpe?g);base64,/.test(veneerDataUrl)
    ) {
      return res
        .status(400)
        .json({ error: 'Missing or invalid veneerDataUrl' });
    }

    // ~8 MB guard
    const approxBytes = Math.floor(veneerDataUrl.length * 0.75);
    if (approxBytes > 8 * 1024 * 1024) {
      return res
        .status(413)
        .json({ error: 'Input image too large (max ~8MB).' });
    }

    // Decode + normalize
    const b64 = veneerDataUrl.split(',')[1];
    const inputBuf = Buffer.from(b64, 'base64');

    const base = sharp(inputBuf).rotate().ensureAlpha();
    const meta = await base.metadata();
    const maxDim = Math.max(meta.width || 0, meta.height || 0) || size;
    const scale = Math.min(1, (size || maxDim) / maxDim);
    const w = Math.round((meta.width || size) * scale);
    const h = Math.round((meta.height || size) * scale);
    const img = base.resize({ width: w, height: h });

    // --- Luminance (no heavy global contrast) ---------------------------------
    const grayRaw = await img
      .clone()
      .greyscale()
      .gamma(1.0)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Pack to 1-channel PNG for sharp ops that need image objects
    const grayPNG = await sharp(grayRaw.data, {
      raw: {
        width: grayRaw.info.width,
        height: grayRaw.info.height,
        channels: 1,
      },
    })
      .png()
      .toBuffer();

    // --- Local darkness (black-hat): blur(gray, σ) - gray ----------------------
    const blurSigma = Math.max(2, Math.round(Math.max(w, h) / 220)); // scale with size
    const localMeanPNG = await sharp(grayPNG).blur(blurSigma).png().toBuffer();

    // delta = localMean - gray  (positive where pixel is darker than its neighborhood)
    const deltaRaw = await sharp(localMeanPNG)
      .composite([{ input: grayPNG, blend: 'subtract' }])
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Histogram of delta (0..255)
    const hist = new Uint32Array(256);
    const deltaData = deltaRaw.data;
    for (let i = 0; i < deltaData.length; i++) hist[deltaData[i]]++;

    // Select only the strongest local pits (quantile on tail)
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const baseFrac =
      intensity === 'light' ? 0.01 : intensity === 'heavy' ? 0.04 : 0.02; // 1–4%
    const frac = clamp(baseFrac + (coverage - 0.45) * 0.02, 0.005, 0.06);

    // Walk the histogram from bright → dark tail to find threshold
    const total = deltaData.length;
    let acc = 0,
      T = 255;
    for (let t = 255; t >= 0; t--) {
      acc += hist[t];
      if (acc / total >= frac) {
        T = t;
        break;
      }
    }

    // Build mask: (delta >= T) AND (original gray is reasonably dark)
    const maskBytes = Buffer.alloc(deltaData.length);
    const g = grayRaw.data;
    const darkGate = 180; // gate out light flats entirely
    let whiteCount = 0;
    for (let i = 0; i < deltaData.length; i++) {
      const isPit = deltaData[i] >= T && g[i] < darkGate;
      const v = isPit ? 255 : 0;
      maskBytes[i] = v;
      if (v === 255) whiteCount++;
    }

    // If the mask is still too big (>12%), tighten automatically
    const whiteRatio = whiteCount / deltaData.length;
    if (whiteRatio > 0.12) {
      // raise threshold by 10 levels and rebuild quickly
      const tightenBy = 10;
      for (let i = 0; i < deltaData.length; i++) {
        const isPit =
          deltaData[i] >= Math.min(255, T + tightenBy) && g[i] < darkGate;
        maskBytes[i] = isPit ? 255 : 0;
      }
    }

    // Clean & crisp edges -> just holes/knots
    const maskPNG = await sharp(maskBytes, {
      raw: {
        width: grayRaw.info.width,
        height: grayRaw.info.height,
        channels: 1,
      },
    })
      .median(1)
      .blur(0.6)
      .threshold(200) // binarize
      .png()
      .toBuffer();

    // --- Paint only masked pixels --------------------------------------------
    const { r, g: gg, b } = hexToRgbSafe(hex);
    const fillOpacity =
      intensity === 'light' ? 0.55 : intensity === 'heavy' ? 0.95 : 0.75;

    const fillPlate = await sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r, g: gg, b, alpha: fillOpacity },
      },
    })
      .png()
      .toBuffer();

    // Keep color only where mask == white
    const coloredPits = await sharp(fillPlate)
      .composite([{ input: maskPNG, blend: 'dest-in' }])
      .png()
      .toBuffer();

    // Compose over the original veneer (non-masked pixels are untouched)
    const outBuf = await img
      .clone()
      .composite([{ input: coloredPits, blend: 'over' }])
      .png()
      .toBuffer();

    const outB64 = `data:image/png;base64,${outBuf.toString('base64')}`;
    return res.json({
      ok: true,
      jobId: crypto.randomUUID(),
      resultDataUrl: outB64,
    });
  } catch (err) {
    console.error('❌ /resin/generate failed:', err?.message || err);
    return res.status(500).json({ error: 'Generation failed' });
  }
});

function hexToRgbSafe(hex) {
  const m = String(hex || '')
    .trim()
    .match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return { r: 26, g: 167, b: 255 };
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

exports.syncMerchVariantPrice = onCall(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET_KEY, PRINTIFY_API_KEY, PRINTIFY_SHOP_ID],
  },
  async (request) => {
    const ctx = request.auth;
    const email = ctx?.token?.email || '';
    const isAdminClaim =
      ctx?.token?.isAdmin === true || ctx?.token?.admin === true;

    // Simple allowlist (add any editors you trust)
    const ALLOW = new Set(['dan@oberartisandrums.com']);

    if (!(ctx && (isAdminClaim || ALLOW.has(email)))) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin privileges required.'
      );
    }

    const {
      productId,
      variantId,
      newPriceCents,
      currency = 'usd',
      stripeProductId,
      currentStripePriceId,   // not used (Stripe prices are immutable; we create a new one)
      printify = {},
    } = request.data || {};

    if (!productId || !variantId || !Number.isFinite(newPriceCents)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields.'
      );
    }

    const docRef = db.collection('merchProducts').doc(String(productId));
    const snap = await docRef.get();
    if (!snap.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Product does not exist.'
      );
    }
    const data = snap.data() || {};

    // ---------- Stripe: create a NEW price ----------
    const stripe = stripeLib(STRIPE_SECRET_KEY.value());
    const sProdId =
      stripeProductId ||
      data.stripeProductId ||
      (data.stripe && data.stripe.productId) ||
      data.stripe_product_id;

    if (!sProdId) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'No stripeProductId on this merch product.'
      );
    }

    // Build a friendly "Color / Size" label for this variant
    const toLabel = (v) => {
      if (!v) return '';
      const opts = Array.isArray(data.options) ? data.options : [];
      const parts = opts
        .map((opt) => {
          const match = (opt.values || []).find((val) =>
            (v.options || []).includes(val.id)
          );
          return match?.title || null;
        })
        .filter(Boolean);
      return parts.join(' / ');
    };

    // find the variant in the stored product (by id)
    const vObj =
      (Array.isArray(data.variants) &&
        data.variants.find((x) => String(x.id) === String(variantId))) ||
      null;

    const priceNickname = toLabel(vObj) || `Variant ${variantId}`;

    const price = await stripe.prices.create({
      unit_amount: Math.round(newPriceCents),
      currency,
      product: sProdId,
      nickname: priceNickname, // shows in Stripe "Description"
      metadata: {
        merchProductId: String(productId),
        variantId: String(variantId),
        description: priceNickname,
      },
    });

    // Update mapping { variantId -> { priceId, unitAmount } }
    const stripePriceIds = { ...(data.stripePriceIds || {}) };
    stripePriceIds[String(variantId)] = {
      priceId: price.id,
      unitAmount: price.unit_amount,
    };

    await docRef.update({
      stripePriceIds,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // ---------- Printify: update variant price (best-effort) ----------
    const shopId =
      printify.shopId ||
      data.printifyShopId ||
      data.printify_shop_id ||
      PRINTIFY_SHOP_ID.value();
    const pProductId =
      printify.productId ||
      data.printifyProductId ||
      data.printify_product_id ||
      (data.printify && data.printify.productId);
    const pVariantId = printify.variantId || String(variantId);

    let printifyResult = null;
    if (shopId && pProductId && pVariantId && PRINTIFY_API_KEY.value()) {
      try {
        await axios.put(
          `https://api.printify.com/v1/shops/${shopId}/products/${pProductId}/variants/${pVariantId}.json`,
          { price: Math.round(newPriceCents) },
          {
            headers: {
              Authorization: `Bearer ${PRINTIFY_API_KEY.value()}`,
              'Content-Type': 'application/json',
            },
          }
        );
        printifyResult = { ok: true };
      } catch (e) {
        const detail = e?.response?.data || e?.message || String(e);
        console.error('Printify update failed:', detail);
        printifyResult = { ok: false, detail };
      }
    }

    return {
      ok: true,
      stripePriceId: price.id,
      stripePriceNickname: priceNickname,
      printify: printifyResult,
    };
  }
);

exports.adminCreateUser = onCall({ region: 'us-central1' }, async (request) => {
  // Keep your existing handler body; if it referenced (data, context) before, use:
  const data = request.data;
  const context = request;

  // ... unchanged ...
});

// Safe-load generateDrumMockup so a missing/broken file won't crash startup
let generateDrumMockup;
try {
  ({ generateDrumMockup } = require('./generateDrumMockup'));
} catch (e) {
  console.warn('generateDrumMockup not loaded:', e?.message || e);
}
if (typeof generateDrumMockup === 'function') {
  exports.generateDrumMockup = generateDrumMockup;
}

exports.computeSoundPrism = onCall(
  { region: 'us-central1' },
  async (request) => {
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
  }
);

exports.notifyAdminNewEndorsement = onDocumentCreated(
  {
    document: 'endorsement_applications/{id}',
    region: 'us-central1',
    secrets: [
      GMAIL_CLIENT_EMAIL,
      GMAIL_PRIVATE_KEY,
      GMAIL_SENDER,
      GMAIL_IMPERSONATE,
    ],
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const docId = event.params?.id || '';
    const subject = 'New Endorsement Application Received';
    const lines = [
      `<strong>Name:</strong> ${data.fullName || ''}`,
      data.stageName ? `<strong>Stage:</strong> ${data.stageName}` : '',
      `<strong>Email:</strong> ${data.email || ''}`,
      data.tierInterest ? `<strong>Tier:</strong> ${data.tierInterest}` : '',
      data.instagram ? `<strong>Instagram:</strong> ${data.instagram}` : '',
      data.youtube ? `<strong>YouTube:</strong> ${data.youtube}` : '',
      data.city || data.country
        ? `<strong>Location:</strong> ${[data.city, data.country].filter(Boolean).join(', ')}`
        : '',
      `<strong>Doc ID:</strong> ${docId}`,
    ].filter(Boolean);

    const html = `<div style="font-family:system-ui">
      <p>A new endorsement application was submitted.</p>
      <p>${lines.join('<br/>')}</p>
    </div>`;

    try {
      await gmailSend({
        to: 'dan@oberartisandrums.com',
        subject,
        html,
      });
    } catch (err) {
      console.error('notifyAdminNewEndorsement (gmail) failed:', err);
    }
  }
);
