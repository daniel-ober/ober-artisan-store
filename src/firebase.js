import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVc25oHEasEbY2MZcYrELQPepRFKGBTew",
  authDomain: "ober-artisan-sso.firebaseapp.com",
  projectId: "ober-artisan-sso",
  storageBucket: "ober-artisan-sso.appspot.com",
  messagingSenderId: "322968276683",
  appId: "1:322968276683:web:fe46371900ed485e8b954e",
  measurementId: "G-XCV94M7RV4"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// export const facebookProvider = new FacebookAuthProvider();