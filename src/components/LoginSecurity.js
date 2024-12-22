import React, { useState, useEffect } from 'react';
import { Typography, TextField, Button } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';  // Firebase config import

const LoginSecurity = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(true);
  const allowedCountries = ['us', 'ca'];  // Allow only US and CA country codes

  // Fetch user data from Firestore based on authenticated user UID
  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: user.email,  // Use email directly from Firebase auth
          phone: userData.phone || '',
        });
      } else {
        console.error('No user document found');
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const saveChanges = async (field) => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const userRef = doc(db, 'users', userId);

      try {
        await updateDoc(userRef, { [field]: formData[field] });
        alert(`${field} updated successfully!`);
      } catch (error) {
        console.error('Error updating document:', error);
        alert('Failed to update.');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Login & Security
      </Typography>
      <Typography variant="body1" gutterBottom>
        Update your account information:
      </Typography>
      <div className="login-security-section">
        <TextField
          label="First Name"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          value={formData.email}
          disabled  // Email is not editable
          fullWidth
          margin="normal"
        />
        
        <PhoneInput
          country={'us'}  // Default to US
          value={formData.phone}
          onChange={(value) => handleChange('phone', value)}
          onlyCountries={allowedCountries}  // Restrict to US and CA
          preferredCountries={['us', 'ca']}  // Show US and CA at the top of the dropdown
          placeholder="Enter phone number"
          inputStyle={{ width: '100%', marginTop: '16px' }}
          enableSearch={false}  // Disable search, limit to dropdown only
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => saveChanges('phone')}
          style={{ marginTop: '20px' }}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default LoginSecurity;
