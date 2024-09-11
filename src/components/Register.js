import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, firestore } from '../firebaseConfig'; // Use db instead of firestore
import { TextField, Button, Typography, IconButton } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    noInvalidChars: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (name === 'password') {
      validatePassword(value);
    }
  };

  const validatePassword = (password) => {
    const lengthValid = password.length >= 8 && password.length <= 32;
    const uppercaseValid = /[A-Z]/.test(password);
    const lowercaseValid = /[a-z]/.test(password);
    const numberValid = /\d/.test(password);
    const specialCharValid = /[~!@#$%^*()_\-+={}[\]|:;",.?]/.test(password);
    const noInvalidChars = !/[<>&']/.test(password);

    setPasswordRules({
      length: lengthValid,
      uppercase: uppercaseValid,
      lowercase: lowercaseValid,
      number: numberValid,
      specialChar: specialCharValid,
      noInvalidChars: noInvalidChars,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!Object.values(passwordRules).every((rule) => rule === true)) {
      setError('Please ensure all password requirements are met.');
      return;
    }

    try {
      // Create user with Firebase Authentication
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Create a new user document in Firestore
      await firestore.collection('users').doc(user.uid).set({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date(),
      });

      setStatus('Registration successful!');
      setError(''); // Clear any previous error messages
      setPasswordRules({
        // Clear password rules
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
        noInvalidChars: true,
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
      });
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Email is already in use.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError('Registration failed. Please try again.');
      }
      setStatus(''); // Clear any previous success messages
    }
  };

  return (
    <div className="register-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Register
      </Typography>
      <form onSubmit={handleSubmit}>
        <div className="name-fields">
          <TextField
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
        </div>
        <TextField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Phone (Optional)"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Confirm Password"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <IconButton
          onClick={() => setShowPassword(!showPassword)}
          edge="end"
          aria-label="toggle password visibility"
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
        {error && (
          <Typography color="error" variant="body2" sx={{ marginTop: 1 }}>
            {error}
          </Typography>
        )}
        <div className="password-rules">
          <Typography variant="body2" sx={{ marginTop: 2 }}>
            Password must:
            <ul>
              <li style={{ color: passwordRules.length ? 'green' : 'red' }}>
                Be 8-32 characters long
              </li>
              <li style={{ color: passwordRules.uppercase ? 'green' : 'red' }}>
                Contain one uppercase letter
              </li>
              <li style={{ color: passwordRules.lowercase ? 'green' : 'red' }}>
                Contain one lowercase letter
              </li>
              <li style={{ color: passwordRules.number ? 'green' : 'red' }}>
                Contain one number
              </li>
              <li
                style={{ color: passwordRules.specialChar ? 'green' : 'red' }}
              >
                Contain at least one special character
              </li>
            </ul>
          </Typography>
        </div>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="register-button"
        >
          Register
        </Button>
        {status && (
          <Typography variant="body2" sx={{ marginTop: 2 }}>
            {status}
          </Typography>
        )}
      </form>
    </div>
  );
};

export default Register;
