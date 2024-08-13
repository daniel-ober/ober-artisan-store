import React, { useState, useContext } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { AuthenticationContext } from '../AuthenticationContext';
import { Button, TextField } from '@mui/material';
import { Link } from 'react-router-dom';

const SignInEmail = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useContext(AuthenticationContext);
  const auth = getAuth();

  const handleSignIn = async (event) => {
    event.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      signIn(userCredential.user); // Update context with user info
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
      Don't have an account? Click <Link to="/signup">here</Link> to join!
    </form>
  );
};

export default SignInEmail;
