import stripePackage from 'stripe';

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

// Create Stripe Product
export const createStripeProduct = async (name, description, price) => {
    const product = await stripe.products.create({ name, description });
    const priceObj = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(price * 100),
        currency: 'usd',
    });
    return { product, price: priceObj };
};

// Create Checkout Session
export const createCheckoutSession = async (products, userId) => {
    const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // Generate guestToken
    console.log('Generated guestToken:', guestToken); // Debugging log

    const lineItems = products.map(product => ({
        price_data: {
            currency: 'usd',
            product_data: { name: product.name, description: product.description },
            unit_amount: Math.round(product.price * 100),
        },
        quantity: product.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.CLIENT_URL}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
        cancel_url: `${process.env.CLIENT_URL}/cart`,
        metadata: { userId, guestToken }, // Add guestToken to metadata
    });

    console.log('Stripe session created:', {
        sessionId: session.id,
        guestToken,
        metadata: session.metadata,
    }); // Debugging log

    return { session, guestToken };
};

// Retrieve Checkout Session
export const retrieveCheckoutSession = async (sessionId) => {
    return await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items.data.price.product'], // Expand to include detailed product data
    });
};
