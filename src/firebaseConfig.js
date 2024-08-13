import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyDVc25oHEasEbY2MZcYrELQPepRFKGBTew",
    authDomain: "ober-artisan-sso.firebaseapp.com",
    projectId: "ober-artisan-sso",
    storageBucket: "ober-artisan-sso.appspot.com",
    messagingSenderId: "322968276683",
    appId: "1:322968276683:web:fe46371900ed485e8b954e",
    measurementId: "G-XCV94M7RV4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

export { auth };
