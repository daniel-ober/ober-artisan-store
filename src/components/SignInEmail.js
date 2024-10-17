import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
} from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Adjust the path as necessary
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory

// Import the fetchUserDoc function from its module
import { fetchUserDoc } from '../services/userService'; // Update this path accordingly

const SignInEmail = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Use useNavigate for navigation

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user is active
      const userDoc = await fetchUserDoc(user.uid); // Ensure fetchUserDoc is correctly imported
      if (userDoc && userDoc.status === 'active') {
        navigate('/products'); // Redirect to the shop page on successful login
      } else {
        setError('Your account is inactive. Please contact support.');
      }
    } catch (error) {
      setError('Error signing in: ' + error.message);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Typography variant="h5">Sign In</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <Typography color="error">{error}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign In
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default SignInEmail;
