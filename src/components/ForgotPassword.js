// src/components/ForgotPassword.js

import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Button, TextField, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (error) {
      setError('Error sending password reset email. Please try again.');
    }
  };

  return (
    <div className="forgot-password-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Forgot Password
      </Typography>
      <form onSubmit={handleForgotPassword}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          className="contact-input"
          required
        />
        {error && (
          <Typography color="error" variant="body2" sx={{ marginTop: 1 }}>
            {error}
          </Typography>
        )}
        {message && (
          <Typography color="primary" variant="body2" sx={{ marginTop: 1 }}>
            {message}
          </Typography>
        )}
        <Button type="submit" variant="contained" color="primary" className="contact-button">
          Send Password Reset Email
        </Button>
      </form>
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        Remembered your password?{' '}
        <Link to="/signin" className="form-link">
          Sign in here
        </Link>
      </Typography>
    </div>
  );
}

export default ForgotPassword;
