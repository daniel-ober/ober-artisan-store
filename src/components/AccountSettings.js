import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { TextField, Button, Typography, Checkbox, FormControlLabel, Snackbar } from '@mui/material';
import './AccountSettings.css';

const AccountSettings = () => {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailNotification, setEmailNotification] = useState(false);
  const [smsNotification, setSmsNotification] = useState(false);

  const fetchUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(user.email);
        setPhone(data.phone || '');
        setEmailNotification(data.emailNotification || false);
        setSmsNotification(data.smsNotification || false);
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (user) {
      const userId = user.uid;
      const userRef = doc(db, 'users', userId);

      try {
        await updateDoc(userRef, {
          firstName,
          lastName,
          phone,
          emailNotification,
          smsNotification,
        });

        setSnackbarMessage('Account settings updated successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setEditMode(false);
      } catch (error) {
        console.error('Error saving account settings:', error);
        setSnackbarMessage('Failed to save changes.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return <div>Loading account settings...</div>;
  }

  return (
    <div className="account-settings-container">
      <Typography variant="h5" gutterBottom>
        Account Settings
      </Typography>
      <div className="account-settings-field">
        <TextField
          label="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={!editMode}
          fullWidth
        />
      </div>
      <div className="account-settings-field">
        <TextField
          label="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={!editMode}
          fullWidth
        />
      </div>
      <div className="account-settings-field">
        <TextField label="Email" value={email} disabled fullWidth />
      </div>
      <div className="account-settings-field">
        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={!editMode}
          fullWidth
        />
      </div>
      <FormControlLabel
        control={
          <Checkbox
            checked={emailNotification}
            onChange={(e) => setEmailNotification(e.target.checked)}
            disabled={!editMode}
          />
        }
        label="Email Notifications"
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={smsNotification}
            onChange={(e) => setSmsNotification(e.target.checked)}
            disabled={!editMode}
          />
        }
        label="SMS Notifications"
      />
      <div className="account-settings-buttons">
        {editMode ? (
          <>
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save
            </Button>
            <Button
              variant="outlined"
              onClick={() => setEditMode(false)}
              style={{ marginLeft: '10px' }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button variant="outlined" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        )}
      </div>
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
};

export default AccountSettings;
