import React from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig';

function SignInGoogle() {
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // Handle post sign-in actions (like redirect)
    } catch (error) {
      console.error("Error signing in with Google:", error.message);
    }
  };

  return (
    <button onClick={handleSignIn}>
      Sign In with Google
    </button>
  );
}

export default SignInGoogle;
