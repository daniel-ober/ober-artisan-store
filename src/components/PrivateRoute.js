import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path as necessary

const PrivateRoute = ({ element: Element, ...rest }) => {
  const { user } = useAuth(); // Assuming you have useAuth hook to get the current user

  return (
    <Route
      {...rest}
      element={user ? <Element /> : <Navigate to="/signin" />}
    />
  );
};

export default PrivateRoute;
