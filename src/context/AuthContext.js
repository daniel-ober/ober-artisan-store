import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { fetchUserDoc } from '../services/userService';
import { signOut, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch user data and admin status
  const fetchUserData = async (currentUser) => {
    setLoading(true);
    try {
      // console.log('Fetching user data for UID:', currentUser.uid);

      const userData = await fetchUserDoc(currentUser.uid);
      // console.log('Fetched User Data:', userData);

      if (userData) {
        setIsAdmin(userData.isAdmin || false);
        // console.log('✅ Updated isAdmin state:', userData.isAdmin);
      } else {
        console.warn('⚠️ User data not found in Firestore. Setting isAdmin to false.');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // console.log('✅ User Signed In:', currentUser);
        setUser(currentUser);
        await fetchUserData(currentUser); // Fetch admin status from Firestore
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ Sign out function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
      // console.log("✅ Successfully signed out.");
    } catch (error) {
      console.error("❌ Error logging out:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;