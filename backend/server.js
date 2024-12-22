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
    const serviceAccountPath = path.resolve(__dirname, `./serviceAccountKey-${env}.json`);
    console.log(`Loading Firebase Service Account Key from: ${serviceAccountPath}`);
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
console.log(`Firestore initialized for project: ${process.env.FIREBASE_PROJECT_ID}`);

const app = express();

// Trust Proxy for Firebase Hosting
app.set('trust proxy', true);

// CORS Configuration
const allowedOrigins = {
    dev: [
        'http://localhost:3000',
        'http://localhost:4949',
        'https://dev.danoberartisan.com',
        'https://danoberartisandrums-dev.web.app',
        'https://danoberartisandrums-dev.firebaseapp.com',
    ],
    stg: [
        'http://localhost:3001',
        'http://localhost:5959',
        'https://stg.danoberartisan.com',
        'https://danoberartisandrums-stg.web.app',
        'https://danoberartisandrums-stg.firebaseapp.com',
    ],
    prod: [
        'https://danoberartisan.com',
        'https://danoberartisandrums.web.app',
        'https://danoberartisandrums.firebaseapp.com',
    ],
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
    console.log('Request Headers:', req.headers);
    next();
});

// Middleware: JSON Parsing
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') next(); // Skip JSON parsing for webhook
    else express.json({ limit: '1mb' })(req, res, next);
});

// Stripe Webhook Route
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log(`Received Stripe event: ${event.type}`);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product'],
            });

            const address = session.customer_details?.address || {};
            const fullAddress = `${address.line1 || ''}, ${address.city || ''}, ${address.state || ''} ${address.postal_code || ''}, ${address.country || ''}`.trim();

            const orderData = {
                stripeSessionId: session.id,
                customerName: session.customer_details?.name || 'Guest',
                customerEmail: session.customer_details?.email || 'No email provided',
                customerPhone: session.customer_details?.phone || 'No phone provided',
                customerAddress: fullAddress || 'No address provided',
                shippingDetails: session.shipping || 'No shipping details provided',
                paymentMethod: session.payment_method_types?.[0] || 'Unknown',
                currency: session.currency,
                products: lineItems.data.map((item) => ({
                    name: item.price.product.name,
                    price: item.price.unit_amount / 100,
                    quantity: item.quantity,
                })),
                totalAmount: session.amount_total / 100,
                status: session.payment_status,
                createdAt: admin.firestore.Timestamp.now(),
                userId: session.metadata?.userId || 'guest',
                guestToken: session.metadata?.guestToken || null,
            };

            await db.collection('orders').add(orderData);
            console.log('Order saved to Firestore:', orderData);
        }

        res.status(200).send({ received: true });
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Route for creating Stripe checkout sessions
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { products, userId } = req.body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'Invalid products array' });
        }

        const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const lineItems = products.map((product) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name || 'Unnamed Product',
                    description: product.description || 'No description available',
                },
                unit_amount: Math.round(product.price * 100),
            },
            quantity: product.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            allow_promotion_codes: true,
            metadata: { userId: userId || 'guest', guestToken },
        });        

        res.status(200).json({ url: session.url, id: session.id, guestToken });
    } catch (err) {
        console.error('Error creating Stripe session:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Import and mount routes
const chatRoute = require('./routes/chat');
const contactRoute = require('./routes/contact');
const productsRoute = require('./routes/products');
const ordersRoute = require('./routes/orders');
const usersRoute = require('./routes/users');

app.use('/api/chat', chatRoute);
app.use('/api/contact', contactRoute);
app.use('/api/products', productsRoute);
app.use('/api/orders', ordersRoute);
app.use('/api/users', usersRoute);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
