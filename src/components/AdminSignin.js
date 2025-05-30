import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button } from '@mui/material';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { fetchUserDoc } from '../services/userService'; // Ensure correct path
import './AdminSignin.css'; // Import custom styles

const AdminSignin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    try {
      // 🧠 Get reCAPTCHA token first
      const token = await window.grecaptcha.enterprise.execute(
        '6LcneU4rAAAAAFxByZg23EkC0nwO50mdJ-vfeQ3u',
        { action: 'login' }
      );
      
      // 👇 Send token + email to backend for Account Defender tracking
      const verifyResponse = await fetch('https://api-eef4a3tgna-uc.a.run.app/verifyRecaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });
      
      const verifyResult = await verifyResponse.json();
      if (!verifyResult.success) {
        setError('Login blocked due to suspicious behavior.');
        return;
      }
  
      // ✅ Proceed with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const userDoc = await fetchUserDoc(user.uid);
      if (userDoc && userDoc.isAdmin) {
        navigate('/admin');
      } else {
        setError('Unauthorized access. Admin privileges required.');
      }
    } catch (error) {
      setError('Error signing in: ' + error.message);
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
          {error && <Typography color="error" className="admin-signin-error">{error}</Typography>}
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign In
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default AdminSignin;
