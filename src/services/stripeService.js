import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Initialize Firebase and Firestore
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to create checkout session
export const createCheckoutSession = async (products, userId) => {
  const response = await fetch('/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ products, userId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create checkout session: ${errorText}`);
  }

  const session = await response.json();
  return session.url;
};

// Function to create a product in Stripe and return the product and price IDs
export const createStripeProduct = async (productData) => {
  const apiUrl = 'http://localhost:4949/api' || process.env.REACT_APP_API_URL;
  
  const response = await fetch(`${apiUrl}/create-stripe-product`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const errorText = await response.text(); // Get error response for debugging
    throw new Error(`Failed to create Stripe product: ${errorText}`);
  }

  const product = await response.json();
  console.log('Product created in Stripe:', product); // Log the created product
  return product; // Ensure this matches your backend response
};
