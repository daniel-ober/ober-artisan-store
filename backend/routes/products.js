const express = require("express"); // ✅ Import Express
const router = express.Router(); // ✅ Initialize Express Router
const admin = require("firebase-admin"); // ✅ Firestore Admin SDK
const db = admin.firestore(); // ✅ Firestore Instance
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // ✅ Stripe Instance

router.post('/create-product', async (req, res) => {
    try {
        const { name, description, category, basePrice, depthUpgrades, reRingUpgrade } = req.body;

        if (!name || !description || !category || !basePrice) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log("🔹 Creating product in Stripe...");

        // Create the product in Stripe
        const stripeProduct = await stripe.products.create({
            name,
            description,
            metadata: {
                category,
            },
        });

        console.log(`✅ Stripe product created: ${stripeProduct.id}`);

        // Create Stripe Prices dynamically
        let stripePrices = {};
        for (const size in basePrice) {
            for (const depth in depthUpgrades) {
                const price = basePrice[size] + depthUpgrades[depth];

                const stripePrice = await stripe.prices.create({
                    product: stripeProduct.id,
                    unit_amount: price * 100,
                    currency: 'usd',
                    metadata: {
                        size,
                        depth,
                        reRing: "false",
                    },
                });

                console.log(`✅ Created Stripe price: ${stripePrice.id} for ${size}, ${depth}`);

                stripePrices[`${size}_${depth}`] = stripePrice.id;
            }
        }

        // Add re-ring prices
        for (const size in basePrice) {
            for (const depth in depthUpgrades) {
                const price = basePrice[size] + depthUpgrades[depth] + reRingUpgrade;

                const stripePrice = await stripe.prices.create({
                    product: stripeProduct.id,
                    unit_amount: price * 100,
                    currency: 'usd',
                    metadata: {
                        size,
                        depth,
                        reRing: "true",
                    },
                });

                console.log(`✅ Created Stripe price: ${stripePrice.id} for ${size}, ${depth} with ReRing`);

                stripePrices[`${size}_${depth}_reRing`] = stripePrice.id;
            }
        }

        // Save to Firestore
        const newProduct = {
            name,
            description,
            category,
            stripeProductId: stripeProduct.id,
            basePrice,
            depthUpgrades,
            reRingUpgrade,
            stripePrices,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const productRef = await db.collection('products').add(newProduct);
        console.log(`✅ Product saved in Firestore with ID: ${productRef.id}`);

        res.status(201).json({
            success: true,
            message: 'Product created successfully!',
            productId: productRef.id,
            stripeProductId: stripeProduct.id,
        });
    } catch (error) {
        console.error('❌ Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;