// src/components/SignInEmail.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Button, TextField, Typography } from '@mui/material';

function SignInEmail() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');  // State to handle errors

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Reset error message
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Handle successful login (like redirecting to another page)
    } catch (error) {
      setError('Failed to sign in. Please check your email and password.'); // Set error message
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
        Sign In
      </Button>
    </form>
  );
}

export default SignInEmail;
