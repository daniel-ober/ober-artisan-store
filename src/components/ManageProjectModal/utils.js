import { doc, setDoc } from "firebase/firestore";
import { db } from '../../firebaseConfig';

export const saveData = async (projectId, updatedFields) => {
  try {
    await setDoc(doc(db, "projects", projectId), updatedFields, { merge: true });
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

export const formatDate = (value) => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return new Date(value).toLocaleString();
  if (value?.seconds) return new Date(value.seconds * 1000).toLocaleString();
  if (value instanceof Date) return value.toLocaleString();
  return 'Invalid date';
};