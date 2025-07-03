import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import inventorySeedData from '../data/inventorySeedData.json';

export const seedInventory = async () => {
  const inventoryRef = collection(db, 'inventory');
  for (const item of inventorySeedData) {
    await addDoc(inventoryRef, item);
    console.log(`Added: ${item.name}`);
  }
  console.log('Inventory seeding complete!');
};