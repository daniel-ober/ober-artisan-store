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
const { onDocumentWritten } = require('firebase-functions/v2/firestore');

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
const GMAIL_SENDER = defineSecret('GMAIL_SENDER');
const GMAIL_IMPERSONATE = defineSecret('GMAIL_IMPERSONATE');

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

function encodeRFC2047(str = '') {
  return /[^\x00-\x7F]/.test(str)
    ? `=?UTF-8?B?${Buffer.from(String(str), 'utf8').toString('base64')}?=`
    : String(str);
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
  fromEmail,
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

function normalizeLeadEmail(email = '') {
  return String(email || '').trim().toLowerCase();
}

function getLeadUserDocIdForEmail(email = '') {
  const normalized = normalizeLeadEmail(email);
  if (!normalized) return '';
  return `lead_${crypto
    .createHash('sha256')
    .update(normalized)
    .digest('hex')
    .slice(0, 24)}`;
}

async function findAllUserDocsByEmail(email = '') {
  const normalized = normalizeLeadEmail(email);
  if (!normalized) return [];

  const usersRef = db.collection('users');
  const seen = new Map();

  const snap1 = await usersRef.where('email', '==', normalized).get();
  snap1.docs.forEach((docSnap) => {
    seen.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  });

  const snap2 = await usersRef.where('email', '==', email).get();
  snap2.docs.forEach((docSnap) => {
    seen.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
  });

  return Array.from(seen.values());
}

async function findUserDocByEmail(email = '') {
  const matches = await findAllUserDocsByEmail(email);
  return matches[0] || null;
}

function scoreUserDocForCanonical(user = {}) {
  let score = 0;

  if (user.uid) score += 100;
  if (user.portalAccessGranted) score += 30;
  if (user.portalInviteSent) score += 20;
  if (user.authAccountCreated) score += 20;
  if (user.isSoundlegend) score += 15;
  if (user.soundlegendLead) score += 10;
  if (user.fullName) score += 5;
  if (user.isAdmin) score -= 1000;

  return score;
}

function mergeObjectsPreferPrimary(primary = {}, secondary = {}) {
  const merged = { ...primary };

  Object.entries(secondary || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      const existing = Array.isArray(merged[key]) ? merged[key] : [];
      merged[key] = Array.from(new Set([...existing, ...value].filter(Boolean)));
      return;
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Date) &&
      !value._seconds &&
      !value.seconds
    ) {
      merged[key] = {
        ...(typeof merged[key] === 'object' && merged[key] !== null
          ? merged[key]
          : {}),
        ...value,
      };
      return;
    }

    if (
      merged[key] === undefined ||
      merged[key] === null ||
      merged[key] === '' ||
      merged[key] === false
    ) {
      merged[key] = value;
    }
  });

  return merged;
}

async function mergeUserDocsIntoCanonical({
  canonicalId,
  email = '',
  patch = {},
}) {
  if (!canonicalId) {
    throw new Error('canonicalId is required');
  }

  const normalizedEmail = normalizeLeadEmail(email || patch.email || '');
  const allMatches = normalizedEmail
    ? await findAllUserDocsByEmail(normalizedEmail)
    : [];

  const canonicalRef = db.collection('users').doc(canonicalId);
  const canonicalSnap = await canonicalRef.get();
  const canonicalData = canonicalSnap.exists ? canonicalSnap.data() || {} : {};

  const sortedMatches = [...allMatches].sort(
    (a, b) => scoreUserDocForCanonical(b) - scoreUserDocForCanonical(a)
  );

  let merged = { ...canonicalData };

  sortedMatches.forEach((entry) => {
    merged = mergeObjectsPreferPrimary(merged, entry);
  });

  merged = {
    ...merged,
    ...patch,
    uid: patch.uid ?? merged.uid ?? '',
    email: normalizedEmail || merged.email || '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (!canonicalSnap.exists) {
    merged.createdAt =
      merged.createdAt || admin.firestore.FieldValue.serverTimestamp();
  }

  await canonicalRef.set(merged, { merge: true });

  for (const match of allMatches) {
    if (match.id !== canonicalId) {
      await db.collection('users').doc(match.id).delete().catch(() => {});
    }
  }

  return canonicalId;
}

async function resolveCanonicalUserDoc({ userId = '', email = '' } = {}) {
  if (userId) {
    const explicitSnap = await db.collection('users').doc(userId).get();
    if (explicitSnap.exists) {
      return { id: explicitSnap.id, ...explicitSnap.data() };
    }
  }

  const matches = await findAllUserDocsByEmail(email);
  if (!matches.length) return null;

  const sorted = [...matches].sort(
    (a, b) => scoreUserDocForCanonical(b) - scoreUserDocForCanonical(a)
  );

  return sorted[0];
}

