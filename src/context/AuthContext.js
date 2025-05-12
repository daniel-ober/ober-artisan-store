// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, setAnalyticsUserProperties } from '../firebaseConfig';
import { fetchUserDoc } from '../services/userService';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserData = async (currentUser) => {
    setLoading(true);
    try {
      const userData = await fetchUserDoc(currentUser.uid);

      const adminStatus = userData?.isAdmin || false;
      setIsAdmin(adminStatus);

      // ✅ Set Firebase Analytics user_type (admin/test/real)
      if (adminStatus) {
        setAnalyticsUserProperties('admin');
      } else if (
        currentUser.email?.includes('test') || // customize for test account logic
        userData?.isTestUser
      ) {
        setAnalyticsUserProperties('test');
      } else {
        setAnalyticsUserProperties('real');
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setIsAdmin(false);
      setAnalyticsUserProperties('unknown');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser);
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        setAnalyticsUserProperties('logged_out');
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      setAnalyticsUserProperties('logged_out');
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