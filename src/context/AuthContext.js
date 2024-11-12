import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { getUserDoc } from '../firebaseConfig'; // Ensure `getUserDoc` fetches user data from Firestore

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        try {
          const userData = await getUserDoc(user.uid);
          setIsAdmin(userData?.isAdmin || false); // Check admin status
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe; // Cleanup
  }, []);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setUser(null);
      setIsAdmin(false); // Reset admin status
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
