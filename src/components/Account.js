// src/components/Account.js
import React, { useState } from 'react';
import { auth, signOut } from '../firebaseConfig';
import { Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import './Account.css';

const Account = ({ user }) => {
  const [firstName, setFirstName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin'); // Redirect to sign-in page after successful sign-out
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Add logic for updating user profile
    } catch (error) {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="account-container">
      <Typography variant="h4" component="h1" className="account-header">
        Account Settings
      </Typography>
      {error && <Typography className="account-error">{error}</Typography>}
      <form onSubmit={handleUpdateProfile} className="account-form">
        <TextField
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          fullWidth
          margin="normal"
          className="account-input"
        />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          className="account-input"
        />
        <TextField
          label="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          fullWidth
          margin="normal"
          className="account-input"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          className="account-input"
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="account-button"
        >
          Update Profile
        </Button>
      </form>
      <Button
        onClick={handleSignOut}
        variant="outlined"
        color="secondary"
        className="account-button"
      >
        Sign Out
      </Button>
    </div>
  );
};

export default Account;
