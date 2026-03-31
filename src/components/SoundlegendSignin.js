import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { fetchUserDoc } from '../services/userService';
import './SoundlegendSignin.css';

const SoundlegendSignin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('sl_last_email');
    if (stored) {
      setEmail(stored);
      setRememberMe(true);
    }
  }, []);

  const mapFirebaseError = (code = '') => {
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact support.';
      case 'auth/user-not-found':
        return 'No account found with that email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return 'Invalid credentials or access denied.';
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );
      const user = userCredential.user;

      if (rememberMe) localStorage.setItem('sl_last_email', trimmedEmail);
      else localStorage.removeItem('sl_last_email');

      await user.getIdToken(true);
      const idTokenResult = await user.getIdTokenResult(true);
      const claims = idTokenResult.claims || {};

      if (!claims.isSoundlegend) {
        await signOut(auth);
        setErrorMsg('You are not authorized for SoundLegend access.');
        setInfoMsg(
          'If you’re ready to join, start your custom build to receive portal access.'
        );
        setIsSubmitting(false);
        return;
      }

      const userDoc = await fetchUserDoc(user.uid);
      if (userDoc?.projects?.length > 0) {
        const firstProjectId = userDoc.projects[0].projectId;
        navigate(`/projects/${firstProjectId}`);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      console.error('❌ Sign-in error:', err);
      setErrorMsg(mapFirebaseError(err?.code));
      setIsSubmitting(false);
    }
  };

  const handleForgot = async () => {
    setErrorMsg('');
    setInfoMsg('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('Enter your email first to receive a reset link.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setInfoMsg('Password reset link sent. Check your inbox (and spam).');
    } catch (err) {
      console.error('❌ Reset error:', err);
      setErrorMsg(mapFirebaseError(err?.code));
    }
  };

  return (
    <div className="soundlegend-signin">
      <div className="signin-logo-container">
        <img
          src="/soundlegend-signin/white-logo.png"
          alt="SoundLegend Experience"
          className="signin-logo"
          loading="eager"
        />
      </div>

      <header className="signin-hero" aria-label="SoundLegend intro">
        <p className="signin-subtitle">
          Secure access to your build, media, and milestone history.
        </p>
      </header>

      <form
        onSubmit={handleSignin}
        className="signin-card"
        aria-label="Sign in"
      >
        {/* EMAIL (placeholder only) */}
        <div className="field">
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        {/* PASSWORD (placeholder + show/hide) */}
        <div className="field">
          <div className="pw-wrapper">
            <input
              id="password"
              key={showPw ? 'text' : 'password'} /* force re-render on toggle */
              type={showPw ? 'text' : 'password'}
              style={{ WebkitTextSecurity: showPw ? 'none' : 'disc' }}
              autoComplete={showPw ? 'off' : 'current-password'}
              inputMode={showPw ? 'text' : 'none'}
              spellCheck="false"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) =>
                setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))
              }
              onKeyDown={(e) =>
                setCapsOn(e.getModifierState && e.getModifierState('CapsLock'))
              }
              required
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((s) => !s)}
              aria-pressed={showPw}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              disabled={isSubmitting}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {capsOn && <p className="alert warn">Caps Lock is on.</p>}
        {errorMsg && (
          <p className="alert error" role="alert">
            {errorMsg}
          </p>
        )}
        {infoMsg && (
          <p className="alert info" role="status">
            {infoMsg}
          </p>
        )}

        <div className="signin-row">
          <label className="rememberme checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isSubmitting}
            />
            <span className="checkbox-box" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                className="checkbox-check"
                focusable="false"
              >
                <path
                  d="M20 6L9 17l-5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="checkbox-label">Remember me on this device</span>
          </label>

          {/* Optional forgot link */}
          {/* <button type="button" className="link-ghost" onClick={handleForgot} disabled={isSubmitting}>Forgot password?</button> */}
        </div>

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || !email.trim() || !password}
        >
          {isSubmitting ? (
            <span className="spinner" aria-hidden="true" />
          ) : null}
          {isSubmitting ? 'Signing In…' : 'Sign In'}
        </button>

        <div className="signin-aux join-block">
          <span className="join-question">
            Not already a SoundLegend Artist?
          </span>
          <a
            href="/artisan-shop/soundlegend"
            className="link-gold join-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Click here to start your custom snare journey.
          </a>
        </div>
      </form>

      <div className="signin-info">
        <p>
          <strong>What you’ll access</strong>
        </p>
        <ul>
          <li>Live build updates & milestone tracking</li>
          <li>Design approvals, mockups & progress media</li>
          <li>Personalized audio/video files</li>
          <li>Artisan notes & care documentation</li>
        </ul>
        <p className="trust-note">
          Each drum ships with a secure NFC badge. Your private portal keeps
          your story, files, and build history together — always within reach.
        </p>
        <p className="support-row">
          Need help?{' '}
          <a href="mailto:support@oberartisandrums.com">
            support@oberartisandrums.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default SoundlegendSignin;
