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
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if the user is an admin
      const userDoc = await fetchUserDoc(user.uid);
      if (userDoc && userDoc.isAdmin) {
        navigate('/admin'); // Redirect to the admin dashboard on successful login
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
