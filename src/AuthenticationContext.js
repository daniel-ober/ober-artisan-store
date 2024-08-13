import React, { createContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export const AuthenticationContext = createContext();

export const AuthenticationProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, [auth]);

  const signIn = (userData) => {
    setUser(userData);
  };

  const signOut = () => {
    auth.signOut().then(() => {
      setUser(null);
    }).catch((error) => {
      console.error('Sign Out Error', error);
    });
  };

  return (
    <AuthenticationContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthenticationContext.Provider>
  );
};
