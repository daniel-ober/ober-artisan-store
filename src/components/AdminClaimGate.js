// src/components/AdminClaimGate.js
import React, { useEffect, useState } from 'react';
import { auth, signOut } from '../firebaseConfig';

/**
 * Blocks access unless the current Firebase Auth user has the `admin` claim.
 * Shows a friendly message + sign-out button if not.
 */
export default function AdminClaimGate({ children }) {
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        setErr('');
        const u = auth.currentUser;
        if (!u) {
          setIsAdmin(false);
          setChecking(false);
          return;
        }
        // Force a fresh token so we get up-to-date claims
        await u.getIdToken(true);
        const tokenResult = await u.getIdTokenResult();
        if (!alive) return;
        setIsAdmin(!!tokenResult.claims?.admin);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || 'Failed to verify admin claim.');
        setIsAdmin(false);
      } finally {
        if (alive) setChecking(false);
      }
    }

    check();
    return () => { alive = false; };
  }, []);

  if (checking) return null;

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, maxWidth: 640 }}>
        <h2>Not authorized</h2>
        <p>Your account is signed in, but it doesn’t have admin privileges.</p>
        {err && <p style={{ color: '#991b1b' }}>{err}</p>}
        <button onClick={() => signOut(auth)}>Sign out</button>
      </div>
    );
  }

  return <>{children}</>;
}