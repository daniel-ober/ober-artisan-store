require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });

const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const router = express.Router();
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Helper to format address
const formatAddress = (address) => {
    if (!address) return 'No address provided';
    const { line1, line2, city, state, postal_code, country } = address;
    return `${line1 || ''}${line2 ? `, ${line2}` : ''}, ${city || ''}, ${state || ''} ${postal_code || ''}, ${country || ''}`;
};

// Webhook handler
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
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;

            // Fetch line items to get product details
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product'],
            });

            // Extract and format shipping details
            const shippingAddress = formatAddress(session.customer_details?.address);
            const [firstName, ...lastNameParts] = (session.customer_details?.name || 'Guest').split(' ');
            const lastName = lastNameParts.join(' ');

            const orderData = {
                stripeSessionId: session.id,
                customerFirstName: firstName,
                customerLastName: lastName,
                customerEmail: session.customer_details?.email || 'No email provided',
                customerPhone: session.customer_details?.phone || 'No phone provided',
                customerShippingAddress: shippingAddress,
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

            // Save to Firestore
            await admin.firestore().collection('orders').add(orderData);
            console.log('Order saved to Firestore:', orderData);
        } else {
            console.log(`Unhandled event type: ${event.type}`);
        }
    } catch (err) {
        console.error('Error processing webhook event:', err.message);
        return res.status(500).send(`Server Error: ${err.message}`);
    }

    res.status(200).json({ received: true });
});

module.exports = router;
