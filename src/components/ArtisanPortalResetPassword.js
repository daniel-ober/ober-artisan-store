// src/components/ArtisanPortalResetPassword.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  checkActionCode,
  applyActionCode,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import './SoundlegendSignin.css';

const ArtisanPortalResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState('');
  const [email, setEmail] = useState('');
  const [restoredEmail, setRestoredEmail] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  const [isVerifyingCode, setIsVerifyingCode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionComplete, setActionComplete] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oobCode = params.get('oobCode');
    const incomingMode = params.get('mode');

    setMode(incomingMode || '');

    if (!oobCode || !incomingMode) {
      setErrorMsg('This action link is invalid or incomplete.');
      setIsVerifyingCode(false);
      return;
    }

    const run = async () => {
      try {
        if (incomingMode === 'resetPassword') {
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
          setIsVerifyingCode(false);
          return;
        }

        if (
          incomingMode === 'verifyAndChangeEmail' ||
          incomingMode === 'recoverEmail'
        ) {
          const actionInfo = await checkActionCode(auth, oobCode);

          const pendingEmail =
            actionInfo?.data?.email ||
            actionInfo?.data?.newEmail ||
            '';

          const previousEmail =
            actionInfo?.data?.previousEmail ||
            actionInfo?.data?.email ||
            '';

          if (incomingMode === 'recoverEmail') {
            setRestoredEmail(previousEmail);
          } else {
            setEmail(pendingEmail);
          }

          await applyActionCode(auth, oobCode);

          let currentUid = '';
          let confirmedEmail = '';

          try {
            if (auth.currentUser) {
              await auth.currentUser.reload();
              currentUid = auth.currentUser.uid || '';
              confirmedEmail = auth.currentUser.email || '';
            }
          } catch (reloadErr) {
            console.warn('Could not reload auth user after action:', reloadErr);
          }

          const finalEmail =
            (confirmedEmail || '').trim() ||
            (
              incomingMode === 'recoverEmail'
                ? previousEmail
                : pendingEmail
            ).trim();

          if (currentUid && finalEmail) {
            try {
              await setDoc(
                doc(db, 'users', currentUid),
                {
                  email: finalEmail,
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );

              await setDoc(
                doc(collection(db, 'users', currentUid, 'audit_logs')),
                {
                  type: 'account_update',
                  actorUid: currentUid,
                  actorEmail: finalEmail,
                  createdAt: serverTimestamp(),
                  source: 'ArtisanPortalResetPassword/email-action',
                  changes: {
                    email: {
                      before:
                        incomingMode === 'recoverEmail'
                          ? pendingEmail || null
                          : previousEmail || null,
                      after: finalEmail,
                    },
                  },
                }
              );
            } catch (syncErr) {
              console.warn(
                'Could not sync confirmed email to Firestore user doc:',
                syncErr
              );
            }
          }

          if (incomingMode === 'verifyAndChangeEmail') {
            setInfoMsg(
              `Your sign-in email has been verified and updated successfully to ${finalEmail || pendingEmail}.`
            );
          } else {
            setInfoMsg(
              `Your sign-in email has been restored to ${finalEmail || previousEmail}.`
            );
          }

          setActionComplete(true);
          setIsVerifyingCode(false);

          setTimeout(() => {
            navigate('/artisan-portal/signin');
          }, 2500);

          return;
        }

        setErrorMsg('This action is not supported.');
        setIsVerifyingCode(false);
      } catch (err) {
        console.error('❌ Error processing action link:', err);

        if (incomingMode === 'resetPassword') {
          setErrorMsg(
            'This password reset link has expired or is no longer valid. Please request a new one.'
          );
        } else if (
          incomingMode === 'verifyAndChangeEmail' ||
          incomingMode === 'recoverEmail'
        ) {
          setErrorMsg(
            'This email action link has expired or is no longer valid. Please request a new email update and try again.'
          );
        } else {
          setErrorMsg('This action link is invalid or unsupported.');
        }

        setIsVerifyingCode(false);
      }
    };

    run();
  }, [location.search, navigate, email, restoredEmail]);

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
        <header
          className="signin-hero"
          aria-label="Artisan Portal account action"
        >
          <p className="signin-subtitle">Checking your secure link…</p>
        </header>
        <form className="signin-card" aria-label="Account action">
          <p className="alert info">Verifying link. Please wait…</p>
        </form>
      </div>
    );
  }

  if (actionComplete && mode !== 'resetPassword') {
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

        <header
          className="signin-hero"
          aria-label="Artisan Portal account action complete"
        >
          <p className="signin-subtitle">
            Your secure account action has been completed.
          </p>
        </header>

        <form className="signin-card" aria-label="Account action complete">
          {infoMsg && (
            <p className="alert info" role="status">
              {infoMsg}
            </p>
          )}

          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/artisan-portal/signin')}
          >
            Return to sign in
          </button>
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
          Reset your password to regain secure access to your build, media, and
          milestone history.
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
          <span className="join-question">Remembered your password?</span>
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