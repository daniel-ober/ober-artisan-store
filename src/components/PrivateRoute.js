import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element, adminOnly = false, redirectAuthenticated = false }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <p>Loading...</p>;
  }

  if (redirectAuthenticated && user) {
    return <Navigate to="/account" />;
  }

  if (!user && !redirectAuthenticated) {
    console.log("User not authenticated - Redirecting to Sign In");
    return <Navigate to="/signin" />;
  }

  if (adminOnly && (!user || !isAdmin)) {
    console.warn("Access denied - Admin privileges required.");
    return <Navigate to="/not-authorized" />;
  }

  return element;
};

export default PrivateRoute;