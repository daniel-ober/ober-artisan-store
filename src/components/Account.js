import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../firebaseConfig';
import { Button, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; // Import the sign-out icon
import './Account.css';

const Account = () => {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        setFirstName(user.displayName?.split(' ')[0] || '');
        setLastName(user.displayName?.split(' ')[1] || '');
        setEmail(user.email || '');
        setPhoneNumber(user.phoneNumber || '');
      } else {
        navigate('/signin'); // Redirect to sign-in page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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
        <div className="name-fields">
          <TextField
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            margin="normal"
            className="account-input account-first-name"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            margin="normal"
            className="account-input account-last-name"
          />
        </div>
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
        variant="text"
        color="secondary"
        className="signout-button"
        startIcon={<ExitToAppIcon />}
      >
        Sign Out
      </Button>
    </div>
  );
};

export default Account;
