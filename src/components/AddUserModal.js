import React, { useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';
import './AddUserModal.css';

const generateSimplePassword = () => {
  const words = ['Music', 'Drum', 'Craft', 'Tone', 'Groove', 'Beat', 'Shell'];
  const symbols = ['!', '@', '#', '$'];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNumber = Math.floor(100 + Math.random() * 900);
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  return `${randomWord}${randomNumber}${randomSymbol}`;
};

const AddUserModal = ({ onClose, onUserAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isSoundlegend: false,
    status: 'active',
  });
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordNoticeVisible, setPasswordNoticeVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError('User not signed in.');
      setLoading(false);
      return;
    }

    try {
      // Always force refresh for latest custom claims
      const tokenResult = await currentUser.getIdTokenResult(true);
      console.debug('[AddUserModal] TokenResult.claims:', tokenResult.claims);

      // Show all claims for your debug sanity
      if (
        !tokenResult.claims ||
        typeof tokenResult.claims.admin === 'undefined'
      ) {
        setError(
          'No admin claim found in your Firebase Auth token. Try signing out and back in after being promoted to admin.'
        );
        setLoading(false);
        return;
      }

      const isAdmin = !!tokenResult.claims.admin;
      if (!isAdmin) {
        setError('Not authorized. You do not have admin access.');
        setLoading(false);
        return;
      }

      // Prevent duplicate users by email
      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', formData.email));
      const existingUsers = await getDocs(emailQuery);

      if (!existingUsers.empty) {
        setError('A user with this email already exists.');
        setLoading(false);
        return;
      }

      // Cloud Function: Create Auth User
      const password = generateSimplePassword();
      const functions = getFunctions(undefined, 'us-central1');
      const createUser = httpsCallable(functions, 'adminCreateUser');

      const result = await createUser({
        email: formData.email,
        password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        isSoundlegend: formData.isSoundlegend,
        status: formData.status,
      });

      const uid = result.data.uid;
      if (!uid) {
        setError('User created in Auth, but UID missing from response.');
        setLoading(false);
        return;
      }
      await setDoc(doc(db, 'users', uid), {
        ...formData,
        createdAt: Timestamp.now(),
        isAdmin: false,
        isSoundlegend: formData.isSoundlegend || false,
      });

      setGeneratedPassword(password);
      setPasswordNoticeVisible(true);
      onUserAdded({ ...formData, id: uid });
    } catch (err) {
      console.error('❌ Failed to add user:', err);
      // Provide better error messages if known errors
      if (
        err.message?.includes('PERMISSION_DENIED') ||
        err.message?.toLowerCase().includes('permission')
      ) {
        setError('Not authorized. (Cloud Function PERMISSION_DENIED)');
      } else if (err.message?.includes('auth/email-already-exists')) {
        setError('Email already exists in Firebase Auth.');
      } else {
        setError(err.message || 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-modal">
      <div className="modal-content">
        <h2>Add User</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>First Name *</label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="isSoundlegend"
                checked={formData.isSoundlegend}
                onChange={handleChange}
              />
              SoundLegend Access
            </label>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add User'}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>

        {passwordNoticeVisible && (
          <div className="password-popup">
            <strong>Important:</strong> Save this password to share with the
            user:
            <div className="password-popup-display">
              <code>{generatedPassword}</code>
              <button
                onClick={() => navigator.clipboard.writeText(generatedPassword)}
              >
                Copy
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              They can change it later via password reset.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddUserModal;
