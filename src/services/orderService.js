import { generateNumericID } from '../utils/numericIDGenerator';
import { getFirestore, doc, setDoc } from "firebase/firestore";
const db = getFirestore();

export const createOrder = async (orderData) => {
  const orderId = generateNumericID();
  const orderRef = doc(db, "orders", orderId.toString());

  await setDoc(orderRef, {
    ...orderData,
    id: orderId
  });

  return orderId;
};
