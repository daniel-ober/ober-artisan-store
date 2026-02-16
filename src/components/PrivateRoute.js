import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Usage examples:
 * <PrivateRoute element={<SomePage />} />
 * <PrivateRoute element={<AdminPage />} adminOnly />
 * <PrivateRoute element={<Portal />} soundlegendOnly />
 */
const PrivateRoute = ({
  element,
  adminOnly = false,
  soundlegendOnly = false,
  redirectAuthenticated = false,
}) => {
  const { user, isAdmin, isSoundlegend, authIsReady } = useAuth();

  if (!authIsReady) return <p>Loading...</p>;

  if (redirectAuthenticated && user) return <Navigate to="/account" replace />;

  if (!user && !redirectAuthenticated)
    return <Navigate to="/artisan-portal/signin" replace />;

  if (adminOnly && !isAdmin) return <Navigate to="/not-authorized" replace />;

  if (soundlegendOnly && !(isAdmin || isSoundlegend))
    return <Navigate to="/not-authorized" replace />;

  return element;
};

export default PrivateRoute;
