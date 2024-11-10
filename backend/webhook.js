const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

// Middleware for CORS
router.use(cors());

// Define the Stripe webhook secret
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Create a checkout session endpoint
router.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: req.body.line_items, // Ensure you're passing line items correctly
            mode: 'payment',
            success_url: `${req.headers.origin}/success`, // Adjust success URL
            cancel_url: `${req.headers.origin}/cancel`, // Adjust cancel URL
        });

        res.status(200).json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Change the route to handle /webhook
router.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        // Verify the webhook signature
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event types
    switch (event.type) {
        case 'charge.captured':
        case 'charge.dispute.closed':
        case 'charge.dispute.created':
        case 'charge.dispute.funds_reinstated':
        case 'charge.dispute.funds_withdrawn':
        case 'charge.dispute.updated':
        case 'charge.expired':
        case 'charge.failed':
        case 'charge.pending':
        case 'charge.refund.updated':
        case 'charge.refunded':
        case 'charge.succeeded':
        case 'charge.updated':
            handleChargeEvent(event);
            break;

        case 'checkout.session.async_payment_failed':
        case 'checkout.session.async_payment_succeeded':
        case 'checkout.session.completed':
        case 'checkout.session.expired':
            handleCheckoutSessionEvent(event);
            break;

        case 'credit_note.created':
        case 'credit_note.updated':
        case 'credit_note.voided':
            handleCreditNoteEvent(event);
            break;

        case 'payment_intent.amount_capturable_updated':
        case 'payment_intent.canceled':
        case 'payment_intent.created':
        case 'payment_intent.partially_funded':
        case 'payment_intent.payment_failed':
        case 'payment_intent.processing':
        case 'payment_intent.requires_action':
        case 'payment_intent.succeeded':
            handlePaymentIntentEvent(event);
            break;

        case 'payment_link.created':
        case 'payment_link.updated':
            handlePaymentLinkEvent(event);
            break;

        case 'price.created':
        case 'price.deleted':
        case 'price.updated':
            handlePriceEvent(event);
            break;

        case 'product.created':
        case 'product.deleted':
        case 'product.updated':
            handleProductEvent(event);
            break;

        case 'quote.accepted':
        case 'quote.canceled':
        case 'quote.created':
        case 'quote.finalized':
        case 'quote.will_expire':
            handleQuoteEvent(event);
            break;

        case 'refund.created':
        case 'refund.failed':
        case 'refund.updated':
            handleRefundEvent(event);
            break;

        case 'review.closed':
        case 'review.opened':
            handleReviewEvent(event);
            break;

        case 'terminal.reader.action_failed':
        case 'terminal.reader.action_succeeded':
            handleTerminalReaderEvent(event);
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Acknowledge receipt of the event
    res.status(200).json({ received: true });
});

// Handler functions for different event types
function handleChargeEvent(event) {
    const charge = event.data.object;
    console.log(`Charge event: ${event.type} for Charge ID: ${charge.id}`);
    // Add your business logic here
}

function handleCheckoutSessionEvent(event) {
    const session = event.data.object;
    console.log(`Checkout session event: ${event.type} for Session ID: ${session.id}`);
    // Fulfill the order or update your system
}

function handleCreditNoteEvent(event) {
    const creditNote = event.data.object;
    console.log(`Credit note event: ${event.type} for Credit Note ID: ${creditNote.id}`);
    // Update records or customer accounts
}

function handlePaymentIntentEvent(event) {
    const paymentIntent = event.data.object;
    console.log(`Payment intent event: ${event.type} for Payment Intent ID: ${paymentIntent.id}`);
    // Update order status or perform actions based on the payment status
}

function handlePaymentLinkEvent(event) {
    const paymentLink = event.data.object;
    console.log(`Payment link event: ${event.type} for Payment Link ID: ${paymentLink.id}`);
    // Handle payment link creation or update
}

function handlePriceEvent(event) {
    const price = event.data.object;
    console.log(`Price event: ${event.type} for Price ID: ${price.id}`);
    // Update product pricing in your system
}

function handleProductEvent(event) {
    const product = event.data.object;
    console.log(`Product event: ${event.type} for Product ID: ${product.id}`);
    // Update product details in your database
}

function handleQuoteEvent(event) {
    const quote = event.data.object;
    console.log(`Quote event: ${event.type} for Quote ID: ${quote.id}`);
    // Update quote status or notify customer
}

function handleRefundEvent(event) {
    const refund = event.data.object;
    console.log(`Refund event: ${event.type} for Refund ID: ${refund.id}`);
    // Update the order status or notify customer of refund
}

function handleReviewEvent(event) {
    const review = event.data.object;
    console.log(`Review event: ${event.type} for Review ID: ${review.id}`);
    // Handle review status updates
}

function handleTerminalReaderEvent(event) {
    const reader = event.data.object;
    console.log(`Terminal reader event: ${event.type} for Reader ID: ${reader.id}`);
    // Handle terminal reader events
}

module.exports = router;
