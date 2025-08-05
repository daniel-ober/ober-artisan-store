// functions/index.js
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

    const guestToken = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // ✅ Build Stripe line items safely
    const lineItems = products.map((p) => {
      const config = p.config || {};
      const staveQuantity = config.staveQuantity ?? config.StaveQuantity;

      // ✅ Construct description only if it has actual content
      const descriptionParts = [
        config.size ? `Size: ${config.size}"` : '',
        config.depth ? `Depth: ${config.depth}"` : '',
        config.lugQuantity ? `${config.lugQuantity} Lugs` : '',
        staveQuantity ? `${staveQuantity} Staves` : '',
        config.reRing !== undefined
          ? config.reRing
            ? 'Re-Rings'
            : 'No Re-Rings'
          : '',
        config.hardwareColor ? `Hardware: ${config.hardwareColor}` : '',
      ].filter(Boolean);

      const productData = {
        name: p.name || 'Ober Artisan Product',
        images:
          typeof p.image === 'string' && p.image.startsWith('http')
            ? [p.image]
            : ['https://oberartisandrums.com/fallback-images/fallback_image1.png'],
        metadata: {
          size: config.size || '',
          depth: config.depth || '',
          lugQuantity: config.lugQuantity || '',
          staveQuantity: staveQuantity || '',
          reRing: config.reRing ? 'Yes' : 'No',
          hardwareColor: config.hardwareColor || '',
        },
      };

      // ✅ Only attach description if not empty
      if (descriptionParts.length > 0) {
        productData.description = descriptionParts.join(' • ');
      }

      return {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(p.price * 100),
          product_data: productData,
        },
        quantity: p.quantity || 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${clientUrl}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${clientUrl}/cart`,
      customer_email: customerEmail,
      shipping_address_collection: { allowed_countries: ['US', 'CA'] },
      allow_promotion_codes: true,
      metadata: {
        userId: userId || 'guest',
        guestToken,
        customerPhone: customerPhone || '',
        customerName: `${firstName} ${lastName}`.trim(),
        promoCode: promoCode || '',
        address: shippingAddress?.line1 || '',
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('❌ Error creating checkout session:', err.message);
    res.status(500).json({ error: err.message });
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
    if (event.type === 'checkout.session.completed') {
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );

      // Defensive Check
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

      const items = lineItems.data.map((item) => {
        const metadata = item.price?.product?.metadata || {};
        return {
          priceId: item.price?.id || '',
          description: item.description,
          quantity: item.quantity,
          price: item.amount_total ? item.amount_total / 100 : 0,
          variant: {
            size: metadata.size || '',
            color: metadata.color || '',
            other: metadata.other || '',
            sku: metadata.sku || '',
            title: metadata.title || '',
          },
        };
      });

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
        cardDetails: {
          brand: '',
          lastFour: '',
        },
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
      // console.log(`✅ Order created: ${orderId}`);
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
    console.error('❌ Failed processing event:', err.message);
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
    // console.log(`✅ Created merchProduct: ${productId}`);
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
          syncedAt: admin.firestore.FieldValue.serverTimestamp(), // ✅ ADD THIS
        });
      } catch (err) {
        console.error(`❌ Failed to update ${productId}:`, err.message);
      }
    }
  }
);

// app.get('/api/admin/getPrintifyProducts', async (req, res) => {
//   try {
//     console.log('🟡 Hitting Printify API...');
//     const response = await axios.get(
//       'https://api.printify.com/v1/shops/20308920/products.json?status=published',
//       {
//         headers: {
//           Authorization: `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImExNzMzODQ1Y2U3MzAzYTY0ZjY1Y2ZjZDRkOWIwMGYwNjVkNjM0NzY2ZTJhMGU0Zjg5ZjIyZTJjMzMwNjE4MzI2MThiODZiYjY1ZWNiNzZmIiwiaWF0IjoxNzQ1MDM0MDI0LjE4MTM4NCwibmJmIjoxNzQ1MDM0MDI0LjE4MTM4NiwiZXhwIjoxNzc2NTcwMDI0LjE3NDM5Nywic3ViIjoiMjE1MzcyNDMiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.AvUcYuhOMtEV6ovGENBmveyRk5-zySqeggUHgsefA2T2XhmtqlH2oVArWxj3NBgYX8errG30vPjxNDBrltA`
//         },
//         timeout: 10000,
//       }
//     );

//     console.log('✅ Printify response received');
//     const products = response.data || [];
//     console.log('🟢 Number of products returned:', products.length);
//     res.status(200).json({ products });
//   } catch (error) {
//     console.error('❌ Printify fetch failed:', error.message);
//     res.status(500).json({ error: 'Printify fetch failed' });
//   }
// });

// app.post('/api/admin/importPrintifyProduct', async (req, res) => {
//   const { printifyProductId } = req.body;

//   if (!printifyProductId) {
//     return res.status(400).json({ error: 'Missing printifyProductId' });
//   }

//   try {
//     const response = await axios.get(
//       `https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID.value()}/products/${printifyProductId}.json`,
//       {
//         headers: {
//           Authorization: `Bearer ${PRINTIFY_API_KEY.value()}`,
//         },
//       }
//     );

//     const product = response.data;

//     const payload = {
//       id: product.id,
//       title: product.title,
//       description: product.description || '',
//       images: (product.images || []).map((img) => ({
//         ...img,
//         displayInGallery: true,
//       })),
//       tags: product.tags || [],
//       variants: product.variants.filter(v => v.is_enabled),
//       options: product.options || [],
//       visible: product.visible,
//       syncedAt: admin.firestore.FieldValue.serverTimestamp(),
//       status: 'inactive',
//     };

//     await db.collection('merchProducts').doc(product.id).set(payload);

//     console.log(`✅ Imported Printify product: ${product.id}`);
//     res.status(200).json({ success: true, productId: product.id });
//   } catch (error) {
//     console.error('❌ Error importing Printify product:', error.message);
//     res.status(500).json({ error: 'Failed to import Printify product' });
//   }
// });

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

    console.log('📬 New inquiry received:', data);

    const msg = {
      to: email,
      from: {
        name: 'Ober Artisan Drums',
        email: 'support@oberartisandrums.com',
      },
      replyTo: 'support@oberartisandrums.com',
      bcc: ['support@oberartisandrums.com'],
      subject: `We've Received Your Message`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/SendGridEmail%2Fblack_logo.png?alt=media&token=850410a6-4373-4194-803e-808c49cbc626" alt="Ober Artisan Drums" style="width: 180px; margin-bottom: 10px;" />
          </div>

          <p style="font-size: 16px; color: #444;">Hi ${firstName || 'there'},</p>

          <p style="font-size: 16px; color: #444;">
            Thanks for reaching out. Your message has been received, and we're looking forward to connecting with you.
          </p>

          <p style="font-size: 16px; color: #444;">
            At Ober Artisan Drums, every note and detail matters. Whether you're exploring a new build, asking a question, or simply saying hello, we treat it with the same level of care we bring to our instruments.
          </p>

          <p style="font-size: 16px; color: #444;">
            We typically respond within 24–48 hours. In the meantime, feel free to browse the shop or explore the stories behind our drums.
          </p>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://oberartisandrums.com" style="display: inline-block; padding: 12px 20px; background-color: #111; color: white; text-decoration: none; border-radius: 5px;">Visit Our Site</a>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center;">
            <p style="font-size: 14px; color: #888;">
              In craft,<br/>
              – The Ober Artisan Team<br/>
              <a href="https://oberartisandrums.com" style="color: #888; text-decoration: none;">www.oberartisandrums.com</a><br/>
              <span style="font-size: 12px; color: #aaa;">Handcrafted in Nashville, TN</span>
            </p>
          </div>
        </div>
      `,
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

    console.log('📬 New SoundLegend submission received:', data);

    const msg = {
      to: email,
      from: {
        name: 'Ober Artisan Drums',
        email: 'soundlegend@oberartisandrums.com',
      },
      bcc: ['soundlegend@oberartisandrums.com'],
      subject: `Welcome to the SoundLegend Experience`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
          <div style="text-align: center;">
            <img 
              src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/SendGridEmail%2Fsoundlegend-email.png?alt=media&token=2929bea0-5d78-4143-ab61-c4d543671a33" 
              alt="SoundLegend Experience" 
              style="max-width: 500px; width: 100%; height: auto; margin-bottom: 20px;" 
            />
          </div>

          <p style="font-size: 16px; color: #333;">Hi ${firstName || 'there'},</p>

          <p style="font-size: 16px; color: #444;">
            You're in. We've received your SoundLegend submission — and we’re excited to hear your story.
          </p>

          <p style="font-size: 16px; color: #444;">
            This next chapter isn’t just about building a snare. It’s about honoring your legacy through sound — captured in wood, crafted by hand, and designed to last a lifetime.
          </p>

          <p style="font-size: 16px; color: #444;">
            We typically follow up within 24–48 hours to learn more about your vision. In the meantime, here’s a short video to get us both amped up about what’s ahead:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a 
              href="https://www.youtube.com/watch?v=PW28PjMCpxg" 
              target="_blank" 
              style="display: inline-block; padding: 12px 20px; background-color: #111; color: #fff; text-decoration: none; border-radius: 5px;"
            >Watch the Teaser</a>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center;">
            <p style="font-size: 14px; color: #888;">
              In craft and legacy,<br/>
              – The Ober Artisan Team<br/>
              <a href="https://oberartisandrums.com" style="color: #888; text-decoration: none;">www.oberartisandrums.com</a><br/>
              <span style="font-size: 12px; color: #aaa;">Handcrafted in Nashville, TN</span>
            </p>
          </div>
        </div>
      `,
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
    // 👇 Add CORS headers manually
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
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS
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
  const { email, password, firstName, lastName, phone, isSoundlegend, status } =
    data;

  // ✅ Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be signed in.'
    );
  }

  // ✅ Ensure user has admin privileges
  if (!context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin privileges required.'
    );
  }

  try {
    // ✅ Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      phoneNumber: phone && phone.length > 0 ? phone : undefined,
    });

    console.log(`✅ Created user ${userRecord.uid} (${email})`);

    // ✅ Create corresponding Firestore doc
    await admin
      .firestore()
      .collection('users')
      .doc(userRecord.uid)
      .set({
        firstName,
        lastName,
        email,
        phone,
        isAdmin: false,
        isSoundlegend: isSoundlegend || false,
        status: status || 'active',
        createdAt: admin.firestore.Timestamp.now(),
      });

    return { uid: userRecord.uid };
  } catch (err) {
    console.error('❌ Error during user creation:', err.message);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

const { generateDrumMockup } = require('./generateDrumMockup');
exports.generateDrumMockup = generateDrumMockup;
