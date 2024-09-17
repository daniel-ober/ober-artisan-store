// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ element, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();

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