async function upsertSoundlegendLeadUserFromSubmission(
  submissionId,
  data = {}
) {
  const normalizedEmail = normalizeLeadEmail(data.email);
  if (!normalizedEmail) return null;

  const firstName = String(data.firstName || '').trim();
  const lastName = String(data.lastName || '').trim();
  const fullName =
    String(data.fullName || '').trim() || `${firstName} ${lastName}`.trim();

  const existing = await resolveCanonicalUserDoc({ email: normalizedEmail });
  const canonicalId =
    existing?.uid || existing?.id || getLeadUserDocIdForEmail(normalizedEmail);

  const alreadyHasPortalAccess = existing?.portalAccessGranted === true;
  const existingInviteSent = existing?.portalInviteSent === true;
  const existingUid = existing?.uid || '';

  await mergeUserDocsIntoCanonical({
    canonicalId,
    email: normalizedEmail,
    patch: {
      uid: existingUid || '',
      firstName,
      lastName,
      fullName,
      email: normalizedEmail,
      phone: data.phone || '',
      phoneE164: data.phoneE164 || '',
      isSoundlegend: true,
      isAdmin: false,
      soundlegendLead: true,
      soundlegendLeadStatus: data.questionnaireCompleted
        ? 'questionnaire_complete'
        : 'questionnaire_pending',
      slPortalLocked: alreadyHasPortalAccess ? false : true,
      portalAccessGranted: alreadyHasPortalAccess,
      portalInviteSent: existingInviteSent,
      portalStatus: alreadyHasPortalAccess ? 'active' : 'locked',
      authAccountCreated: !!existingUid,
      authInvitePending: !alreadyHasPortalAccess,
      latestQuestionnaireToken: data.questionnaireToken || '',
      latestQuestionnaireUrl: data.questionnaireUrl || '',
      questionnaireCompleted: !!data.questionnaireCompleted,
      consultationScheduled: !!data.consultationScheduled,
      consultationCompleted: !!data.consultationCompleted,
      linkedSubmissionId: submissionId,
      latestSoundlegendSubmissionId: submissionId,
      access: {
        soundlegend: alreadyHasPortalAccess,
      },
      status: existing?.status || 'lead',
    },
  });

  return canonicalId;
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

app.get('/', (_req, res) => res.status(200).send('ok'));

const stripeFromSecret = () => stripeLib(STRIPE_SECRET_KEY.value());
const pHeaders = () => ({
  Authorization: `Bearer ${PRINTIFY_API_KEY.value()}`,
  'Content-Type': 'application/json',
});

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

// ---------- SoundLegend: mirror project.publicPrefs -> soundlegend_showroom/{serial}
function getSerialFromProject(p = {}) {
  return (
    p.lineSerial || p.globalSerial || p.serial || p.soundlegendSerial || null
  );
}

function computePublicSnapshot(project = {}) {
  const prefs = project.publicPrefs || {};
  const showName = !!prefs.showName;
  const showStory = !!prefs.showStory;

  const baseName =
    (prefs.displayName && String(prefs.displayName).trim()) ||
    project?.customer?.name ||
    null;

  const name = showName ? baseName || 'Anonymous Legend' : 'Anonymous Legend';
  const storyHtml = showStory
    ? (typeof prefs.storyHtml === 'string' && prefs.storyHtml.trim()) ||
      '<p>Legacy Unknown.</p>'
    : '<p>Legacy is set to Private.</p>';

  return {
    publicPrefs: {
      showName,
      showStory,
      displayName: prefs.displayName || null,
      storyHtml: prefs.storyHtml || null,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    },
    publicDisplay: {
      name,
      storyHtml,
    },
    meta: {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
  };
}

exports.mirrorPublicPrefsToShowroom = onDocumentWritten(
  { document: 'projects/{projectId}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return;

    const changed =
      !before ||
      JSON.stringify(before.publicPrefs || {}) !==
        JSON.stringify(after.publicPrefs || {});
    if (!changed) return;

    const serial = getSerialFromProject(after);
    if (!serial) {
      console.warn(
        'mirrorPublicPrefsToShowroom: missing serial on project',
        event.params.projectId
      );
      return;
    }

    const payload = computePublicSnapshot(after);
    await db
      .collection('soundlegend_showroom')
      .doc(serial)
      .set(payload, { merge: true });
  }
);

// ───────────────────────────────────────────────────────────────────────────────
// Admin — list Printify products for picker
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

    let variantMeta = [];
    try {
      const { data } = await axios.get(
        `https://api.printify.com/v1/catalog/blueprints/${p.blueprint_id}/print_providers/${p.print_provider_id}/variants.json`,
        { headers: pHeaders() }
      );
      variantMeta = Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn(
        `[${where}] variant meta fetch warning`,
        e?.response?.data || e?.message
      );
    }

    const metaById = new Map();
    variantMeta.forEach((m) => metaById.set(m.id, m));

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

    const productImages = Array.isArray(p.images) ? p.images : [];
    const rawVariants = Array.isArray(p.variants) ? p.variants : [];

    const enrichedVariants = rawVariants.map((v) => {
      const mid = Number(v?.id);
      const m = metaById.get(mid) || null;

      const vImages = productImages.filter(
        (img) =>
          Array.isArray(img?.variant_ids) && img.variant_ids.includes(mid)
      );

      const readable = readableFromMeta(m);

      return {
        id: String(v?.id ?? ''),
        title: String(v?.title || ''),
        sku: String(v?.sku || ''),
        printifyPriceCents: Number.isFinite(Number(v?.price))
          ? Number(v.price)
          : null,
        quantity: Number.isFinite(Number(v?.quantity)) ? Number(v.quantity) : 0,
        is_enabled: !!v?.is_enabled,
        is_available: v?.is_available !== false,
        options_array: Array.isArray(v?.options) ? v.options : [],
        size: readable.size,
        color: readable.color,
        images: vImages.map((img) => ({
          src: img?.src || '',
          position: img?.position || '',
          displayInGallery: true,
        })),
      };
    });

    const enabledVariants = enrichedVariants.filter(
      (v) => v.is_enabled && v.is_available
    );

    if (!enabledVariants.length) {
      return res.status(400).json({
        error: 'No enabled variants found on this product',
      });
    }

    const optionDefs = Array.isArray(p.options) ? p.options : [];
    const enabledOptionValueIds = new Set(
      enabledVariants.flatMap((v) =>
        Array.isArray(v.options_array) ? v.options_array : []
      )
    );

    const isHex = (s) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(s || ''));

    const enrichedOptions = optionDefs.map((opt) => {
      const values = Array.isArray(opt?.values) ? opt.values : [];

      const filteredValues = values
        .filter((val) => enabledOptionValueIds.has(val.id))
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
            ...val,
            id: val.id,
            title: val.title,
            colors: hexColors,
            hex_colors: hexColors,
            name_tokens: Array.from(nameTokens),
          };
        });

      return { ...opt, values: filteredValues };
    });

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
        continue;
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
        v.stripePriceId = price.id;
      } catch (e) {
        const detail = e?.raw || e?.message || e;
        console.error(
          `[${where}] Stripe price create failed for variant ${v.id}`,
          detail
        );
      }
    }

    const pricedCents = Object.values(stripePriceIds).map((o) =>
      Number(o.unitAmount)
    );
    const minPriceCents = pricedCents.length ? Math.min(...pricedCents) : null;
    const preview =
      productImages.find((i) => i?.is_default) || productImages[0] || null;

    const merchDoc = {
      id: String(p.id),
      title: p.title || '',
      description: p.description || '',
      images: productImages.map((img) => ({ ...img, displayInGallery: true })),
      previewImage: preview?.src || '',
      tags: Array.isArray(p.tags) ? p.tags : [],
      visible: !!p.visible,

      stripeProductId: sp.id,
      stripePriceIds,
      variants: enabledVariants,
      options: enrichedOptions,
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

    const colRef = db.collection(source);
    const snap = await colRef.doc(productId).get();
    if (!snap.exists) {
      return res.json({
        ok: true,
        message: 'Doc not found; nothing to delete.',
      });
    }
    const doc = snap.data();

    const stripeProductId = doc.stripeProductId || null;

    if (stripeProductId) {
      try {
        const prices = await stripe.prices.list({
          product: stripeProductId,
          limit: 100,
        });
        for (const price of prices.data) {
          try {
            await stripe.prices.update(price.id, { active: false });
            await stripe.prices.del(price.id);
          } catch (e) {
            try {
              await stripe.prices.update(price.id, { active: false });
            } catch {}
          }
        }
        try {
          await stripe.products.update(stripeProductId, { active: false });
        } catch {}
        try {
          await stripe.products.del(stripeProductId);
        } catch (e) {}
      } catch (e) {
        console.warn('⚠️ Stripe cleanup warning:', e?.message || e);
      }
    }

    if (source === 'merchProducts') {
      try {
        await axios.delete(
          `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
          { headers: { Authorization: `Bearer ${apiKey}` } }
        );
      } catch (e) {
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

    await colRef.doc(productId).delete();

    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ Hard delete failed:', err?.response?.data || err);
    return res.status(500).json({ error: 'Hard delete failed' });
  }
});

// NEW: Admin — manual stock refresh
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
// Existing endpoints
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
      shipping_address_collection: { allowed_countries: ['US'] },
    };

    if (customerEmail && /\S+@\S+\.\S+/.test(customerEmail)) {
      sessionParams.customer_email = customerEmail;
    }

    const subtotalCents = products.reduce((sum, p) => {
      const qty = Math.max(1, parseInt(p?.quantity || 1, 10));
      const priceCents = Math.round(Number(p?.price || 0) * 100);
      return sum + (Number.isFinite(priceCents) ? priceCents * qty : 0);
    }, 0);

    const FREE_THRESHOLD = 5000;
    const FALLBACK_UNDER50 = 999;

    const fallbackUnder50Option = {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: FALLBACK_UNDER50, currency: 'usd' },
        display_name: 'Standard',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 7 },
          maximum: { unit: 'business_day', value: 10 },
        },
      },
    };

    if (subtotalCents >= FREE_THRESHOLD) {
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
      const hasAddress =
        !!(shippingAddress && shippingAddress.country) &&
        !!(
          shippingAddress.postal_code ||
          shippingAddress.postalCode ||
          shippingAddress.zip
        );

      if (!hasAddress) {
        sessionParams.shipping_options = [fallbackUnder50Option];
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
            : [fallbackUnder50Option];
        } catch (e) {
          console.warn(
            '⚠️ Printify quote failed; using fallback:',
            e?.response?.data || e?.message || e
          );
          sessionParams.shipping_options = [fallbackUnder50Option];
        }
      }
    }

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
// Stripe webhook app (RAW body ONLY)
const stripeWebhookApp = express();

stripeWebhookApp.post('/', async (req, res) => {
  const stripe = stripeLib(STRIPE_SECRET_KEY.value());
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ Missing Stripe signature header');
    return res.status(400).send('Missing Stripe signature');
  }

  let payload = req.rawBody;
  if (!payload) payload = req.body;
  if (
    payload &&
    !(payload instanceof Buffer) &&
    payload instanceof Uint8Array
  ) {
    payload = Buffer.from(payload);
  }

  if (!Buffer.isBuffer(payload)) {
    console.error(
      '❌ Webhook payload is not a Buffer.',
      'typeof:',
      typeof payload,
      'constructor:',
      payload?.constructor?.name
    );
    return res.status(400).send('Webhook Error: Expected raw body Buffer');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      STRIPE_WEBHOOK_SECRET.value()
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const eventId = event.id;
  const eventType = event.type;
  const eventCreated = event.created ? new Date(event.created * 1000) : null;
  const livemode = !!event.livemode;

  const receiptRef = db.collection('stripe_webhook_events').doc(eventId);
  try {
    await receiptRef.set(
      {
        eventId,
        type: eventType,
        livemode,
        stripeCreatedAt: eventCreated,
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        processingStatus: 'received',
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('⚠️ Failed to write webhook receipt:', e?.message || e);
  }

  if (!eventType.startsWith('checkout.session.')) {
    try {
      await receiptRef.set(
        {
          processingStatus: 'ignored',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}
    return res.status(200).send('Ignored: non-checkout event');
  }

  const markProcessed = async (extra = {}) => {
    try {
      await receiptRef.set(
        {
          processingStatus: 'processed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          ...extra,
        },
        { merge: true }
      );
    } catch {}
  };

  const markFailed = async (err, extra = {}) => {
    try {
      await receiptRef.set(
        {
          processingStatus: 'failed',
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          errorMessage: err?.message || String(err),
          ...extra,
        },
        { merge: true }
      );
    } catch {}
  };

  try {
    const sessionBase = event.data.object;

    if (
      eventType === 'checkout.session.expired' ||
      eventType === 'checkout.session.async_payment_failed'
    ) {
      const sessionId = sessionBase?.id || '';
      let session = null;

      try {
        if (sessionId) {
          session = await stripe.checkout.sessions.retrieve(sessionId);
        }
      } catch (e) {
        console.warn(
          '⚠️ Failed to retrieve failed/expired session:',
          e?.message || e
        );
      }

      const email =
        session?.customer_details?.email ||
        session?.customer_email ||
        session?.metadata?.customerEmail ||
        '';

      const name =
        session?.customer_details?.name ||
        session?.metadata?.customerName ||
        'Customer';

      const failureDoc = {
        type: eventType,
        stripeEventId: eventId,
        stripeSessionId: sessionId,
        paymentStatus: session?.payment_status || '',
        status: session?.status || '',
        customerEmail: email,
        customerName: name,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        livemode,
      };

      await db.collection('checkout_failures').add(failureDoc);
      await markProcessed({ note: 'Recorded checkout failure/expiry.' });
      return res.status(200).send('Recorded checkout failure/expiry.');
    }

    const okTypes = new Set([
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
    ]);

    if (!okTypes.has(eventType)) {
      await markProcessed({ note: 'Unhandled checkout.session.* event.' });
      return res.status(200).send('Unhandled checkout.session.* event');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionBase.id, {
      expand: ['payment_intent.payment_method'],
    });

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.customerEmail ||
      '';

    const name =
      session.customer_details?.name ||
      session.metadata?.customerName ||
      'Customer';

    const addressObj =
      session.shipping_details?.address ||
      session.customer_details?.address ||
      null;

    if (!email) {
      await markProcessed({ note: 'Skipped: Missing email.' });
      return res.status(200).send('Skipped: Missing email.');
    }

    const existing = await db
      .collection('orders')
      .where('stripeSessionId', '==', session.id)
      .limit(1)
      .get();

    if (!existing.empty) {
      await markProcessed({
        note: 'Order already recorded for this session.',
      });
      return res.status(200).send('Order already recorded for this session.');
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    });

    if (!lineItems?.data?.length) {
      await markProcessed({ note: 'Skipped: No line items.' });
      return res.status(200).send('Skipped: No line items.');
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

    const customerAddress = addressObj
      ? [
          addressObj.line1,
          addressObj.city,
          addressObj.state,
          addressObj.postal_code,
          addressObj.country,
        ]
          .filter(Boolean)
          .join(', ')
      : '';

    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const orderDoc = {
      stripeSessionId: session.id,
      customerEmail: email,
      customerPhone: session.metadata?.customerPhone || '',
      customerName: name,
      customerAddress,
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
    };

    await db.collection('orders').doc(orderId).set(orderDoc);

    await db.collection('order_notifications').add({
      orderId,
      stripeSessionId: session.id,
      customerEmail: orderDoc.customerEmail,
      customerName: orderDoc.customerName,
      totalAmount: orderDoc.totalAmount,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'new',
    });

    if (session.metadata?.guestToken) {
      db.collection('pending_checkouts')
        .doc(session.metadata.guestToken)
        .delete()
        .catch(() => {});
    }

    await markProcessed({ orderId, stripeSessionId: session.id });
    return res.status(200).send('Order created');
  } catch (err) {
    console.error('❌ Failed processing Stripe webhook event:', err);

    try {
      await db.collection('stripe_missed_orders').add({
        stripeEventId: event.id,
        type: event.type,
        livemode: !!event.livemode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        errorMessage: err?.message || String(err),
        stripeSessionId: event?.data?.object?.id || '',
      });
    } catch {}

    await markFailed(err);
    return res.status(500).send('Internal Server Error');
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Stripe Order Reconciler (backstop)
exports.reconcileStripeOrders = onSchedule(
  {
    schedule: 'every 15 minutes',
    secrets: [STRIPE_SECRET_KEY],
    region: 'us-central1',
  },
  async () => {
    const stripe = stripeLib(STRIPE_SECRET_KEY.value());
    const db = admin.firestore();

    console.log('🔎 Running Stripe reconciliation job...');

    try {
      const since = Math.floor(Date.now() / 1000) - 60 * 60 * 24;

      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        created: { gte: since },
        expand: ['data.payment_intent'],
      });

      for (const session of sessions.data) {
        if (session.payment_status !== 'paid') continue;

        const existing = await db
          .collection('orders')
          .where('stripeSessionId', '==', session.id)
          .limit(1)
          .get();

        if (!existing.empty) continue;

        console.warn('🚨 Missing order detected for session:', session.id);

        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          {
            limit: 100,
          }
        );

        const items = lineItems.data.map((li) => ({
          name: li.description,
          quantity: li.quantity,
          price: (li.amount_total || 0) / 100,
        }));

        const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const orderDoc = {
          stripeSessionId: session.id,
          customerEmail: session.customer_details?.email || 'unknown',
          customerName: session.customer_details?.name || 'Customer',
          amountTotal: session.amount_total || 0,
          totalAmount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'usd',
          status: 'recovered-by-reconciliation',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          items,
          recovered: true,
          recoveredBy: 'reconcileStripeOrders',
        };

        await db.collection('orders').doc(orderId).set(orderDoc);

        await db.collection('order_notifications').add({
          orderId,
          stripeSessionId: session.id,
          customerEmail: orderDoc.customerEmail,
          customerName: orderDoc.customerName,
          totalAmount: orderDoc.totalAmount,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: 'new',
          recovered: true,
        });

        try {
          await db.collection('admin_alerts').add({
            type: 'recovered_order',
            severity: 'high',
            stripeSessionId: session.id,
            orderId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            message:
              'Order recovered via Stripe reconciliation. Webhook likely failed.',
          });
        } catch (e) {
          console.error('⚠️ Failed writing admin_alerts (recovered_order):', e);
        }

        console.warn('✅ Recovered missing order:', orderId);
      }

      console.log('✅ Stripe reconciliation complete.');
    } catch (err) {
      console.error('❌ Reconciliation job failed:', err);

      try {
        await admin.firestore().collection('admin_alerts').add({
          type: 'reconciliation_failure',
          severity: 'critical',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          message: err?.message || String(err),
        });
      } catch (e) {
        console.error(
          '⚠️ Failed writing admin_alerts (reconciliation_failure):',
          e
        );
      }
    }
  }
);

// ───────────────────────────────────────────────────────────────────────────────
// Printify webhook app (raw body)
const printifyWebhookApp = express();
printifyWebhookApp.use(express.raw({ type: '*/*' }));

printifyWebhookApp.post('/', async (req, res) => {
  const raw = Buffer.isBuffer(req.body)
    ? req.body.toString('utf8')
    : String(req.body || '');
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
// Shipping — live Printify quote
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

    const { data: product } = await axios.get(
      `https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!product || !product.id) return;

    const { data: variantMeta } = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${product.blueprint_id}/print_providers/${product.print_provider_id}/variants.json`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const metaById = new Map();
    (Array.isArray(variantMeta) ? variantMeta : []).forEach((m) =>
      metaById.set(m.id, m)
    );

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

    await db.collection('merchProducts').doc(productId).set(payload, {
      merge: true,
    });
  } catch (error) {
    console.error(
      '❌ Failed to sync Printify product:',
      error?.response?.data || error
    );
  }
};

// === Claims / user admin ===
exports.setSoundlegendClaim = onCall(
  { region: 'us-central1' },
  async (request) => {
    const ctx = request.auth;
    const isAdmin = ctx?.token?.admin === true || ctx?.token?.isAdmin === true;
    const callerEmail = ctx?.token?.email || '';
    const ALLOW = new Set(['dan@oberartisandrums.com']);

    if (!(isAdmin || ALLOW.has(callerEmail))) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin privileges required.'
      );
    }

    const { uid, enable = true } = request.data || {};
    if (!uid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'uid is required'
      );
    }

    const user = await admin.auth().getUser(uid);
    const claims = user.customClaims || {};

    const merged = {
      ...claims,
      soundlegend: !!enable,
      isSoundlegend: !!enable,
    };

    await admin.auth().setCustomUserClaims(uid, merged);
    await admin.auth().revokeRefreshTokens(uid);

    await db.collection('users').doc(uid).set(
      {
        access: { soundlegend: !!enable },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true, uid, soundlegend: !!enable };
  }
);

exports.adminCreateUser = onCall({ region: 'us-central1' }, async (request) => {
  const ctx = request.auth;
  const isAdmin = ctx?.token?.admin === true || ctx?.token?.isAdmin === true;

  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin privileges required.'
    );
  }

  const {
    email,
    password,
    firstName = '',
    lastName = '',
    phone = '',
    isSoundlegend = false,
    isAdmin: makeAdmin = false,
    status = 'active',
  } = request.data || {};

  const normalizedEmail = normalizeLeadEmail(email);

  if (!normalizedEmail || !password) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'email and password are required'
    );
  }

  try {
    let userRecord = null;
    let existingAuthUser = false;

    try {
      userRecord = await admin.auth().getUserByEmail(normalizedEmail);
      existingAuthUser = true;
    } catch (err) {
      if (err?.code !== 'auth/user-not-found') {
        throw err;
      }
    }

    if (!userRecord) {
      userRecord = await admin.auth().createUser({
        email: normalizedEmail,
        password,
        displayName: `${firstName} ${lastName}`.trim() || undefined,
        phoneNumber: phone && /^\+/.test(phone) ? phone : undefined,
        disabled: status !== 'active',
      });
    } else {
      await admin.auth().updateUser(userRecord.uid, {
        email: normalizedEmail,
        displayName: `${firstName} ${lastName}`.trim() || undefined,
        disabled: status !== 'active',
      });
    }

    const uid = userRecord.uid;

    const existingCanonical = await resolveCanonicalUserDoc({
      userId: uid,
      email: normalizedEmail,
    });

    const currentlyGranted = existingCanonical?.portalAccessGranted === true;
    const currentlyLocked = existingCanonical?.slPortalLocked === true;

    await mergeUserDocsIntoCanonical({
      canonicalId: uid,
      email: normalizedEmail,
      patch: {
        uid,
        firstName: String(firstName || '').trim(),
        lastName: String(lastName || '').trim(),
        fullName: `${String(firstName || '').trim()} ${String(lastName || '').trim()}`.trim(),
        email: normalizedEmail,
        phone: String(phone || '').trim(),
        isAdmin: !!makeAdmin,
        isSoundlegend: !!isSoundlegend,
        status,
        authAccountCreated: true,
        portalInviteSent: existingCanonical?.portalInviteSent === true,
        portalAccessGranted: currentlyGranted,
        slPortalLocked: isSoundlegend ? currentlyLocked || !currentlyGranted : false,
        portalStatus: currentlyGranted && !currentlyLocked ? 'active' : 'inactive',
        access: {
          soundlegend: currentlyGranted && !currentlyLocked,
        },
      },
    });

    return {
      uid,
      userDocId: uid,
      existingAuthUser,
    };
  } catch (e) {
    console.error('adminCreateUser failed:', e);
    throw new functions.https.HttpsError('internal', e?.message || String(e));
  }
});

exports.sendSoundLegendWelcomeEmail = onCall(
  {
    region: 'us-central1',
    secrets: [
      GMAIL_CLIENT_EMAIL,
      GMAIL_PRIVATE_KEY,
      GMAIL_SENDER,
      GMAIL_IMPERSONATE,
      CLIENT_URL,
    ],
  },
  async (request) => {
    const ctx = request.auth;
    const isAdmin = ctx?.token?.admin === true || ctx?.token?.isAdmin === true;
    const callerEmail = ctx?.token?.email || '';
    const ALLOW = new Set(['dan@oberartisandrums.com']);

    if (!(isAdmin || ALLOW.has(callerEmail))) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Admin privileges required.'
      );
    }

    const { userId = '', email = '', name = '' } = request.data || {};
    const normalizedEmail = normalizeLeadEmail(email);

    if (!userId && !normalizedEmail) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'userId or email is required'
      );
    }

    const canonicalUser = await resolveCanonicalUserDoc({
      userId,
      email: normalizedEmail,
    });

    if (!canonicalUser?.id && !normalizedEmail) {
      throw new functions.https.HttpsError(
        'not-found',
        'No matching user document was found'
      );
    }

    const targetEmail = normalizeLeadEmail(
      canonicalUser?.email || normalizedEmail
    );

    if (!targetEmail) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Target user is missing an email address'
      );
    }

    const firstName = String(canonicalUser?.firstName || '').trim();
    const lastName = String(canonicalUser?.lastName || '').trim();
    const fullName =
      String(name || '').trim() ||
      String(canonicalUser?.fullName || '').trim() ||
      `${firstName} ${lastName}`.trim() ||
      targetEmail;

    let authUser = null;
    let uid = String(canonicalUser?.uid || '').trim();

    if (uid) {
      try {
        authUser = await admin.auth().getUser(uid);
      } catch (err) {
        uid = '';
      }
    }

    if (!authUser) {
      try {
        authUser = await admin.auth().getUserByEmail(targetEmail);
        uid = authUser.uid;
      } catch (err) {
        if (err?.code !== 'auth/user-not-found') {
          throw new functions.https.HttpsError(
            'internal',
            err?.message || 'Failed looking up auth user by email'
          );
        }
      }
    }

    if (!authUser) {
      authUser = await admin.auth().createUser({
        email: targetEmail,
        displayName: fullName || undefined,
        disabled: false,
      });
      uid = authUser.uid;
    }

    const existingClaims = authUser.customClaims || {};
    const mergedClaims = {
      ...existingClaims,
      soundlegend: true,
      isSoundlegend: true,
    };

    await admin.auth().setCustomUserClaims(uid, mergedClaims);
    await admin.auth().revokeRefreshTokens(uid);

    const rawClientUrl = String(CLIENT_URL.value() || '').trim();
    const clientBase =
      rawClientUrl.replace(/\/+$/, '') || 'https://www.oberartisandrums.com';

    const resetLink = await admin.auth().generatePasswordResetLink(
      targetEmail,
      {
        url: `${clientBase}/artisan-portal/reset-password`,
        handleCodeInApp: false,
      }
    );

    await mergeUserDocsIntoCanonical({
      canonicalId: uid,
      email: targetEmail,
      patch: {
        uid,
        email: targetEmail,
        firstName,
        lastName,
        fullName,
        isSoundlegend: true,
        soundlegendLead: true,
        soundlegendLeadStatus: 'invited',
        authAccountCreated: true,
        authInvitePending: true,
        portalInviteSent: true,
        portalAccessGranted: true,
        slPortalLocked: false,
        portalStatus: 'active',
        access: {
          soundlegend: true,
        },
        lastWelcomeEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    });

    const emailHtml = emailShell({
      logo: LOGO_SL,
      bodyHtml: `
        <p style="margin:0 0 16px">${greet(firstName || fullName)}</p>
        <p style="margin:0 0 16px">
          Welcome to your private <strong>SoundLegend Artist Portal</strong>.
        </p>
        <p style="margin:0 0 16px">
          Your portal is where you'll access your build journey, updates, media, and milestone history as your project moves forward.
        </p>
        <p style="margin:0 0 16px">
          To activate your access, click the button below and create your password.
        </p>
        ${button('Create Your Password', resetLink)}
        <p style="margin:16px 0 0">
          After setting your password, sign in here:
          <br />
          <a href="${clientBase}/artisan-portal/signin">${clientBase}/artisan-portal/signin</a>
        </p>
      `,
    });

    await gmailSend({
      to: targetEmail,
      subject: 'Welcome to Your SoundLegend Artist Portal',
      html: emailHtml,
      fromEmail: 'soundlegend@oberartisandrums.com',
      replyTo: 'soundlegend@oberartisandrums.com',
      bcc: ['soundlegend@oberartisandrums.com'],
    });

    return {
      ok: true,
      uid,
      userDocId: uid,
      email: targetEmail,
      resetLinkGenerated: true,
    };
  }
);

exports.setAdminClaim = onCall({ region: 'us-central1' }, async (request) => {
  const ctx = request.auth;
  const isAdmin = ctx?.token?.admin === true || ctx?.token?.isAdmin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin privileges required.'
    );
  }

  const { uid, admin: makeAdmin = true } = request.data || {};
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid is required');
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: !!makeAdmin });
    await admin.auth().revokeRefreshTokens(uid);
    return { ok: true };
  } catch (e) {
    throw new functions.https.HttpsError('internal', e?.message || String(e));
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Scheduled refresh
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

exports.linkSoundlegendLeadUser = onDocumentCreated(
  {
    document: 'soundlegend_submissions/{docId}',
    region: 'us-central1',
  },
  async (event) => {
    const submissionId = event.params?.docId;
    const data = event.data?.data();

    if (!submissionId || !data?.email) return;

    try {
      const linkedUserId = await upsertSoundlegendLeadUserFromSubmission(
        submissionId,
        data
      );

      if (!linkedUserId) return;

      await db.collection('soundlegend_submissions').doc(submissionId).set(
        {
          linkedUserId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('linkSoundlegendLeadUser failed:', err);
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

// Main API
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
// Resin Accent Generator
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
      intensity = 'medium',
      coverage = 0.45,
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

    const approxBytes = Math.floor(veneerDataUrl.length * 0.75);
    if (approxBytes > 8 * 1024 * 1024) {
      return res
        .status(413)
        .json({ error: 'Input image too large (max ~8MB).' });
    }

    const b64 = veneerDataUrl.split(',')[1];
    const inputBuf = Buffer.from(b64, 'base64');

    const base = sharp(inputBuf).rotate().ensureAlpha();
    const meta = await base.metadata();
    const maxDim = Math.max(meta.width || 0, meta.height || 0) || size;
    const scale = Math.min(1, (size || maxDim) / maxDim);
    const w = Math.round((meta.width || size) * scale);
    const h = Math.round((meta.height || size) * scale);
    const img = base.resize({ width: w, height: h });

    const grayRaw = await img
      .clone()
      .greyscale()
      .gamma(1.0)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const grayPNG = await sharp(grayRaw.data, {
      raw: {
        width: grayRaw.info.width,
        height: grayRaw.info.height,
        channels: 1,
      },
    })
      .png()
      .toBuffer();

    const blurSigma = Math.max(2, Math.round(Math.max(w, h) / 220));
    const localMeanPNG = await sharp(grayPNG).blur(blurSigma).png().toBuffer();

    const deltaRaw = await sharp(localMeanPNG)
      .composite([{ input: grayPNG, blend: 'subtract' }])
      .raw()
      .toBuffer({ resolveWithObject: true });

    const hist = new Uint32Array(256);
    const deltaData = deltaRaw.data;
    for (let i = 0; i < deltaData.length; i++) hist[deltaData[i]]++;

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const baseFrac =
      intensity === 'light' ? 0.01 : intensity === 'heavy' ? 0.04 : 0.02;
    const frac = clamp(baseFrac + (coverage - 0.45) * 0.02, 0.005, 0.06);

    const total = deltaData.length;
    let acc = 0;
    let T = 255;
    for (let t = 255; t >= 0; t--) {
      acc += hist[t];
      if (acc / total >= frac) {
        T = t;
        break;
      }
    }

    const maskBytes = Buffer.alloc(deltaData.length);
    const g = grayRaw.data;
    const darkGate = 180;
    let whiteCount = 0;
    for (let i = 0; i < deltaData.length; i++) {
      const isPit = deltaData[i] >= T && g[i] < darkGate;
      const v = isPit ? 255 : 0;
      maskBytes[i] = v;
      if (v === 255) whiteCount++;
    }

    const whiteRatio = whiteCount / deltaData.length;
    if (whiteRatio > 0.12) {
      const tightenBy = 10;
      for (let i = 0; i < deltaData.length; i++) {
        const isPit =
          deltaData[i] >= Math.min(255, T + tightenBy) && g[i] < darkGate;
        maskBytes[i] = isPit ? 255 : 0;
      }
    }

    const maskPNG = await sharp(maskBytes, {
      raw: {
        width: grayRaw.info.width,
        height: grayRaw.info.height,
        channels: 1,
      },
    })
      .median(1)
      .blur(0.6)
      .threshold(200)
      .png()
      .toBuffer();

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

    const coloredPits = await sharp(fillPlate)
      .composite([{ input: maskPNG, blend: 'dest-in' }])
      .png()
      .toBuffer();

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
      currentStripePriceId,
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

    const vObj =
      (Array.isArray(data.variants) &&
        data.variants.find((x) => String(x.id) === String(variantId))) ||
      null;

    const priceNickname = toLabel(vObj) || `Variant ${variantId}`;

    const price = await stripe.prices.create({
      unit_amount: Math.round(newPriceCents),
      currency,
      product: sProdId,
      nickname: priceNickname,
      metadata: {
        merchProductId: String(productId),
        variantId: String(variantId),
        description: priceNickname,
      },
    });

    const stripePriceIds = { ...(data.stripePriceIds || {}) };
    stripePriceIds[String(variantId)] = {
      priceId: price.id,
      unitAmount: price.unit_amount,
    };

    await docRef.update({
      stripePriceIds,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

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

// Safe-load generateDrumMockup
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