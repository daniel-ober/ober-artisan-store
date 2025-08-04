// updateHeritagePricing.js
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // <-- path to your downloaded key

// ✅ Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateHeritagePricing() {
  const heritageRef = db.collection("products").doc("heritage");

  // ✅ Updated pricingOptions with all new depths and correct Stripe IDs
  const pricingOptions = [
    // === Size 12 (6 Lugs) ===
    { size: "12", depth: 5.0, price: 850, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NGZOLBvNz", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 5.5, price: 900, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 6.0, price: 950, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4N1GmEZOF3", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 6.5, price: 1100, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 7.0, price: 1050, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NRjr9kIMl", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 7.5, price: 1300, reRing: false, stripePriceId: "price_1RsF8BJbbx8jAR4NAD1069LT", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 8.0, price: 1350, reRing: false, stripePriceId: "price_1RsF7XJbbx8jAR4NQXuGGjKh", lugQuantity: 6, staveQuantity: 12 },

    // === Size 12 (8 Lugs) ===
    { size: "12", depth: 5.0, price: 850, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NGZOLBvNz", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: 5.5, price: 900, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: 6.0, price: 950, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4N1GmEZOF3", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: 6.5, price: 1100, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: 7.0, price: 1050, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NRjr9kIMl", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: 7.5, price: 1300, reRing: false, stripePriceId: "price_1RsF8BJbbx8jAR4NAD1069LT", lugQuantity: 8, staveQuantity: 16 },
    { size: "12", depth: 8.0, price: 1350, reRing: false, stripePriceId: "price_1RsF7XJbbx8jAR4NQXuGGjKh", lugQuantity: 8, staveQuantity: 16 },

    // === Size 13 (8 Lugs) ===
    { size: "13", depth: 5.0, price: 950, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4N1GmEZOF3", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 5.5, price: 1000, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 6.0, price: 1050, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NRjr9kIMl", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 6.5, price: 1200, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 7.0, price: 1150, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NaVkdEtm9", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 7.5, price: 1400, reRing: false, stripePriceId: "price_1RsF8UJbbx8jAR4N0oQTTNmJ", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 8.0, price: 1450, reRing: false, stripePriceId: "price_1RsF7nJbbx8jAR4NGylXVUVe", lugQuantity: 8, staveQuantity: 16 },

    // === Size 14 (8 Lugs) ===
    { size: "14", depth: 5.0, price: 1050, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NRjr9kIMl", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 5.5, price: 1100, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 6.0, price: 1150, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NaVkdEtm9", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 6.5, price: 1300, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 7.0, price: 1250, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NKvDeUXJr", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 7.5, price: 1500, reRing: false, stripePriceId: "price_1RsF8BJbbx8jAR4NAD1069LT", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 8.0, price: 1550, reRing: false, stripePriceId: "price_1RsF8UJbbx8jAR4N0oQTTNmJ", lugQuantity: 8, staveQuantity: 16 },

    // === Size 14 (10 Lugs) ===
    { size: "14", depth: 5.0, price: 1050, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NRjr9kIMl", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: 5.5, price: 1100, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: 6.0, price: 1150, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NaVkdEtm9", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: 6.5, price: 1300, reRing: false, stripePriceId: "price_1RsF6gJbbx8jAR4NUt7ZzVSF", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: 7.0, price: 1250, reRing: false, stripePriceId: "price_1R4Z2bJbbx8jAR4NKvDeUXJr", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: 7.5, price: 1500, reRing: false, stripePriceId: "price_1RsF8BJbbx8jAR4NAD1069LT", lugQuantity: 10, staveQuantity: 20 },
    { size: "14", depth: 8.0, price: 1550, reRing: false, stripePriceId: "price_1RsF8UJbbx8jAR4N0oQTTNmJ", lugQuantity: 10, staveQuantity: 20 },

    // === Size 14 (10 Lugs with Re-Rings) ===
    { size: "14", depth: 5.0, price: 1200, reRing: true, stripePriceId: "price_1R4Z2bJbbx8jAR4NObBaiOtY", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 5.5, price: 1250, reRing: true, stripePriceId: "price_1RsF7XJbbx8jAR4NQXuGGjKh", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 6.0, price: 1300, reRing: true, stripePriceId: "price_1R4Z2bJbbx8jAR4Ncz4Jm5TP", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 6.5, price: 1450, reRing: true, stripePriceId: "price_1RsF7nJbbx8jAR4NGylXVUVe", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 7.0, price: 1400, reRing: true, stripePriceId: "price_1R4Z2bJbbx8jAR4NyCvWxpbw", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 7.5, price: 1650, reRing: true, stripePriceId: "price_1RsF8uJbbx8jAR4Nd75KsMN9", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 8.0, price: 1700, reRing: true, stripePriceId: "price_1RsF9BJbbx8jAR4N7bTad0ZA", lugQuantity: 10, staveQuantity: 10 },
  ];

  await heritageRef.update({ pricingOptions });
  console.log("✅ Heritage pricingOptions successfully updated!");
}

updateHeritagePricing().then(() => process.exit());