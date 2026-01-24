// src/components/ArtisanPortalResetPassword.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { auth } from '../firebaseConfig';
import './SoundlegendSignin.css'; // reuse the same styling

const ArtisanPortalResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const [isVerifyingCode, setIsVerifyingCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Grab oobCode + mode from the query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oobCode = params.get('oobCode');
    const mode = params.get('mode');

    if (!oobCode || mode !== 'resetPassword') {
      setErrorMsg('This password reset link is invalid or incomplete.');
      setIsVerifyingCode(false);
      return;
    }

    // Verify the code and get the email it belongs to
    const verifyCode = async () => {
      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setIsVerifyingCode(false);
      } catch (err) {
        console.error('❌ Error verifying reset code:', err);
        setErrorMsg(
          'This password reset link has expired or is no longer valid. Please request a new one.'
        );
        setIsVerifyingCode(false);
      }
    };

    verifyCode();
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const params = new URLSearchParams(location.search);
    const oobCode = params.get('oobCode');

    if (!oobCode) {
      setErrorMsg('Missing reset code. Please request a new password reset.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Please choose a password that is at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter them.');
      return;
    }

    try {
      setIsSubmitting(true);
      await confirmPasswordReset(auth, oobCode, newPassword);

      setInfoMsg(
        'Your password has been updated. You can now sign in to The Artisan Portal.'
      );
      setNewPassword('');
      setConfirmPassword('');

      // After a short delay, send them to the sign-in page
      setTimeout(() => {
        navigate('/artisan-portal/signin');
      }, 2500);
    } catch (err) {
      console.error('❌ Error confirming password reset:', err);
      setErrorMsg(
        'We were unable to update your password with this link. Please request a new reset email and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifyingCode) {
    return (
      <div className="soundlegend-signin">
        <div className="signin-logo-container">
          <img
            src="/soundlegend-signin/white-logo.png"
            alt="Ober Artisan Drums"
            className="signin-logo"
            loading="eager"
          />
        </div>
        <header className="signin-hero" aria-label="Artisan Portal password reset">
          <p className="signin-subtitle">Checking your reset link…</p>
        </header>
        <form className="signin-card" aria-label="Reset password">
          <p className="alert info">Verifying reset code. Please wait…</p>
        </form>
      </div>
    );
  }

  return (
    <div className="soundlegend-signin">
      <div className="signin-logo-container">
        <img
          src="/soundlegend-signin/white-logo.png"
          alt="Ober Artisan Drums"
          className="signin-logo"
          loading="eager"
        />
      </div>

      <header className="signin-hero" aria-label="Artisan Portal password reset">
        <p className="signin-subtitle">
          Reset your password to regain secure access to your build, media, and milestone history.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="signin-card"
        aria-label="Reset password"
      >
        {email && (
          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--sl-muted)',
              marginBottom: '0.9rem',
              textAlign: 'center',
            }}
          >
            Resetting password for <strong>{email}</strong>
          </p>
        )}

        <div className="field">
          <div className="pw-wrapper">
            <input
              id="new-password"
              type={showPw ? 'text' : 'password'}
              style={{ WebkitTextSecurity: showPw ? 'none' : 'disc' }}
              autoComplete="new-password"
              spellCheck="false"
              placeholder="New password"
              aria-label="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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

        <div className="field">
          <input
            id="confirm-password"
            type={showPw ? 'text' : 'password'}
            style={{ WebkitTextSecurity: showPw ? 'none' : 'disc' }}
            autoComplete="new-password"
            spellCheck="false"
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
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

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting || !newPassword || !confirmPassword}
        >
          {isSubmitting && <span className="spinner" aria-hidden="true" />}
          {isSubmitting ? 'Updating Password…' : 'Update Password'}
        </button>

        <div className="signin-aux join-block">
          <span className="join-question">
            Remembered your password?
          </span>
          <button
            type="button"
            className="link-gold join-link"
            onClick={() => navigate('/artisan-portal/signin')}
          >
            Return to sign in
          </button>
        </div>
      </form>

      <div className="signin-info">
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

export default ArtisanPortalResetPassword;