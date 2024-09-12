import React, { useState, useEffect } from 'react';
import { auth, firestore } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const docRef = doc(firestore, 'adminData', 'info');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setAdminData(docSnap.data());
          } else {
            setError('Admin data does not exist.');
          }
        } catch (error) {
          console.error('Error fetching admin data:', error);
          setError('Error fetching admin data. Check permissions.');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!user) {
    return <p>Loading...</p>;
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
    <div>
      <h1>Admin Dashboard</h1>
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
