import { firestore } from '../firebaseConfig'; // Correct the import to 'firestore'
import { doc, getDoc, setDoc, deleteDoc, collection, query, getDocs, writeBatch } from 'firebase/firestore';

const cartCollection = (userId) => collection(firestore, `carts/${userId}/items`);

export const addItemToCart = async (userId, productId, quantity) => {
  const itemRef = doc(cartCollection(userId), productId);
  await setDoc(itemRef, { quantity }, { merge: true });
};

export const getCartItems = async (userId) => {
  const itemsRef = cartCollection(userId);
  const q = query(itemsRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ productId: doc.id, ...doc.data() }));
};

export const removeItemFromCart = async (userId, productId) => {
  const itemRef = doc(cartCollection(userId), productId);
  await deleteDoc(itemRef);
};

export const clearCart = async (userId) => {
  const itemsRef = cartCollection(userId);
  const q = query(itemsRef);
  const querySnapshot = await getDocs(q);
  
  const batch = writeBatch(firestore); // Use 'firestore' instead of 'db'
  querySnapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
};
