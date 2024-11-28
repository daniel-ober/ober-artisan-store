// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Firebase Admin Initialization
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
}

const db = admin.firestore();
const app = express();

// CORS Configuration
const allowedOrigins = ['http://localhost:3000', 'http://localhost:4949', 'http://10.0.0.210:3000'];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
}));

// Apply JSON parsing globally except for webhook
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') {
        next(); // Skip JSON middleware for webhook
    } else {
        express.json({ limit: '1mb' })(req, res, next); // Parse JSON for other routes
    }
});

// Webhook route
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log(`Received Stripe event: ${event.type}`);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            console.log('Checkout session completed:', session.id);
            console.log('Session metadata:', session.metadata);

            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });

            const orderData = {
                stripeSessionId: session.id,
                customerName: session.customer_details?.name || 'Guest',
                customerEmail: session.customer_details?.email || 'No email provided',
                products: lineItems.data.map((item) => ({
                    name: item.price.product.name,
                    price: item.price.unit_amount / 100,
                    quantity: item.quantity,
                })),
                totalAmount: session.amount_total / 100,
                status: session.payment_status,
                createdAt: new Date(),
                userId: session.metadata?.userId || 'guest',
                guestToken: session.metadata?.guestToken || null,
            };

            console.log('Saving order with guestToken:', orderData.guestToken);

            await db.collection('orders').add(orderData);
            console.log('Order saved to Firestore:', orderData);
        }

        res.status(200).send({ received: true });
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Create a Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        console.log('Received Checkout Session Request:', req.body);

        const { products, userId } = req.body;
        if (!products || !Array.isArray(products) || products.length === 0) {
            throw new Error('Invalid products array');
        }

        const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const lineItems = products.map((product) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name || 'Unnamed Product',
                    description: product.description || 'No description available',
                },
                unit_amount: Math.round(product.price * 100), // Convert price to cents
            },
            quantity: product.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            metadata: { userId: userId || 'guest', guestToken },
        });

        console.log('Created Stripe Session:', session);

        res.status(200).json({ url: session.url, id: session.id, guestToken });
    } catch (err) {
        console.error('Error in create-checkout-session:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Mount OpenAI Chat Route
const chatRoute = require('./routes/chat'); // Import OpenAI chat route
app.use('/api/chat', chatRoute); // Mount the chat route

// Server Listener
const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
