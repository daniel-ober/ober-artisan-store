// src/components/AuthGate.js
import React, { useEffect, useState } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export default function AuthGate({ children, requireAdmin = true }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const handleAdminSignIn = async () => {
    try {
      setErr('');
      const provider = new GoogleAuthProvider();
      // provider.setCustomParameters({ hd: 'yourcompany.com' }); // optional domain restriction
      await signInWithPopup(auth, provider);
    } catch (e) {
      setErr(e?.message || 'Failed to sign in.');
    }
  };

  if (!ready) return null;

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <h3>Admin sign-in required</h3>
        {err && <div style={{ color: '#991b1b', margin: '8px 0' }}>{err}</div>}
        <button onClick={handleAdminSignIn}>Sign in with Google</button>
      </div>
    );
  }

  // Optional: enforce admin claim here. If you want, uncomment:
  // return <AdminClaimGate>{children}</AdminClaimGate>;

  return <>{children}</>;
}