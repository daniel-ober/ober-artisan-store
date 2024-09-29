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
  const [open, setOpen] = useState(false); // State for controlling the dialog
  const navigate = useNavigate(); // Hook to navigate programmatically

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
      setOpen(true); // Open the dialog on successful email send
    } catch (error) {
      setError('Error sending password reset email. Please try again.');
    }
  };

  const handleClose = () => {
    setOpen(false); // Close the dialog
    navigate('/signin'); // Redirect to the sign-in page
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
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="contact-button"
        >
          Send Password Reset Email
        </Button>
      </form>
      <Typography variant="body2" sx={{ marginTop: 2 }}>
        Remembered your password?{' '}
        <Link to="/signin" className="form-link">
          Sign in here
        </Link>
      </Typography>

      {/* Confirmation Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Password Reset Email Sent</DialogTitle>
        <DialogContent>
          <Typography>
            A password reset email has been sent. Please check your inbox for further instructions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ForgotPassword;
