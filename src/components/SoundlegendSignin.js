import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
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
  const [isSendingReset, setIsSendingReset] = useState(false);
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
      case 'auth/invalid-credential':
        return 'Incorrect email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment and try again.';
      default:
        return 'Invalid credentials or access denied.';
    }
  };

  const normalizePortalStatus = (userDoc = {}) => {
    const direct =
      userDoc?.soundlegendStatus ||
      userDoc?.portalStatus ||
      userDoc?.slPortalStatus ||
      userDoc?.access?.soundlegendStatus ||
      userDoc?.access?.portalStatus ||
      '';

    return String(direct || '').trim().toLowerCase();
  };

  const isPortalExpired = (userDoc = {}) => {
    const status = normalizePortalStatus(userDoc);

    return (
      status === 'expired' ||
      status === 'portal expired' ||
      userDoc?.portalExpired === true ||
      userDoc?.slPortalExpired === true ||
      userDoc?.access?.portalExpired === true ||
      userDoc?.access?.slPortalExpired === true
    );
  };

  const isPortalLocked = (userDoc = {}) => {
    const status = normalizePortalStatus(userDoc);

    return (
      status === 'locked' ||
      status === 'portal locked' ||
      userDoc?.portalLocked === true ||
      userDoc?.slPortalLocked === true ||
      userDoc?.access?.slPortalLocked === true ||
      userDoc?.access?.soundlegendLocked === true ||
      userDoc?.access?.portalLocked === true
    );
  };

  const getFirstProjectId = (userDoc = {}) => {
    const projects = Array.isArray(userDoc?.projects) ? userDoc.projects : [];
    if (!projects.length) return '';

    const first = projects[0];

    if (typeof first === 'string') return first;
    return first?.projectId || first?.id || first?.projectID || '';
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

      if (rememberMe) {
        localStorage.setItem('sl_last_email', trimmedEmail);
      } else {
        localStorage.removeItem('sl_last_email');
      }

      await user.getIdToken(true);
      const idTokenResult = await user.getIdTokenResult(true);
      const claims = idTokenResult.claims || {};

      if (!(claims.isSoundlegend || claims.soundlegend)) {
        await signOut(auth);
        setErrorMsg('You are not authorized for SoundLegend access.');
        setInfoMsg(
          'This portal is reserved for active SoundLegend artists. If you’re ready to join, start your custom build to receive portal access.'
        );
        setIsSubmitting(false);
        return;
      }

      const userDoc = await fetchUserDoc(user.uid);

      if (isPortalExpired(userDoc)) {
        await signOut(auth);
        setErrorMsg('Your SoundLegend Artist Portal is currently inactive.');
        setInfoMsg(
          'If you think this is a mistake, please contact support@oberartisandrums.com and we’ll be happy to help.'
        );
        setIsSubmitting(false);
        return;
      }

      if (isPortalLocked(userDoc)) {
        await signOut(auth);
        setErrorMsg('Your SoundLegend Artist Portal is temporarily unavailable.');
        setInfoMsg(
          'Please contact support@oberartisandrums.com if you need help restoring access.'
        );
        setIsSubmitting(false);
        return;
      }

      const loginTimestampPayload = {
        uid: user.uid,
        email: user.email || trimmedEmail,
        emailLower: String(user.email || trimmedEmail).trim().toLowerCase(),
        lastLoginAt: serverTimestamp(),
        lastSignInAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await updateDoc(doc(db, 'users', user.uid), loginTimestampPayload);
      } catch (updateError) {
        console.warn(
          'Could not write login timestamp to auth UID doc with updateDoc, trying merge fallback:',
          updateError
        );

        try {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(doc(db, 'users', user.uid), loginTimestampPayload, {
            merge: true,
          });
        } catch (fallbackError) {
          console.warn(
            'Could not write login timestamp to auth UID doc with merge fallback:',
            fallbackError
          );
        }
      }

      if (userDoc?.id && userDoc.id !== user.uid) {
        try {
          const { setDoc } = await import('firebase/firestore');
          await setDoc(
            doc(db, 'users', userDoc.id),
            {
              lastLoginAt: serverTimestamp(),
              lastSignInAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (linkedDocError) {
          console.warn(
            'Could not mirror login timestamp to linked user doc:',
            linkedDocError
          );
        }
      }

      const firstProjectId = getFirstProjectId(userDoc);

      if (firstProjectId) {
        navigate(`/legacy?projectId=${firstProjectId}`, { replace: true });
      } else {
        navigate('/legacy', { replace: true });
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
      setIsSendingReset(true);

      await sendPasswordResetEmail(auth, trimmedEmail);

      setInfoMsg(
        'If this email has SoundLegend portal access, a password reset link has been sent. Please check your inbox and spam folder.'
      );
    } catch (err) {
      console.error('❌ Reset error:', err);
      setErrorMsg(mapFirebaseError(err?.code));
    } finally {
      setIsSendingReset(false);
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

        <p
          className="signin-subtitle"
          style={{
            marginTop: '0.7rem',
            maxWidth: '58ch',
            color: 'var(--sl-warn)',
            fontWeight: 600,
          }}
        >
          This portal is reserved for active SoundLegend artists who have been
          granted portal access.
        </p>
      </header>

      <form
        onSubmit={handleSignin}
        className="signin-card"
        aria-label="Sign in"
      >
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
            disabled={isSubmitting || isSendingReset}
          />
        </div>

        <div className="field">
          <div className="pw-wrapper">
            <input
              id="password"
              key={showPw ? 'text' : 'password'}
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
              disabled={isSubmitting || isSendingReset}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw((s) => !s)}
              aria-pressed={showPw}
              aria-label={showPw ? 'Hide password' : 'Show password'}
              disabled={isSubmitting || isSendingReset}
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

  <button
    type="button"
    className="forgot-link"
    onClick={handleForgot}
    disabled={isSubmitting}
  >
    Forgot password?
  </button>
</div>

        <button
          type="submit"
          className="btn-primary"
          disabled={
            isSubmitting || isSendingReset || !email.trim() || !password
          }
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