import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../firebaseConfig'; // ✅ Now importing shared functions instance
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
  const [authReady, setAuthReady] = useState(false);

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

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('User not signed in.');
      setLoading(false);
      return;
    }

    try {
      const tokenResult = await currentUser.getIdTokenResult(true);
      const isAdmin = !!tokenResult.claims?.admin;
      if (!isAdmin) {
        setError('Not authorized. Your account does not have admin privileges.');
        setLoading(false);
        return;
      }

      const usersRef = collection(db, 'users');
      const emailQuery = query(usersRef, where('email', '==', formData.email));
      const existingUsers = await getDocs(emailQuery);

      if (!existingUsers.empty) {
        setError('A user with this email already exists.');
        setLoading(false);
        return;
      }

      const password = generateSimplePassword();
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

      const { uid } = result.data;
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthReady(true);
      if (!user) {
        setError('You are not signed in.');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="add-user-modal">
      <div className="modal-content">
        <h2>Add User</h2>
        {error && <div className="error-message">{error}</div>}
        {!authReady ? (
          <div className="loading-message">Checking authentication…</div>
        ) : (
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
        )}
        {passwordNoticeVisible && (
          <div className="password-popup">
            <strong>Important:</strong> Save this password to share with the user:
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