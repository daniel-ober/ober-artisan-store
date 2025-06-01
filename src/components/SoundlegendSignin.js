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
      const token = await window.grecaptcha.enterprise.execute(
        '6LcneU4rAAAAAFxByZg23EkC0nwO50mdJ-vfeQ3u',
        { action: 'login' }
      );

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
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
      <div className="signin-logo-container">
        <img
          src="/soundlegend-signin/white-logo.png"
          alt="SoundLegend Experience"
          className="signin-logo"
        />
      </div>
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
      <div className="signin-info">
        <p>
          <strong>Note:</strong> Web portal access is only available to clients
          who’ve joined the{' '}
          <a
            href="/artisan-shop/soundlegend"
            target="_blank"
            rel="noopener noreferrer"
          >
            SoundLegend Experience
          </a>
          .
        </p>
        <p>As a SoundLegend client, you’ll get secure access to:</p>
        <ul>
          <li>Live build updates & milestone tracking</li>
          <li>Mockups, design approvals & progress photos</li>
          <li>Personalized audio/video files</li>
          <li>Artisan notes & care documentation</li>
          <li>Priority support & direct messaging</li>
        </ul>
        <p style={{ marginTop: '1rem' }}>
          Your drum isn’t just being built — it’s being documented, step by
          step.
        </p>
      </div>
    </div>
  );
};

export default SoundlegendSignin;
