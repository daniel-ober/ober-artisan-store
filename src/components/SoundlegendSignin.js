import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { fetchUserDoc } from '../services/userService';

import './SoundlegendSignin.css';

const SoundlegendSignin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSignin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
  
    try {
      // 🧠 Get reCAPTCHA token before login
      const token = await window.grecaptcha.enterprise.execute(
        '6LcneU4rAAAAAFxByZg23EkC0nwO50mdJ-vfeQ3u',
        { action: 'login' }
      );
  
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const userDoc = await fetchUserDoc(user.uid);
  
      if (!userDoc || !userDoc.isSoundlegend) {
        setErrorMsg('You are not authorized for SoundLegend access.');
        return;
      }
  
      if (userDoc.projects?.length > 0) {
        navigate(`/projects/${userDoc.projects[0].projectId}`);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      console.error('❌ Sign-in error:', err);
      setErrorMsg('Invalid credentials or access denied.');
    }
  };

  return (
    <div className="soundlegend-signin">
      <h2>SoundLegend Portal</h2>
      <form onSubmit={handleSignin}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {errorMsg && <p className="error">{errorMsg}</p>}
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SoundlegendSignin;