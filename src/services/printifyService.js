// src/services/printifyService.js
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// Read available options (sizes/colors) from the merchProducts document we saved during ingest/sync
export async function fetchPrintifyProductOptions(productId) {
  const ref = doc(db, 'merchProducts', productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Product not found');
  const data = snap.data();

  // Many themes want these as simple arrays; derive from variants/options
  // Prefer normalized options if present; otherwise derive from variants[]
  const sizes = new Set();
  const colors = new Set();

  (data.variants || []).forEach((v) => {
    const opt = v.options || {};
    if (opt.size) sizes.add(opt.size);
    if (opt.color) colors.add(opt.color);
  });

  return {
    sizes: Array.from(sizes),
    colors: Array.from(colors),
    raw: { options: data.options || null, variants: data.variants || [] },
  };
}