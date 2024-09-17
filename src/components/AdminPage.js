import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Import updateDoc
import './AdminPage.css'; // Assuming you have this CSS file

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        try {
          // Fetch user data from Firestore
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setIsAdmin(userData.isAdmin || false); // Check if user is an admin

            if (userData.isAdmin) {
              // Fetch admin data if user is admin
              const adminDocRef = doc(firestore, 'adminData', 'info');
              const adminDocSnap = await getDoc(adminDocRef);
              if (adminDocSnap.exists()) {
                setAdminData(adminDocSnap.data());
              } else {
                setError('Admin data does not exist.');
              }
            }
          } else {
            setError('User data does not exist.');
          }

        } catch (error) {
          console.error('Error fetching user or admin data:', error);
          setError('Error fetching data. Check permissions.');
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return <p>Loading...</p>;
  }

  if (!isAdmin) {
    return <p>Access Denied: You are not authorized to view this page.</p>;
  }

  const handleUpdate = async () => {
    try {
      const docRef = doc(firestore, 'adminData', 'info');
      await updateDoc(docRef, { updated: new Date() });
      alert('Admin data updated successfully!');
    } catch (error) {
      console.error('Error updating admin data:', error);
      setError('Failed to update admin data.');
    }
  };

  return (
    <div className="admin-container">
      <h1 className="admin-header">Admin Dashboard</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {adminData ? (
        <div>
          <p>Admin Data: {JSON.stringify(adminData)}</p>
          <button onClick={handleUpdate}>Update Admin Data</button>
        </div>
      ) : (
        <p>Loading admin data...</p>
      )}
    </div>
  );
};

export default AdminPage;
