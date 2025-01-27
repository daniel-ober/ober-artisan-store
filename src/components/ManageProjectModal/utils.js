import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const saveData = async (projectId, updatedFields) => {
  try {
    await setDoc(doc(db, "projects", projectId), updatedFields, { merge: true });
  } catch (error) {
    console.error("Error saving data:", error);
  }
};