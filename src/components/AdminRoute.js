// src/components/AdminRoute.js

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ element }) => {
  const { user, isAdmin } = useAuth(); // Ensure isAdmin is provided by AuthContext
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Check if the user is an admin
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <p>Loading...</p>;
  }

  // Redirect to sign-in if the user is not an admin
  return user && isAdmin ? element : <Navigate to="/signin" />;
};

export default AdminRoute;
