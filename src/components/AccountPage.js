import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import './AccountPage.css'; // Ensure this contains the updated styles

const AccountPage = () => {
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // User data state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notificationSettings, setNotificationSettings] = useState(false);

  // Editable fields
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotificationSettings, setNewNotificationSettings] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
        setNotificationSettings(data.notificationSettings || false);

        // Set new values for editable inputs
        setNewFirstName(data.firstName || '');
        setNewLastName(data.lastName || '');
        setNewPhone(data.phone || '');
        setNewNotificationSettings(data.notificationSettings || false);
      } else {
        console.log('No user data found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error.message);
    }
  };

  // Save updated user details
  const saveUserDetails = async () => {
    const user = auth.currentUser;

    if (user) {
      const userId = user.uid;
      const userRef = doc(firestore, 'users', userId);

      try {
        await updateDoc(userRef, {
          firstName: newFirstName,
          lastName: newLastName,
          phone: newPhone,
          notificationSettings: newNotificationSettings,
        });

        // Update state after saving
        setFirstName(newFirstName);
        setLastName(newLastName);
        setPhone(newPhone);
        setNotificationSettings(newNotificationSettings);

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

  return (
    <div className="account-container">
      <h1 className="account-header">Account Settings</h1>

      {/* User Account Details */}
      <div className="account-details">
        <h2>Account Details</h2>

        {/* First Name */}
        <p>
          <strong>First Name:</strong>
          {editMode ? (
            <input
              type="text"
              value={newFirstName}
              onChange={(e) => setNewFirstName(e.target.value)}
              className="account-input"
            />
          ) : (
            <span> {firstName}</span>
          )}
        </p>

        {/* Last Name */}
        <p>
          <strong>Last Name:</strong>
          {editMode ? (
            <input
              type="text"
              value={newLastName}
              onChange={(e) => setNewLastName(e.target.value)}
              className="account-input"
            />
          ) : (
            <span> {lastName}</span>
          )}
        </p>

        {/* Email */}
        <p>
          <strong>Email:</strong> {email}
        </p>

        {/* Phone */}
        <p>
          <strong>Phone:</strong>
          {editMode ? (
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="account-input"
            />
          ) : (
            <span> {phone}</span>
          )}
        </p>

        {/* Notification Settings */}
        <p>
          <strong>Notification Settings:</strong>
          {editMode ? (
            <input
              type="checkbox"
              checked={newNotificationSettings}
              onChange={(e) => setNewNotificationSettings(e.target.checked)}
              className="account-input"
            />
          ) : (
            <span>{notificationSettings ? 'Enabled' : 'Disabled'}</span>
          )}
        </p>

        {/* Edit / Save Button */}
        {editMode ? (
          <button className="account-button save-button" onClick={saveUserDetails}>
            Save Changes
          </button>
        ) : (
          <button className="account-button edit-button" onClick={() => setEditMode(true)}>
            Edit Details
          </button>
        )}
      </div>

      {/* Password Change Section */}
      <div className="account-password">
        <h2>Change Password</h2>
        <input
          type="password"
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="account-input"
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="account-input"
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="account-input"
        />
        <button className="account-button save-button" onClick={handlePasswordChange}>
          Change Password
        </button>
        {passwordError && <p className="account-error">{passwordError}</p>}
      </div>
    </div>
  );
};

export default AccountPage;
