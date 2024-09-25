require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const webhookRoutes = require('./webhooks');

// Import OpenAI correctly
const OpenAI = require('openai');

// Firebase Admin setup
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

const db = admin.firestore();
const app = express();

// Initialize OpenAI API with the key from environment variables
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Debugging logs to check configuration
console.log('OpenAI API successfully configured.');

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000',
    process.env.CLIENT_URL,
];

// Middleware
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(bodyParser.json());

// Import routes
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/products');

// Route for contact messages
app.use('/api/contact', contactRoutes);

// Route for product handling
app.use('/api/products', productRoutes);

// Webhook route
app.use('/webhooks', webhookRoutes);

// Custom Shop Helper Route
app.post('/custom-shop-helper', async (req, res) => {
    const { model, messages } = req.body;

    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: messages,
        });

        const reply = response.choices[0].message.content;
        res.status(200).json({ reply });
    } catch (error) {
        console.error('Error processing custom shop request:', error);
        res.status(500).json({ error: 'Error processing custom shop request' });
    }
});

// Create Checkout Session Route
app.post('/create-checkout-session', async (req, res) => {
    const { products, userId } = req.body;

    try {
        const lineItems = products.map(item => {
            if (!item.price || !item.name) {
                throw new Error(`Missing price or name for product: ${JSON.stringify(item)}`);
            }
            return {
                price: item.price,
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            metadata: { userId },
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Sample Route for Firestore
app.get('/api/firestore-doc', async (req, res) => {
    try {
        const docRef = db.collection('products').doc('y0Z3azz4Dxzv7H3uyOMT');
        const doc = await docRef.get();
        if (!doc.exists) {
            return res.status(404).send('Document not found');
        }
        res.json(doc.data());
    } catch (error) {
        console.error('Error retrieving document:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
