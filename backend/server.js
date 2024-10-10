require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const OpenAI = require('openai');

// Define allowed origins for CORS
const allowedOrigins = [
    'http://localhost:3000', // Frontend in development
    'http://localhost:4949', // Your backend server
    'http://10.0.0.210:3000', // Your local network IP (if accessing from another device)
];

// Firebase Admin setup
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
} else {
    console.log("Firebase app already initialized.");
}

const db = admin.firestore();
const app = express();

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        console.log("Incoming request origin:", origin);
        
        if (!origin) return callback(null, true); // Allow requests with no origin (like mobile apps)

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
    optionsSuccessStatus: 204, // Some legacy browsers choke on 204
};

// Apply CORS middleware before defining routes
app.use(cors(corsOptions));

// Logging middleware to check origin and other headers
app.use((req, res, next) => {
    console.log('Incoming request origin:', req.headers.origin); // Log the origin
    next();
});

// Middleware to parse JSON requests
app.use(express.json({ limit: '1mb' }));

// Import routes
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/products');
const webhookRoutes = require('./webhooks');

// Route for contact messages
app.use('/api/contact', contactRoutes);

// Route for product handling
app.use('/api/products', productRoutes);

// Route for webhook handling
app.use('/api/webhooks', webhookRoutes);

// Create Product Route (Stripe integration and Firestore)
app.post('/api/create-stripe-product', async (req, res) => {
    const { name, description, images = [], price, category } = req.body;

    // Log incoming request data
    console.log('Request body:', req.body);

    try {
        // Validate input
        if (!name) return res.status(400).json({ error: 'Product name is required.' });
        if (price === undefined || price <= 0) return res.status(400).json({ error: 'Valid price is required.' });

        // Create the product in Stripe
        const product = await stripe.products.create({
            name,
            description,
            images,
        });

        // Log created Stripe product
        console.log('Created Stripe product:', product);

        // Create a price for the product
        const priceId = await stripe.prices.create({
            currency: 'usd',
            unit_amount: Math.round(price * 100), // Stripe requires price in cents
            product: product.id,
        });

        // Prepare product data for Firestore
        const productData = {
            name,
            description,
            images,
            priceId: priceId.id,
            stripeProductId: product.id, // Keep this to reference the Stripe product
            category: category || "default-category", // Assign a default category if not provided
            status: "unavailable", // Default status
            price, // Include the price field
        };

        // Log the product data before saving to Firestore
        console.log('Product data before Firestore save:', productData);

        // Add the product to Firestore using auto-generated document ID
        const newProductRef = await db.collection('products').add(productData);
        console.log('New Firestore document created with ID:', newProductRef.id);

        // Return the auto-generated document ID along with the Stripe price ID
        res.status(201).json({ productId: newProductRef.id, priceId: priceId.id });
    } catch (error) {
        console.error('Error creating Stripe product:', error);
        if (error.code === 'invalid_request_error') {
            return res.status(400).json({ error: 'Invalid request to Stripe.' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create Checkout Session Route
app.post('/api/create-checkout-session', async (req, res) => {
    const { products, userId } = req.body;

    try {
        const lineItems = products.map(item => ({
            price: item.price,
            quantity: item.quantity,
        }));

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

// Sending chat email route
app.post('/api/send-chat-email', async (req, res) => {
    const { name, email, request, phone, chatMessages } = req.body;

    if (!email) return res.status(400).send('User email is required');
    if (!Array.isArray(chatMessages) || chatMessages.length === 0) return res.status(400).send('Chat messages are required');

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const chatContent = chatMessages.map(msg => `${msg.sender === 'user' ? 'You' : 'Bot'}: ${msg.text}`).join('\n');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'danober.dev@gmail.com',
            subject: 'Chat Inquiry from Oakli (Custom Drum Assistant)',
            text: `Customer Name: ${name}\nCustomer Email: ${email}\nCustomer Phone: ${phone}\n\nCustomer Request: ${request}\n\nChat History:\n${chatContent}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).send('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
    const { model, messages } = req.body;

    const systemMessage = {
        role: 'system',
        content: `You are a highly skilled and knowledgeable support guru who inspires others. You push yourself to exceed your own expectations, while remaining calm, staying curious, and embodying some unusual yet unique qualities in your personality. You put the customer first and can always find a way to relate with others whether through the gift of music, being a trusted assistant, one who avoids conflict (but when forced into conflict knows how to take it head on and come out of it feeling humbled and leaving a sense of "inspiration" to those around you. Your goal is to help drummers, collectors, musicians, and those who are on a lifelong journey in trying to "find their sound". You offer honest feedback and advice as to why you believe Dan Ober Artisan Drums can help them in their journey. You are interested in learning about musicians that message you -- helping bridge the gap between musicians and finding their sound. We bring dedication, skill, craftsmanship, care, thought, meaning, knowledge, and a fearless demeanor to help musicians and artists connect with themselves more deeply through producing something unique, personal, meaningful, and beautiful to their craft. You are the Assistant of Dan Ober, Master Craftsman of Dan Ober Artisan Drums. Based in Nashville, TN. Established in 2024.`,
    };

    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [systemMessage, ...messages],
        });

        res.status(200).json(response.choices[0].message);
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Webhook for Stripe events
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('Received Stripe event:', event.id);
    } catch (err) {
        console.log('Webhook error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            // Fulfill the purchase...
            // Update Firestore with purchase details
            break;
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

// Starting the server
const PORT = process.env.PORT || 4949;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
