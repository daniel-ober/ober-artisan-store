// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, setAnalyticsUserProperties } from '../firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authIsReady, setAuthIsReady] = useState(false); // ✅ add this

  // Check Firebase Auth custom claims for admin role
  const checkAdminClaim = async (currentUser) => {
    try {
      const idTokenResult = await currentUser.getIdTokenResult(true);
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
      }

      setAuthIsReady(true); // ✅ mark auth system as initialized
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
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        logout,
        authIsReady, // ✅ expose to consumers
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;