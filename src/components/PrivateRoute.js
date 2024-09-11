import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path as necessary

const PrivateRoute = ({ element: Element }) => {
  const { user } = useAuth(); // Assuming you have useAuth hook to get the current user
  const location = useLocation();

  if (!user) {
    // Redirect them to the /signin page, but save the current location they were trying to go to
    return <Navigate to="/signin" state={{ from: location }} />;
  }

  return Element;
};

export default PrivateRoute;
