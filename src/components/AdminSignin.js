import React, { useState } from 'react';
import { Container, Typography, TextField, Button } from '@mui/material';
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const idTokenResult = await user.getIdTokenResult(true);
      const claims = idTokenResult.claims;

      if (claims.isAdmin) {
        navigate('/admin');
        return;
      }

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
    <div className="admin-signin-page">
      <Container maxWidth="xs" className="admin-signin-container">
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
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputLabelProps={{ shrink: true }}
          />
          {error && (
            <Typography className="admin-signin-error">{error}</Typography>
          )}
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign In
          </Button>
        </form>
      </Container>
    </div>
  );
};

export default AdminSignin;