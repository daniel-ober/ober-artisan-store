const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateFeuzonPricing() {
  const feuzonRef = db.collection("products").doc("feuzon");

  // ✅ NEW pricingOptions with updated Stripe IDs
  const updatedPricing = [
    { size: "12", depth: 5.0, price: 1050, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NEF9lvUsT", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 5.5, price: 1100, reRing: false, stripePriceId: "price_1RsDmXJbbx8jAR4NQo5qBz1b", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 6.0, price: 1150, reRing: false, stripePriceId: "price_1R27SXJbbx8jAR4NXYEVF1QG", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 6.5, price: 1200, reRing: false, stripePriceId: "price_1RsDtxJbbx8jAR4NTBqywXSW", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 7.0, price: 1250, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NM6z6jrHA", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 7.5, price: 1300, reRing: false, stripePriceId: "price_1RsDuZJbbx8jAR4N8CLUfiRE", lugQuantity: 6, staveQuantity: 12 },
    { size: "12", depth: 8.0, price: 1350, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NMiSM1GeA", lugQuantity: 6, staveQuantity: 12 },

    { size: "13", depth: 5.0, price: 1150, reRing: false, stripePriceId: "price_1R27SXJbbx8jAR4NXYEVF1QG", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 5.5, price: 1200, reRing: false, stripePriceId: "price_1RsDtxJbbx8jAR4NTBqywXSW", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 6.0, price: 1250, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NM6z6jrHA", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 6.5, price: 1300, reRing: false, stripePriceId: "price_1RsDuZJbbx8jAR4N8CLUfiRE", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 7.0, price: 1350, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NMiSM1GeA", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 7.5, price: 1400, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NdqYjsTu4", lugQuantity: 8, staveQuantity: 16 },
    { size: "13", depth: 8.0, price: 1450, reRing: false, stripePriceId: "price_1RsDvdJbbx8jAR4N6UnNUg6G", lugQuantity: 8, staveQuantity: 16 },

    { size: "14", depth: 5.0, price: 1250, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NM6z6jrHA", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 5.5, price: 1300, reRing: false, stripePriceId: "price_1RsDuZJbbx8jAR4N8CLUfiRE", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 6.0, price: 1350, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NMiSM1GeA", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 6.5, price: 1400, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NdqYjsTu4", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 7.0, price: 1450, reRing: false, stripePriceId: "price_1RsDvdJbbx8jAR4N6UnNUg6G", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 7.5, price: 1500, reRing: false, stripePriceId: "price_1R27SWJbbx8jAR4NdqKf4xVY", lugQuantity: 8, staveQuantity: 16 },
    { size: "14", depth: 8.0, price: 1550, reRing: false, stripePriceId: "price_1RsDw7Jbbx8jAR4N1ZV8C9oJ", lugQuantity: 8, staveQuantity: 16 },

    { size: "14", depth: 5.0, price: 1400, reRing: true, stripePriceId: "price_1R27SWJbbx8jAR4NdqYjsTu4", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 5.5, price: 1450, reRing: true, stripePriceId: "price_1RsDvdJbbx8jAR4N6UnNUg6G", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 6.0, price: 1500, reRing: true, stripePriceId: "price_1R27SWJbbx8jAR4NdqKf4xVY", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 6.5, price: 1550, reRing: true, stripePriceId: "price_1RsDw7Jbbx8jAR4N1ZV8C9oJ", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 7.0, price: 1600, reRing: true, stripePriceId: "price_1R27SWJbbx8jAR4N4gpm2LxA", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 7.5, price: 1650, reRing: true, stripePriceId: "price_1RsEGxJbbx8jAR4NixjRKB7U", lugQuantity: 10, staveQuantity: 10 },
    { size: "14", depth: 8.0, price: 1700, reRing: true, stripePriceId: "price_1RsEHVJbbx8jAR4Nv75VZFJC", lugQuantity: 10, staveQuantity: 10 },
  ];

  // ✅ Update Firestore
  await feuzonRef.update({ pricingOptions: updatedPricing });
  console.log("✅ Successfully updated FEUZØN pricing in Firestore!");
}

updateFeuzonPricing()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error updating pricing:", err);
    process.exit(1);
  });