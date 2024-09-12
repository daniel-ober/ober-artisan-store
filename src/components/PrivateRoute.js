import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';

// PrivateRoute component to protect routes
const PrivateRoute = ({ element }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Show a loading indicator while checking authentication status
  if (loading) {
    return <p>Loading...</p>;
  }

  // Show the protected element if user is authenticated, otherwise redirect to sign-in
  return user ? element : <Navigate to="/signin" />;
};

export default PrivateRoute;
