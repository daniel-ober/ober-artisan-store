const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

const router = express.Router();
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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        try {
            // Retrieve the full session including line items
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ['line_items', 'shipping'],
            });

            console.log('Full Session Data:', JSON.stringify(fullSession, null, 2));

            const lineItems = fullSession.line_items.data;

            // Function to format address
            const formatAddress = (address) => {
                if (!address) return 'No address provided';
                const { line1, line2, city, state, postal_code, country } = address;
                return `${line1 || ''}${line2 ? `, ${line2}` : ''}, ${city || ''}, ${state || ''} ${postal_code || ''}, ${country || ''}`;
            };

            // Get shipping name and address explicitly
            const shippingAddress = formatAddress(fullSession.shipping_details?.address);
            const [firstName, ...lastNameParts] = (fullSession.shipping_details?.name || 'Guest').split(' ');
            const lastName = lastNameParts.join(' ');

            // Capture email and phone from session
            const email = fullSession.customer_details?.email || 'No email provided';
            const phone = fullSession.customer_details?.phone || 'No phone provided';

            const orderData = {
                stripeSessionId: session.id,
                customerFirstName: firstName || 'Guest',
                customerLastName: lastName || 'No last name provided',
                customerEmail: email,
                customerPhone: phone,
                customerShippingAddress: shippingAddress,
                paymentMethod: session.payment_method_types[0] || 'Unknown',
                currency: session.currency,
                products: lineItems.map((item) => ({
                    name: item.description,
                    price: item.amount_total / 100,
                    quantity: item.quantity,
                })),
                totalAmount: session.amount_total / 100,
                status: session.payment_status,
                createdAt: admin.firestore.Timestamp.now(),
                userId: session.metadata?.userId || 'guest',
                guestToken: session.metadata?.guestToken || null,
            };

            await admin.firestore().collection('orders').add(orderData);
            console.log('Order saved to Firestore:', orderData);
        } catch (err) {
            console.error('Error processing checkout session:', err.message);
            console.error(err.stack);
            return res.status(500).send(`Server Error: ${err.message}`);
        }
    } else {
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
});

module.exports = router;
