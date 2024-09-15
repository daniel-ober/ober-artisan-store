import { generateAlphanumericID } from '../utils/alphanumericGenerator';
import { getFirestore, doc, setDoc } from "firebase/firestore";
const db = getFirestore();

export const createInquiry = async (inquiryData) => {
  const inquiryId = generateAlphanumericID(20);
  const inquiryRef = doc(db, "inquiries", inquiryId);

  await setDoc(inquiryRef, {
    ...inquiryData,
    id: inquiryId
  });

  return inquiryId;
};
