import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

function SignOut() {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log('User signed out');
      // Optionally, redirect to home or sign-in page
      window.location.href = '/signin-email';
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <button onClick={handleSignOut}>
      Sign Out
    </button>
  );
}

export default SignOut;
