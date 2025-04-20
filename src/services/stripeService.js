// // src/services/stripeService.js
// import stripePackage from 'stripe';
// // Load Stripe secret key from environment variables
// const stripeSecretKey = process.env.REACT_APP_STRIPE_SECRET_KEY;
// if (!stripeSecretKey) {
//   throw new Error("Stripe secret key is missing. Please check your environment variables.");
// }

// // Initialize Stripe with the secret key
// const stripe = stripePackage(stripeSecretKey);

// // Lock mechanism to prevent concurrent calls
// let isCreatingProduct = false;

// /**
//  * Create a Stripe Product.
//  * @param {string} name - Name of the product.
//  * @param {string} description - Description of the product.
//  * @param {Array<string>} images - Array of image URLs for the product.
//  * @param {Object} metadata - Metadata for the product (e.g., SKU, firestoreProductId).
//  * @returns {Promise<object>} - The created product object.
//  */
// export const createStripeProduct = async (name, description, images = [], metadata = {}) => {
//   // console.log(`[createStripeProduct] Called with: ${JSON.stringify({ name, description, images, metadata })}`);

//   if (isCreatingProduct) {
//     console.warn('[createStripeProduct] Another product creation is already in progress.');
//     throw new Error('Product creation is currently in progress. Please try again later.');
//   }

//   try {
//     isCreatingProduct = true; // Lock the function

//     if (!name || !description) {
//       throw new Error('Invalid input: Name and description are required.');
//     }

//     if (!Array.isArray(images)) {
//       throw new Error('Invalid input: Images must be an array of URLs.');
//     }

//     // console.log(`[createStripeProduct] Creating Stripe product...`);
//     const product = await stripe.products.create({
//       name,
//       description,
//       images,
//       metadata, // Include metadata (e.g., SKU, firestoreProductId)
//     });
//     // console.log(`[createStripeProduct] Product created: ${JSON.stringify(product)}`);

//     return product;
//   } catch (error) {
//     console.error(`[createStripeProduct] Error: ${error.message}`);
//     throw new Error('Failed to create Stripe product.');
//   } finally {
//     isCreatingProduct = false; // Release lock
//   }
// };

// /**
//  * Create a Stripe Price for a given product.
//  * @param {string} productId - The Stripe product ID.
//  * @param {number} unitAmount - The price in cents.
//  * @returns {Promise<object>} - The created price object.
//  */
// export const createStripePrice = async (productId, unitAmount) => {
//   try {
//     if (!productId || !unitAmount) {
//       throw new Error("Invalid input: Product ID and unit amount are required.");
//     }

//     const price = await stripe.prices.create({
//       product: productId,
//       unit_amount: unitAmount,
//       currency: 'usd',
//     });

//     // console.log(`✅ Stripe Price Created: ${price.id} for Product: ${productId}`);
//     return price;
//   } catch (error) {
//     console.error("❌ Error creating Stripe price:", error);
//     throw error;
//   }
// };

// /**
//  * Create a Stripe Product and its associated Pricing Options.
//  * @param {string} name - Name of the product.
//  * @param {string} description - Description of the product.
//  * @param {Array<string>} images - Image URLs.
//  * @param {Array} pricingOptions - Array of pricing options with size, depth, price, and reRing info.
//  * @param {Object} metadata - Additional metadata.
//  * @returns {Promise<{product: object, prices: object[]}>} - Created product and associated prices.
//  */
// export const createStripeProductWithPrices = async (name, description, images = [], pricingOptions = [], metadata = {}) => {
//   try {
//     // Create Stripe product
//     const product = await createStripeProduct(name, description, images, metadata);

//     // Create prices for each pricing option
//     const prices = await Promise.all(
//       pricingOptions.map(async (option) => {
//         return {
//           ...option,
//           stripePriceId: (await createStripePrice(product.id, option.price * 100)).id,
//         };
//       })
//     );

//     return { product, prices };
//   } catch (error) {
//     console.error(`[createStripeProductWithPrices] Error: ${error.message}`);
//     throw new Error('Failed to create Stripe product with pricing options.');
//   }
// };

// /**
//  * Update a Stripe Product and optionally create a new Price if the price changes.
//  * @param {string} productId - Stripe product ID.
//  * @param {string} name - Name of the product.
//  * @param {string} description - Description of the product.
//  * @param {Array<string>} images - Array of image URLs.
//  * @param {Array} pricingOptions - Array of new pricing options.
//  * @returns {Promise<{newPrices: object[]}>} - Updated Stripe product and associated new prices.
//  */
// export const updateStripeProductWithPrices = async (productId, name, description, images = [], pricingOptions = []) => {
//   try {
//     // Update the product details
//     // console.log(`[updateStripeProductWithPrices] Updating product ID: ${productId}`);
//     await stripe.products.update(productId, {
//       name,
//       description,
//       images,
//     });

//     // console.log(`[updateStripeProductWithPrices] Product updated successfully.`);

//     // Update pricing options
//     const newPrices = await Promise.all(
//       pricingOptions.map(async (option) => {
//         if (option.stripePriceId) {
//           // Fetch current price to check if an update is needed
//           const currentPrice = await stripe.prices.retrieve(option.stripePriceId);
//           if (currentPrice.unit_amount !== option.price * 100) {
//             // console.log(`🔄 Updating Stripe Price: ${option.stripePriceId}`);
//             return {
//               ...option,
//               stripePriceId: (await createStripePrice(productId, option.price * 100)).id,
//             };
//           }
//           return option;
//         } else {
//           // Create a new price if there's no existing Stripe Price ID
//           // console.log(`➕ Creating new Stripe Price for product: ${productId}`);
//           return {
//             ...option,
//             stripePriceId: (await createStripePrice(productId, option.price * 100)).id,
//           };
//         }
//       })
//     );

//     return { newPrices };
//   } catch (error) {
//     console.error(`[updateStripeProductWithPrices] Error: ${error.message}`);
//     throw new Error('Failed to update Stripe product with new pricing options.');
//   }
// };

// /**
//  * Fetch prices associated with a Stripe product.
//  * @param {string} productId - The ID of the Stripe product.
//  * @returns {Promise<Array>} - An array of price objects.
//  */
// export const fetchStripePrices = async (productId) => {
//   try {
//     // console.log("[fetchStripePrices] Fetching prices for product ID:", productId);

//     if (!productId) {
//       throw new Error('Invalid input: Product ID is required.');
//     }

//     const prices = await stripe.prices.list({
//       product: productId,
//       active: true,
//     });

//     // console.log("[fetchStripePrices] Prices retrieved:", prices.data);
//     return prices.data;
//   } catch (error) {
//     console.error("[fetchStripePrices] Error:", error.message);
//     throw new Error('Failed to fetch Stripe prices.');
//   }
// };

// /**
//  * Delete a Stripe product by ID.
//  * @param {string} productId - The ID of the product to delete.
//  * @returns {Promise<void>}
//  */
// export const deleteStripeProduct = async (productId) => {
//   try {
//     // console.log("[deleteStripeProduct] Deleting product with ID:", productId);
//     await stripe.products.del(productId);
//     // console.log("[deleteStripeProduct] Product deleted:", productId);
//   } catch (error) {
//     console.error("[deleteStripeProduct] Error:", error.message);
//     throw new Error('Failed to delete Stripe product.');
//   }
// };