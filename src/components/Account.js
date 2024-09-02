// src/components/Account.js
import React, { useState, useEffect } from 'react';
import { auth, signOut } from '../firebaseConfig';

const Account = ({ user }) => {
  const [firstName, setFirstName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Add logic for updating user profile
    } catch (error) {
      setError('Failed to update profile');
    }
  };

  return (
    <div className="account-container">
      <h2>Account Settings</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleUpdateProfile}>
        <label>
          First Name:
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Phone Number:
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </label>
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit">Update Profile</button>
      </form>
      <button onClick={handleSignOut}>Sign Out</button>
    </div>
  );
};

export default Account;
