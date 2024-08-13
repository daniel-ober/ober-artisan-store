// src/components/SignUp.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Button, TextField, Typography } from '@mui/material';

function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');  // State to handle errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error message
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Handle successful sign-up (like redirecting to another page or showing a success message)
    } catch (error) {
      handleFirebaseError(error.code);  // Handle Firebase errors
    }
  };

  const handleFirebaseError = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        setError('This email is already in use. Please use a different email.');
        break;
      case 'auth/invalid-email':
        setError('Invalid email format. Please check your email and try again.');
        break;
      case 'auth/weak-password':
        setError('Your password is too weak. Please use a stronger password. Your strong password should be at least 8 characters long and include a combination of uppercase and lowercase letters, numbers, and special characters.');
        break;
      default:
        setError('Failed to sign up. Please try again.');
        break;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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
      {error && (
        <Typography color="error" variant="body2" sx={{ marginTop: 1 }}>
          {error}
        </Typography>
      )}
      <Button type="submit" variant="contained" color="primary">
        Sign Up
      </Button>
    </form>
  );
}

export default SignUp;
