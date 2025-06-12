import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { fetchUserDoc } from '../services/userService';
import './AdminSignin.css';

const AdminSignin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // ✅ Firebase sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 🔄 Force refresh token to ensure latest claims
      const idTokenResult = await user.getIdTokenResult(true);
      const claims = idTokenResult.claims;

      console.log('🧾 Token claims:', claims);

      if (claims.isAdmin) {
        navigate('/admin');
        return;
      }

      // 🪂 Fallback: Check Firestore user doc
      const userDoc = await fetchUserDoc(user.uid);
      if (userDoc?.isAdmin) {
        navigate('/admin');
      } else {
        setError('Unauthorized access. Admin privileges required.');
      }
    } catch (err) {
      console.error('❌ Sign-in error:', err);
      setError('Error signing in: ' + err.message);
    }
  };

  return (
    <Container maxWidth="xs" className="admin-signin-container">
      <Box mt={8}>
        <Typography variant="h5" className="admin-signin-title">
          Admin Sign In
        </Typography>
        <form onSubmit={handleSubmit} className="admin-signin-form">
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
          {error && (
            <Typography color="error" className="admin-signin-error">
              {error}
            </Typography>
          )}
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign In
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default AdminSignin;