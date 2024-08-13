// src/SignInEmail.js
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; 
import { Button, TextField } from '@mui/material';  

const SignInEmail = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const auth = getAuth();

  const handleSignIn = async (event) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Email sign-in successful");
    } catch (error) {
      console.error("Error signing in with email:", error);
    }
  };

  return (
    <form onSubmit={handleSignIn}>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary">
        Sign In
      </Button>
    </form>
  );
};

export default SignInEmail;
