require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// OpenAI Initialization (existing code)
const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure to use the correct environment variable
});
console.log('OpenAI API initialized successfully!');

// Create a minimal server for testing
const app = express();

// Middleware for raw body parsing (Stripe Webhook)
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Webhook Endpoint
app.post(
    '/api/webhook',
    express.raw({ type: 'application/json' }), // Ensures raw body for signature verification
    (req, res) => {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
      try {
        const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        console.log(`Received Stripe event: ${event.type}`);
  
        // Handle specific event types
        if (event.type === 'payment_intent.succeeded') {
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
        }
  
        res.status(200).send({ received: true });
      } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    }
  );
  
// Run the server for testing
const PORT = 4848; // Use a different port to isolate testing
app.listen(PORT, () => {
    console.log(`Test server is running on port ${PORT}`);
});
