require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const openai = require('openai');

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
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:4949',
    'http://10.0.0.210:3000',
];
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204,
};

// Apply CORS globally
app.use(cors(corsOptions));

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

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;

                console.log('Checkout session completed:', session.id);

                // Retrieve line items for the session
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });

                const orderData = {
                    stripeSessionId: session.id,
                    customerName: session.customer_details?.name || 'Guest',
                    customerEmail: session.customer_details?.email || 'No email provided',
                    products: lineItems.data.map((item) => ({
                        name: item.price.product.name,
                        price: item.price.unit_amount / 100, // Convert cents to dollars
                        quantity: item.quantity,
                    })),
                    totalAmount: session.amount_total / 100, // Convert cents to dollars
                    status: session.payment_status,
                    createdAt: new Date(),
                };

                // Save order to Firestore
                await db.collection('orders').add(orderData);
                console.log('Order saved to Firestore:', orderData);
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).send({ received: true });
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

// Create a Stripe checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    const { products, userId } = req.body;

    try {
        const lineItems = products.map((item) => {
            if (!item.price || isNaN(item.price)) {
                throw new Error(`Invalid price for product: ${item.name}`);
            }

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name || 'Unnamed Product',
                        description: item.description || 'No description available',
                    },
                    unit_amount: Math.round(item.price * 100), // Convert dollars to cents
                },
                quantity: item.quantity || 1,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&userId=${userId}`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            metadata: { userId },
        });

        res.status(200).json({ url: session.url, id: session.id });
    } catch (err) {
        console.error('Error creating checkout session:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get Stripe order details
app.get('/api/get-order-details', async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) {
        return res.status(400).json({ error: 'Missing session_id parameter' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['line_items.data.price.product'],
        });

        const orderData = {
            stripeSessionId: session.id,
            customerName: session.customer_details?.name || 'Guest',
            customerEmail: session.customer_details?.email || 'No email provided',
            products: session.line_items.data.map((item) => ({
                name: item.price.product.name,
                price: item.price.unit_amount / 100, // Convert cents to dollars
                quantity: item.quantity,
            })),
            totalAmount: session.amount_total / 100, // Convert cents to dollars
            status: session.payment_status,
        };

        res.status(200).json(orderData);
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).json({ error: 'Failed to retrieve order details.' });
    }
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
    const { model, messages } = req.body;

    const systemMessage = {
        role: 'system',
        content: `You are an assistant for Dan Ober Artisan Drums. Help the user choose a drum based on their preferences, emphasizing artisan craftsmanship, quality, and the unique characteristics of the drums.`,
    };

    const allMessages = [systemMessage, ...messages];

    try {
        const response = await openai.chat.completions.create({
            model,
            messages: allMessages,
        });

        res.json(response);
    } catch (error) {
        console.error('Error generating chat response:', error);
        res.status(500).send('Error generating chat response');
    }
});

// Import routes
const productsRouter = require('./routes/products');
app.use('/api/products', productsRouter);

const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
