import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, setAnalyticsUserProperties } from '../firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSoundlegend, setIsSoundlegend] = useState(false);
  const [authIsReady, setAuthIsReady] = useState(false);

  const setAnalyticsRole = (role) => {
    try {
      setAnalyticsUserProperties(role);
    } catch {
      /* noop */
    }
  };

  const refreshClaims = async (currentUser) => {
    try {
      const idTokenResult = await currentUser.getIdTokenResult(true);
      const claims = idTokenResult.claims || {};
      const adminStatus = !!(claims.admin || claims.isAdmin);
      const slStatus = !!(claims.soundlegend || claims.isSoundlegend);

      setIsAdmin(adminStatus);
      setIsSoundlegend(slStatus);

      setAnalyticsRole(adminStatus ? 'admin' : slStatus ? 'soundlegend' : 'user');
    } catch (error) {
      console.error('❌ Error checking claims:', error);
      setIsAdmin(false);
      setIsSoundlegend(false);
      setAnalyticsRole('guest');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await refreshClaims(currentUser);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsSoundlegend(false);
        setAnalyticsRole('guest');
      }
      setAuthIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setIsSoundlegend(false);
      setAnalyticsRole('guest');
    } catch (error) {
      console.error('❌ Error logging out:', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isSoundlegend,
        authIsReady,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;