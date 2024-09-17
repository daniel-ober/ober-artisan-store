import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext'; // Import useAuth hook

// PrivateRoute component to protect routes
const PrivateRoute = ({ element, adminOnly = false }) => {
  const { user, isAdmin } = useAuth(); // Use useAuth to get user and admin status
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      setLoading(false); // Set loading to false after auth status is determined
    });

    return () => unsubscribe();
  }, []);

  // Show a loading indicator while checking authentication status
  if (loading) {
    return <p>Loading...</p>;
  }

  // Check if user is authenticated and has the required role (if adminOnly is true)
  if (user) {
    if (adminOnly && !isAdmin) {
      return <Navigate to="/not-authorized" />; // Redirect if user is not an admin
    }
    return element; // Render the protected element if user is authenticated
  }

  // Redirect to sign-in page if user is not authenticated
  return <Navigate to="/signin" />;
};

export default PrivateRoute;
