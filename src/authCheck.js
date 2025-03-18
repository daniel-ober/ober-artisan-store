// src/authCheck.js
import { getAuth } from 'firebase/auth';

export const checkAuthentication = () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    // console.log('User is authenticated:', user);
    return user;
  } else {
    // console.log('No user is authenticated');
    return null;
  }
};
