import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { TextField, Button, Typography, FormControlLabel, Checkbox, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import './AccountPage.css';

const AccountPage = () => {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [passwordEditMode, setPasswordEditMode] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User data state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailNotification, setEmailNotification] = useState(false);
  const [smsNotification, setSmsNotification] = useState(false);

  // Editable fields
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmailNotification, setNewEmailNotification] = useState(false);
  const [newSmsNotification, setNewSmsNotification] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Orders state
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(true);

  // Fetch user additional data
  const getUserData = async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(auth.currentUser.email);
        setPhone(data.phone || '');
        setEmailNotification(data.emailNotification || false);
        setSmsNotification(data.smsNotification || false);

        // Set new values for editable inputs
        setNewFirstName(data.firstName || '');
        setNewLastName(data.lastName || '');
        setNewPhone(data.phone || '');
        setNewEmailNotification(data.emailNotification || false);
        setNewSmsNotification(data.smsNotification || false);

        // Fetch user orders
        await getUserOrders(userId);
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error.message);
    }
  };

  // Fetch user orders
  const getUserOrders = async (userId) => {
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(userOrders);
    } catch (error) {
      console.error('Error fetching orders:', error.message);
    } finally {
      setOrderLoading(false);
    }
  };

  // Save updated user details
  const saveUserDetails = async () => {
    const user = auth.currentUser;

    if (user) {
      const userId = user.uid;
      const userRef = doc(db, 'users', userId);

      try {
        // Check if SMS notifications are enabled and validate phone number
        if (newSmsNotification && !newPhone) {
          alert('Phone number is required if SMS notifications are enabled.');
          return;
        }

        await updateDoc(userRef, {
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
          emailNotification: newEmailNotification,
          smsNotification: newSmsNotification,
        });

        // Update state after saving
        setFirstName(newFirstName);
        setLastName(newLastName);
        setPhone(newPhone);
        setEmailNotification(newEmailNotification);
        setSmsNotification(newSmsNotification);

        setEditMode(false);
      } catch (error) {
        console.error('Error updating user details:', error.message);
      }
    }
  };

  // Update user password
  const handlePasswordChange = async () => {
    const user = auth.currentUser;

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Updated password rules
    const passwordRules = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRules.test(newPassword)) {
      setPasswordError('Password must be at least 8 characters long and include at least one letter, one number, and one special character.');
      return;
    }

    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      setPasswordError('Password updated successfully');
      setPasswordEditMode(false);
    } catch (error) {
      console.error('Error updating password:', error.message);
      setPasswordError('Error updating password. Please ensure your current password is correct.');
    }
  };

  // UseEffect to fetch data when component mounts
  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      const userId = user.uid;
      getUserData(userId);
    } else {
      console.log('No user is signed in');
    }

    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading account information...</div>;
  }

  // Cancel edit details
  const handleCancelEditDetails = () => {
    setEditMode(false);
    setNewFirstName(firstName);
    setNewLastName(lastName);
    setNewPhone(phone);
    setNewEmailNotification(emailNotification);
    setNewSmsNotification(smsNotification);
  };

  // Cancel edit password
  const handleCancelEditPassword = () => {
    setPasswordEditMode(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  return (
    <div className="account-page-container">
      <Typography variant="h4" gutterBottom className="account-page-header">Account Settings</Typography>

      {/* User Account Details */}
      <div className="account-page-section">
        <Typography variant="h6" gutterBottom>Account Details</Typography>
        <div className="account-page-field">
          <TextField
            label="First Name"
            value={editMode ? newFirstName : firstName}
            onChange={(e) => setNewFirstName(e.target.value)}
            variant="outlined"
            fullWidth
            disabled={!editMode}
          />
        </div>
        <div className="account-page-field">
          <TextField
            label="Last Name"
            value={editMode ? newLastName : lastName}
            onChange={(e) => setNewLastName(e.target.value)}
            variant="outlined"
            fullWidth
            disabled={!editMode}
          />
        </div>
        <div className="account-page-field">
          <TextField
            label="Email"
            value={email}
            variant="outlined"
            fullWidth
            disabled
          />
        </div>
        <div className="account-page-field">
          <TextField
            label="Phone"
            value={editMode ? newPhone : phone}
            onChange={(e) => setNewPhone(e.target.value)}
            variant="outlined"
            fullWidth
            disabled={!editMode}
          />
        </div>
        <div className="account-page-field">
          <FormControlLabel
            control={<Checkbox checked={editMode ? newEmailNotification : emailNotification} onChange={() => setNewEmailNotification(!newEmailNotification)} disabled={!editMode} />}
            label="Email Notifications"
          />
        </div>
        <div className="account-page-field">
          <FormControlLabel
            control={<Checkbox checked={editMode ? newSmsNotification : smsNotification} onChange={() => setNewSmsNotification(!newSmsNotification)} disabled={!editMode} />}
            label="SMS Notifications"
          />
        </div>
        <div className="account-page-buttons">
          {editMode ? (
            <>
              <Button variant="contained" color="primary" onClick={saveUserDetails}>Save Changes</Button>
              <Button variant="outlined" onClick={handleCancelEditDetails}>Cancel</Button>
            </>
          ) : (
            <Button variant="outlined" onClick={() => setEditMode(true)}>Edit</Button>
          )}
        </div>
      </div>

      {/* Password Change Section */}
      <div className="account-page-section">
        <Typography variant="h6" gutterBottom>Password Change</Typography>
        {passwordEditMode ? (
          <>
            <div className="account-page-field">
              <TextField
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                variant="outlined"
                fullWidth
              />
            </div>
            <div className="account-page-field">
              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                variant="outlined"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            <div className="account-page-field">
              <TextField
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                variant="outlined"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </div>
            {passwordError && <Typography color="error">{passwordError}</Typography>}
            <div className="account-page-buttons">
              <Button variant="contained" color="primary" onClick={handlePasswordChange}>Change Password</Button>
              <Button variant="outlined" onClick={handleCancelEditPassword}>Cancel</Button>
            </div>
          </>
        ) : (
          <Button variant="outlined" onClick={() => setPasswordEditMode(true)}>Change Password</Button>
        )}
      </div>

      {/* User Orders Section */}
      <div className="account-page-section">
        <Typography variant="h6" gutterBottom>Order History</Typography>
        {orderLoading ? (
          <div>Loading your orders...</div>
        ) : (
          <div>
            {orders.length === 0 ? (
              <Typography>No orders found.</Typography>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="order-item">
                  <Typography variant="subtitle1">Order ID: {order.id}</Typography>
                  <Typography variant="body2">{JSON.stringify(order)}</Typography>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;