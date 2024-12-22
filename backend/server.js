// backend/server.js
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
    ],
    stg: [
        'http://localhost:3001',
        'https://stg.danoberartisan.com',
    ],
    prod: [
        'https://danoberartisan.com',
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
    next();
});

// Middleware: JSON Parsing
app.use((req, res, next) => {
    if (req.originalUrl === '/api/webhook') next(); // Skip JSON parsing for webhook
    else express.json({ limit: '1mb' })(req, res, next);
});

// Webhook Route for Stripe
const webhookRoute = require('./webhook');
app.use('/api/webhook', webhookRoute);

// Route for creating Stripe checkout sessions
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { products, userId, customerFirstName, customerLastName, customerEmail, customerPhone, shippingAddress } = req.body;
        const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'Invalid products array' });
        }

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
            metadata: {
                userId: userId || 'guest',
                guestToken,
                customerFirstName,
                customerLastName,
                customerEmail,
                customerPhone: customerPhone || 'No phone provided',
                shippingAddress: JSON.stringify(shippingAddress || {}),
            },
            customer_email: customerEmail,
            shipping_address_collection: { allowed_countries: ['US', 'CA'] },
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
