import stripePackage from 'stripe';

// Load Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.REACT_APP_STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Stripe secret key is missing. Please ensure it is set in your environment variables.');
}

// Initialize Stripe with the secret key
const stripe = stripePackage(stripeSecretKey);

// Lock mechanism to prevent concurrent calls
let isCreatingProduct = false;

/**
 * Create a Stripe Product and associated Price.
 * @param {string} name - Name of the product.
 * @param {string} description - Description of the product.
 * @param {number} price - Price of the product in USD.
 * @param {Array<string>} images - Array of image URLs for the product.
 * @param {Object} metadata - Metadata for the product (e.g., SKU, firestoreProductId).
 * @returns {Promise<{product: object, price: object}>} - The created product and price objects.
 */
export const createStripeProduct = async (name, description, price, images = [], metadata = {}) => {
  console.log(`[createStripeProduct] Called with: ${JSON.stringify({ name, description, price, images, metadata })}`);

  if (isCreatingProduct) {
    console.warn('[createStripeProduct] Another product creation is already in progress.');
    throw new Error('Product creation is currently in progress. Please try again later.');
  }

  try {
    isCreatingProduct = true; // Lock the function

    if (!name || !description || typeof price !== 'number' || price <= 0) {
      throw new Error('Invalid input: Name, description, and a positive price are required.');
    }

    if (!Array.isArray(images)) {
      throw new Error('Invalid input: Images must be an array of URLs.');
    }

    console.log(`[createStripeProduct] Creating Stripe product...`);
    const product = await stripe.products.create({
      name,
      description,
      images,
      metadata, // Include metadata (e.g., SKU, firestoreProductId)
    });
    console.log(`[createStripeProduct] Product created: ${JSON.stringify(product)}`);

    console.log(`[createStripeProduct] Creating price for product ID: ${product.id}`);
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(price * 100),
      currency: 'usd',
    });
    console.log(`[createStripeProduct] Price created: ${JSON.stringify(priceObj)}`);

    return { product, price: priceObj };
  } catch (error) {
    console.error(`[createStripeProduct] Error: ${error.message}`);
    throw new Error('Failed to create Stripe product.');
  } finally {
    isCreatingProduct = false; // Release lock
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
  console.log(`[updateStripeProduct] Called with: ${JSON.stringify({ productId, name, description, images, newPrice, currentPriceId })}`);
  
  try {
    // Update the product details
    console.log(`[updateStripeProduct] Updating product ID: ${productId}`);
    await stripe.products.update(productId, {
      name,
      description,
      images,
    });
    console.log(`[updateStripeProduct] Product updated successfully.`);

    let newPriceId;

    // Check if the price has changed
    if (currentPriceId && newPrice) {
      console.log(`[updateStripeProduct] Retrieving current price: ${currentPriceId}`);
      const currentPriceObj = await stripe.prices.retrieve(currentPriceId);

      if (currentPriceObj.unit_amount !== Math.round(newPrice * 100)) {
        console.log(`[updateStripeProduct] Creating a new price for updated price.`);
        const newPriceObj = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(newPrice * 100),
          currency: 'usd',
        });
        newPriceId = newPriceObj.id;
        console.log(`[updateStripeProduct] New price created: ${newPriceId}`);
      }
    }

    return { newPriceId };
  } catch (error) {
    console.error(`[updateStripeProduct] Error: ${error.message}`);
    throw new Error('Failed to update Stripe product.');
  }
};

/**
 * Fetch prices associated with a Stripe product.
 * @param {string} productId - The ID of the Stripe product.
 * @returns {Promise<Array>} - An array of price objects.
 */
export const fetchStripePrices = async (productId) => {
  try {
    console.log("[fetchStripePrices] Fetching prices for product ID:", productId);

    if (!productId) {
      throw new Error('Invalid input: Product ID is required.');
    }

    const prices = await stripe.prices.list({
      product: productId,
      active: true,
    });

    console.log("[fetchStripePrices] Prices retrieved:", prices.data);
    return prices.data;
  } catch (error) {
    console.error("[fetchStripePrices] Error:", error.message);
    throw new Error('Failed to fetch Stripe prices.');
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
    console.log("[createCheckoutSession] Creating session for products:", products);

    if (!Array.isArray(products) || products.length === 0) {
      throw new Error('Invalid input: At least one product is required.');
    }

    const guestToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const lineItems = products.map((product) => {
      if (!product.name || !product.stripePriceId || !product.quantity) {
        throw new Error('Invalid product data: Each product must have a name, Stripe price ID, and quantity.');
      }
      return {
        price: product.stripePriceId,
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

    console.log("[createCheckoutSession] Session created:", { sessionId: session.id, guestToken });
    return { session, guestToken };
  } catch (error) {
    console.error("[createCheckoutSession] Error:", error.message);
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
    console.log("[retrieveCheckoutSession] Retrieving session ID:", sessionId);

    if (!sessionId) {
      throw new Error('Invalid input: Session ID is required.');
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    console.log("[retrieveCheckoutSession] Session retrieved:", session);
    return session;
  } catch (error) {
    console.error("[retrieveCheckoutSession] Error:", error.message);
    throw new Error('Failed to retrieve Stripe checkout session.');
  }
};

/**
 * List all Stripe products.
 * @returns {Promise<Array>} - An array of Stripe products.
 */
export const listStripeProducts = async () => {
  try {
    console.log("[listStripeProducts] Listing all products...");

    const products = await stripe.products.list();
    console.log("[listStripeProducts] Products retrieved:", products.data);
    return products.data;
  } catch (error) {
    console.error("[listStripeProducts] Error:", error.message);
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
    console.log("[deleteStripeProduct] Deleting product with ID:", productId);

    await stripe.products.del(productId);
    console.log("[deleteStripeProduct] Product deleted:", productId);
  } catch (error) {
    console.error("[deleteStripeProduct] Error:", error.message);
    throw new Error('Failed to delete Stripe product.');
  }
};