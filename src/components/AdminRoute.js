import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebaseConfig'; // Adjust path as needed
import { onAuthStateChanged } from 'firebase/auth';

const AdminRoute = ({ element }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  const isAdmin = user && user.email === 'chilldrummer@gmail.com'; // Replace with your admin check

  return isAdmin ? element : <Navigate to="/" />;
};

export default AdminRoute;
