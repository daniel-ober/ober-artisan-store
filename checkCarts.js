const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function checkCarts() {
  const snapshot = await db.collection("carts").limit(5).get();
  if (snapshot.empty) {
    // console.log("🚨 No carts found in Firestore.");
    return;
  }

  snapshot.forEach(doc => {
    // console.log(`🛒 Cart ID: ${doc.id}, User ID: ${doc.data().userId || "❌ Missing userId"}`);
  });
}

checkCarts();
