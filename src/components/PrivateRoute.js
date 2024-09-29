import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element, adminOnly = false, redirectAuthenticated = false }) => {
  const { user, isAdmin, loading } = useAuth();

  // Show a loading indicator while checking authentication status
  if (loading) {
    return <p>Loading...</p>;
  }

  // Redirect authenticated users away from routes like /signin, /register, etc.
  if (redirectAuthenticated && user) {
    return <Navigate to="/account" />;
  }

  // If the route is protected but the user is not authenticated
  if (!user && !redirectAuthenticated) {
    return <Navigate to="/signin" />;
  }

  // For admin-only routes
  if (adminOnly && (!user || !isAdmin)) {
    return <Navigate to="/not-authorized" />;
  }

  // Render the element if all conditions are met
  return element;
};

export default PrivateRoute;
