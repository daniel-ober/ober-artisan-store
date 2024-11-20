const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Ensure Firebase Admin SDK is initialized
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
    });
}

const db = admin.firestore();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`Received Stripe event: ${event.type}`);

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                console.log(`PaymentIntent succeeded: ${event.data.object.id}`);
                break;

            case 'checkout.session.completed': {
                const session = await stripe.checkout.sessions.retrieve(event.data.object.id, {
                    expand: ['line_items.data.price.product'],
                });

                const customerDetails = session.customer_details || {};
                const lineItems = session.line_items?.data || [];
                const products = lineItems.map((item) => ({
                    name: item.description,
                    price: item.price.unit_amount / 100, // Convert cents to dollars
                    quantity: item.quantity,
                }));

                const orderData = {
                    stripeSessionId: session.id,
                    customerName: customerDetails.name || 'Guest',
                    customerEmail: customerDetails.email || 'No email provided',
                    products,
                    totalAmount: session.amount_total / 100, // Convert cents to dollars
                    status: session.payment_status,
                    userId: session.metadata?.userId || null,
                    createdAt: new Date(),
                };

                // Save order to Firestore
                const ordersRef = db.collection('orders');
                await ordersRef.add(orderData);

                console.log('Order saved to Firestore:', orderData);
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error(`Error processing webhook: ${error.message}`);
        res.status(500).send(`Webhook processing error: ${error.message}`);
    }
});

module.exports = router;
