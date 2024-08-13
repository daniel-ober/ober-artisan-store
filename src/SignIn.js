import React from 'react';
import { auth, googleProvider, facebookProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

function SignIn() {
  const handleSignIn = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Handle result (e.g., user info)
      console.log(result.user);
    } catch (error) {
      console.error("Error signing in: ", error);
    }
  };

  return (
    <div>
      <button onClick={() => handleSignIn(googleProvider)}>Sign in with Google</button>
      {/* <button onClick={() => handleSignIn(facebookProvider)}>Sign in with Facebook</button> */}
      {/* Add sign in with Apple and Email as needed */}
    </div>
  );
}

export default SignIn;