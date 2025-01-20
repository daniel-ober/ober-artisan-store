// Import dotenv to load environment variables
require('dotenv').config({ path: `.env.dev` });

// Log to confirm the key is being loaded
console.log('Loaded Stripe Key:', process.env.STRIPE_SECRET_KEY);

// Import Stripe library
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Function to fetch line items and card details for a given session ID
async function testFetchLineItems(sessionId) {
  try {
    console.log('Fetching line items for session ID:', sessionId);

    // Step 1: Fetch the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Step 2: Fetch line items
    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      expand: ['data.price.product'],
    });

    console.log('Fetched Line Items:');
    lineItems.data.forEach((item) => {
      console.log('Item Details:');
      console.log('  - Name:', item.price.product.name);
      console.log('  - Description:', item.price.product.description);
      console.log('  - Quantity:', item.quantity);
      console.log('  - Unit Price:', item.price.unit_amount / 100, item.price.currency.toUpperCase());
      console.log('  - Total Amount:', item.amount_total / 100, item.currency.toUpperCase());
    });

    // Step 3: Retrieve payment intent details to get card info
    if (session.payment_intent) {
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);

      console.log('Card Details:');
      console.log('  - Brand:', paymentMethod.card.brand);
      console.log('  - Last Four:', paymentMethod.card.last4);
    } else {
      console.log('No payment_intent associated with this session.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Replace this with the actual session ID you want to test
const sessionId = 'cs_test_b1aOerGaapQh6lCBEPIQ6EtcjcyPXiUS6WqeSPch0zLBT7PY4dpbece29z';
testFetchLineItems(sessionId);