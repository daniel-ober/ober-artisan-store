// src/components/Account.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateEmail, updatePassword } from 'firebase/auth';


const Account = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleUpdateEmail = async () => {
    try {
      if (user) {
        await updateEmail(user, email);
        setMessage('Email updated successfully.');
      }
    } catch (error) {
      setMessage(`Failed to update email: ${error.message}`);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      if (user && password) {
        await updatePassword(user, password);
        setMessage('Password updated successfully.');
      }
    } catch (error) {
      setMessage(`Failed to update password: ${error.message}`);
    }
  };

  return (
    <div className="account-container">
      <h2>Account Settings</h2>
      <div>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button onClick={handleUpdateEmail}>Update Email</button>
      </div>
      <div>
        <label>
          New Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button onClick={handleUpdatePassword}>Update Password</button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Account;
