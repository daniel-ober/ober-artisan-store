import { collection, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Ensure the correct path to your firebaseConfig file

const updateCarts = async () => {
  try {
    const cartsCollection = collection(db, "carts");
    const snapshot = await getDocs(cartsCollection);

    snapshot.forEach(async (cartDoc) => {
      const cartData = cartDoc.data();

      if (!cartData.userId) {
        console.log(`Updating cart ${cartDoc.id} with default userId`);
        await updateDoc(cartDoc.ref, { userId: "guest" });
      }
    });

    console.log("Finished updating carts.");
  } catch (error) {
    console.error("Error updating carts:", error);
  }
};

export default updateCarts;