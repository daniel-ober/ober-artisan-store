// src/SignInGoogle.js
import React from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust the path if the file is in a different directory
import { Button } from '@mui/material';  // Ensure @mui/material is installed

const SignInGoogle = () => {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider);
      console.log("Google sign-in successful");
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <Button onClick={handleSignIn} variant="contained" color="primary">
      Sign in with Google
    </Button>
  );
};

export default SignInGoogle;
