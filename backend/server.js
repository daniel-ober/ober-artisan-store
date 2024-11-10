require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

// Check for required environment variables
if (!process.env.STRIPE_SECRET_KEY || !process.env.FIREBASE_PROJECT_ID) {
    throw new Error('Missing critical environment variables.');
}

// Define allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4949',
    'http://10.0.0.210:3000',
    'https://d88d-2601-480-4101-1ba0-1b1-3c9d-e72-7192.ngrok-free.app',
];

// Firebase Admin setup
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: process.env.FIREBASE_AUTH_URI,
            token_uri: process.env.FIREBASE_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
} else {
    console.log('Firebase app already initialized');
}

const db = admin.firestore();
const app = express();

// Middleware
app.set('trust proxy', 1); // Enable 'trust proxy' for rate limiting
app.use(helmet()); // Add security headers
app.use(cors({
    origin: (origin, callback) => {
        console.log("Incoming request origin:", origin);
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Origin not allowed by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
}));

// Middleware to capture the raw body for webhook verification
app.use(bodyParser.raw({ type: 'application/json' }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Import routes
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/products');
const webhookRoutes = require('./webhook'); // Updated import statement

// Define routes
app.use('/api/contact', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/api/webhook', webhookRoutes);

// Create Product Route
app.post('/api/create-stripe-product', async (req, res) => {
    const { name, description, images = [], price, category } = req.body;
    console.log('Request body:', req.body);

    try {
        if (!name) return res.status(400).json({ error: 'Product name is required.' });
        if (price === undefined || price <= 0) return res.status(400).json({ error: 'Valid price is required.' });

        const product = await stripe.products.create({
            name,
            description,
            images,
        });

        const priceId = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(price * 100),
            product: product.id,
        });

        const productData = {
            name,
            description,
            images,
            priceId: priceId.id,
            stripeProductId: product.id,
            category: category || "default-category",
            status: "unavailable",
            price,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const newProductRef = await db.collection('products').add(productData);
        console.log('New Firestore document created with ID:', newProductRef.id);

        res.status(201).json({ productId: newProductRef.id, ...productData });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Error creating product.' });
    }
});

// Create Checkout Session Route
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { products } = req.body;
        console.log('Products for checkout session:', products);

        // Validate input
        if (!products || products.length === 0) {
            return res.status(400).json({ error: 'No products provided.' });
        }

        // Create a checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: products.map(product => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        images: [product.imageUrl], // Optional
                    },
                    unit_amount: Math.round(product.price * 100), // Convert to cents
                },
                quantity: product.quantity,
            })),
            mode: 'payment',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Unable to create checkout session.' });
    }
});

// Start the server
const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
