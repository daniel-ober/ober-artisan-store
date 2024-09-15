import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import {
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Link, useNavigate } from 'react-router-dom';
import './SignInEmail.css';

function SignInEmail() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State for toggling password visibility
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/products'); // Redirect to the products page after successful login
    } catch (error) {
      switch (error.code) {
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address format.');
          break;
        default:
          setError('Failed to sign in. Please check your email and password.');
      }
    }
  };

  return (
    <div className="signin-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Sign In
      </Typography>
      <form onSubmit={handleSubmit} className="signin-form">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          className="signin-input"
          required
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'} // Toggle password visibility
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          className="signin-input"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)} // Toggle button
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        {error && (
          <Typography color="error" variant="body2" className="error-message">
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="signin-button"
        >
          Sign In
        </Button>
      </form>
      <Typography variant="body2" className="form-link" sx={{ marginTop: 2 }}>
        <Link to="/forgot-password" className="form-link">
          Forgot Password?
        </Link>
      </Typography>
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        Don&apos;t have an account?{' '}
        <Link to="/register" className="form-link">
          Register here
        </Link>
      </Typography>
    </div>
  );
}

export default SignInEmail;
