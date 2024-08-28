// server.js
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')('your-stripe-secret-key');

const app = express();
app.use(bodyParser.json());

app.post('/create-checkout-session', async (req, res) => {
    const { items } = req.body;

    const lineItems = items.map((item) => ({
        price_data: {
            currency: 'usd',
            product_data: {
                name: item.name,
            },
            unit_amount: item.price * 100, // Stripe expects the price in cents
        },
        quantity: item.quantity,
    }));

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            ui_mode: 'embedded', // Set ui_mode to embedded
            return_url: 'http://localhost:3000/checkout/return?session_id={CHECKOUT_SESSION_ID}', // Use return_url with session ID template
        });

        res.json({ clientSecret: session.client_secret }); // Return clientSecret for client-side usage
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(4242, () => console.log('Server running on port 4242'));
