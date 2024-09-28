// server.js (or your backend entry file)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
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

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

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

// Increase the limit for request body size
app.use(express.json({ limit: '1mb' })); // Set to a suitable limit for your use case
app.use(bodyParser.json({ limit: '1mb' })); // Also set for body-parser

// Import routes
const contactRoutes = require('./routes/contact');
const productRoutes = require('./routes/products');

// Route for contact messages
app.use('/api/contact', contactRoutes);

// Route for product handling
app.use('/api/products', productRoutes);

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
        res.status(500).json({ error: 'Error creating checkout session' });
    }
});

// Sending chat email route
app.post('/send-chat-email', async (req, res) => {
    const { name, email, request, phone, chatMessages } = req.body;

    // Validate input
    if (!email) {
        console.error('No user email provided');
        return res.status(400).send('User email is required');
    }

    if (!Array.isArray(chatMessages) || chatMessages.length === 0) {
        console.error('No chat messages provided');
        return res.status(400).send('Chat messages are required');
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const chatContent = chatMessages.map(msg => 
            `${msg.sender === 'user' ? 'You' : 'Bot'}: ${msg.text}`).join('\n');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'danober.dev@gmail.com', // Always send to this email address
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
app.post('/api/chat', async (req, res) => { // Ensure the route starts with /api
    const { model, messages } = req.body;

    // Adding system message for context
    const systemMessage = {
        role: 'system',
        content: `You are an assistant for Dan Ober Artisan Drums. Help the user choose a drum based on their preferences, emphasizing artisan craftsmanship, quality, and the unique characteristics of the drums.`
    };

    const allMessages = [systemMessage, ...messages]; // Combine system message with user messages

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

// Listening on PORT
const port = process.env.PORT || 4949;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
