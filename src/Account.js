import React, { useState } from 'react';
import { auth } from './firebaseConfig'; // Ensure this exports the firebase auth correctly
import { createUserWithEmailAndPassword } from 'firebase/auth';

const CreateAccount = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateAccount = async () => {
    try {
      // You need to decide how to handle this - you should first
      // create the user with email and password and then map the
      // username to the email address
      const userEmail = await createUserWithEmailAndPassword(username, password);
      console.log('Account created:', userEmail);
    } catch (error) {
      console.error('Error creating account:', error.message);
    }
  };

  return (
    <div>
      <h1>Create Account</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleCreateAccount}>Create Account</button>
    </div>
  );
};

export default CreateAccount;
