import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { TextField, Button, Typography, FormControlLabel, Checkbox } from '@mui/material';
import './AccountPage.css';

const AccountPage = () => {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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
      const docRef = doc(firestore, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setEmail(auth.currentUser.email); // Use the current user email
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
      const ordersRef = collection(firestore, 'orders');
      const q = query(ordersRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const userOrders = querySnapshot.docs.map(doc => doc.data());
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
      const userRef = doc(firestore, 'users', userId);

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

        setEditMode(false); // Exit edit mode after saving
      } catch (error) {
        console.error('Error updating user details:', error.message);
      }
    }
  };

  // Update user password
  const handlePasswordChange = async () => {
    const user = auth.currentUser;

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential); // Reauthenticate the user

      await updatePassword(user, newPassword);
      setPasswordError('Password updated successfully');
    } catch (error) {
      setPasswordError('Error updating password: ' + error.message);
    }
  };

  // Group orders by orderId
  const groupOrdersById = (orders) => {
    return orders.reduce((acc, order) => {
      if (!acc[order.orderId]) {
        acc[order.orderId] = [];
      }
      acc[order.orderId].push(order);
      return acc;
    }, {});
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

    setLoading(false); // Set loading to false after data is fetched
  }, []);

  if (loading) {
    return <div>Loading account information...</div>;
  }

  const groupedOrders = groupOrdersById(orders);

  const handleToggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
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
            className="account-page-textfield"
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
            className="account-page-textfield"
          />
        </div>
        <div className="account-page-field">
          <TextField
            label="Email"
            value={email}
            variant="outlined"
            fullWidth
            disabled
            className="account-page-textfield"
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
            className="account-page-textfield"
          />
        </div>
        <div className="account-page-field">
          <FormControlLabel
            control={
              <Checkbox
                checked={editMode ? newEmailNotification : emailNotification}
                onChange={() => setNewEmailNotification(!newEmailNotification)}
                disabled={!editMode}
              />
            }
            label="Receive Email Notifications"
          />
        </div>
        <div className="account-page-field">
          <FormControlLabel
            control={
              <Checkbox
                checked={editMode ? newSmsNotification : smsNotification}
                onChange={() => setNewSmsNotification(!newSmsNotification)}
                disabled={!editMode}
              />
            }
            label="Receive SMS Notifications"
          />
        </div>

        {editMode ? (
          <div className="account-page-button-group">
            <Button variant="contained" color="primary" onClick={saveUserDetails}>Save Changes</Button>
            <Button variant="outlined" color="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="contained" color="primary" onClick={() => setEditMode(true)}>Edit Details</Button>
        )}
      </div>

      {/* Change Password */}
      <div className="account-page-section">
        <Typography variant="h6" gutterBottom>Change Password</Typography>
        <div className="account-page-field">
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            variant="outlined"
            fullWidth
            className="account-page-textfield"
          />
        </div>
        <div className="account-page-field">
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            variant="outlined"
            fullWidth
            className="account-page-textfield"
          />
        </div>
        <div className="account-page-field">
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            variant="outlined"
            fullWidth
            className="account-page-textfield"
          />
        </div>
        {passwordError && <Typography color="error">{passwordError}</Typography>}
        <Button variant="contained" color="primary" onClick={handlePasswordChange}>Change Password</Button>
      </div>

      {/* Orders */}
      <div className="account-page-section">
        <Typography variant="h6" gutterBottom>Your Orders</Typography>
        {orderLoading ? (
          <div>Loading orders...</div>
        ) : (
          Object.keys(groupedOrders).map(orderId => (
            <div key={orderId}>
              <Button onClick={() => handleToggleOrderDetails(orderId)}>
                Order {orderId} {expandedOrderId === orderId ? '-' : '+'}
              </Button>
              {expandedOrderId === orderId && (
                <div>
                  {groupedOrders[orderId].map((order, index) => (
                    <div key={index}>
                      <Typography>Item: {order.itemName}</Typography>
                      <Typography>Quantity: {order.quantity}</Typography>
                      <Typography>Price: ${order.price}</Typography>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccountPage;