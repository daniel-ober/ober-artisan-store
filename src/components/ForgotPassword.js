import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { Button, TextField, Typography, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
      setOpen(true);
    } catch (error) {
      setError('Error sending password reset email. Please try again.');
    }
  };

  const handleClose = () => {
    setOpen(false);
    navigate('/signin');
  };

  return (
    <div className="forgot-password-container">
      <Typography variant="h4">Forgot Password</Typography>
      <form onSubmit={handleForgotPassword}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          required
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ marginTop: 2 }}>
          Send Reset Email
        </Button>
        {error && <Typography variant="body2" color="error">{error}</Typography>}
        {message && <Typography variant="body2" color="primary">{message}</Typography>}
      </form>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Reset Password Email Sent</DialogTitle>
        <DialogContent>
          <Typography>{message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">OK</Button>
        </DialogActions>
      </Dialog>
      <Typography variant="body2">
        Go back to <Link to="/signin">Sign In</Link>
      </Typography>
    </div>
  );
}

export default ForgotPassword;
