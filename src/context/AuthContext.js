// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, setAnalyticsUserProperties } from '../firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Get admin status from Firebase Auth custom claims, not Firestore
  const checkAdminClaim = async (currentUser) => {
    setLoading(true);
    try {
      // Force refresh of token to get the latest custom claims
      const idTokenResult = await currentUser.getIdTokenResult(true); // true = force refresh
      const adminStatus = !!idTokenResult.claims.admin;
      setIsAdmin(adminStatus);

      if (adminStatus) {
        setAnalyticsUserProperties('admin');
      } else {
        setAnalyticsUserProperties('guest');
      }
    } catch (error) {
      console.error('❌ Error checking admin claim:', error);
      setIsAdmin(false);
      setAnalyticsUserProperties('guest');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkAdminClaim(currentUser);
      } else {
        setUser(null);
        setIsAdmin(false);
        setAnalyticsUserProperties('guest');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setAnalyticsUserProperties('guest');
    } catch (error) {
      console.error('❌ Error logging out:', error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;