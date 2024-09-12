import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AccountPage = () => {
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
    return <p>Loading...</p>; // Display a loading indicator while checking auth status
  }

  if (!user) {
    return <p>You need to sign in to view this page.</p>;
  }

  return (
    <div>
      <h1>Account Page</h1>
      <p>Welcome, {user.displayName || 'User'}!</p>
      {/* More account details here */}
    </div>
  );
};

export default AccountPage;
