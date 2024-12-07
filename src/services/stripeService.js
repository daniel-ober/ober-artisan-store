import stripePackage from 'stripe';

// Load Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.REACT_APP_STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Stripe secret key is missing. Please ensure it is set in your environment variables.');
}

// Initialize Stripe with the secret key
const stripe = stripePackage(stripeSecretKey);

/**
 * Create a Stripe Product and associated Price.
 * @param {string} name - Name of the product.
 * @param {string} description - Description of the product.
 * @param {number} price - Price of the product in USD.
 * @param {Array<string>} images - Array of image URLs for the product.
 * @returns {Promise<{product: object, price: object}>} - The created product and price objects.
 */
export const createStripeProduct = async (name, description, price, images = []) => {
  try {
    if (!name || !description || typeof price !== 'number' || price <= 0) {
      throw new Error('Invalid input: Name, description, and a positive price are required.');
    }

    if (!Array.isArray(images)) {
      throw new Error('Invalid input: Images must be an array of URLs.');
    }

    const product = await stripe.products.create({
      name,
      description,
      images, // Include image URLs
    });

    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100), // Convert price to cents
      currency: 'usd',
    });

    console.log('Stripe Product Created:', { product, priceObj });
    return { product, price: priceObj };
  } catch (error) {
    console.error('Error creating Stripe product:', error.message);
    throw new Error('Failed to create Stripe product.');
  }
};

/**
 * Update a Stripe Product and optionally create a new Price if the price changes.
 * @param {string} productId - Stripe product ID.
 * @param {string} name - Name of the product.
 * @param {string} description - Description of the product.
 * @param {Array<string>} images - Array of image URLs.
 * @param {number} newPrice - New price of the product (in USD).
 * @param {string} currentPriceId - Current Stripe price ID.
 * @returns {Promise<{newPriceId?: string}>} - Updated Stripe product and optionally a new price ID.
 */
export const updateStripeProduct = async (productId, name, description, images = [], newPrice, currentPriceId) => {
  try {
    await stripe.products.update(productId, {
      name,
      description,
      images, // Update product images
    });

    let newPriceId;

    const currentPriceObj = await stripe.prices.retrieve(currentPriceId);
    if (currentPriceObj.unit_amount !== Math.round(newPrice * 100)) {
      const newPriceObj = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(newPrice * 100),
        currency: 'usd',
      });
      newPriceId = newPriceObj.id;
    }

    console.log('Stripe Product Updated:', { productId, newPriceId });
    return { newPriceId };
  } catch (error) {
    console.error('Error updating Stripe product:', error.message);
    throw new Error('Failed to update Stripe product.');
  }
};

/**
 * Create a Checkout Session for Stripe payment.
 * @param {Array} products - List of products to purchase.
 * @param {string} userId - User ID for the session (optional).
 * @returns {Promise<{session: object, guestToken: string}>} - The created session and guest token.
 */
export const createCheckoutSession = async (products, userId) => {
  try {
    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Invalid input: At least one product is required.');
    }

    const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const lineItems = products.map((product) => {
      if (!product.name || typeof product.price !== 'number' || product.price <= 0 || !product.quantity) {
        throw new Error('Invalid product data: Each product must have a name, price, and quantity.');
      }
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description || '',
            images: product.images || [],
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: product.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/checkout-summary?session_id={CHECKOUT_SESSION_ID}&guest_token=${guestToken}`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
      allow_promotion_codes: true,
      metadata: { userId: userId || 'guest', guestToken },
    });

    console.log('Stripe Checkout Session Created:', { sessionId: session.id, guestToken });
    return { session, guestToken };
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error.message);
    throw new Error('Failed to create Stripe checkout session.');
  }
};

/**
 * Retrieve a Stripe Checkout Session by ID.
 * @param {string} sessionId - The ID of the checkout session to retrieve.
 * @returns {Promise<object>} - The retrieved session object.
 */
export const retrieveCheckoutSession = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('Invalid input: Session ID is required.');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    console.log('Stripe Checkout Session Retrieved:', { sessionId });
    return session;
  } catch (error) {
    console.error('Error retrieving Stripe checkout session:', error.message);
    throw new Error('Failed to retrieve Stripe checkout session.');
  }
};

/**
 * List all Stripe products.
 * @returns {Promise<Array>} - An array of Stripe products.
 */
export const listStripeProducts = async () => {
  try {
    const products = await stripe.products.list();
    console.log('Stripe Products Retrieved:', products.data);
    return products.data;
  } catch (error) {
    console.error('Error listing Stripe products:', error.message);
    throw new Error('Failed to retrieve Stripe products.');
  }
};

/**
 * Delete a Stripe product by ID.
 * @param {string} productId - The ID of the product to delete.
 * @returns {Promise<void>}
 */
export const deleteStripeProduct = async (productId) => {
  try {
    await stripe.products.del(productId);
    console.log(`Stripe Product Deleted: ${productId}`);
  } catch (error) {
    console.error('Error deleting Stripe product:', error.message);
    throw new Error('Failed to delete Stripe product.');
  }
};
