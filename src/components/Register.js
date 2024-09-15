import React, { useState, useRef } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebaseConfig';
import {
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import './Register.css';
import printJS from 'print-js';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [agreedToTermsAndPrivacy, setAgreedToTermsAndPrivacy] = useState(false);
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const termsRef = useRef(null);
  const privacyRef = useRef(null);

  const passwordRules = {
    length: formData.password.length >= 8 && formData.password.length <= 32,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    match: formData.password === formData.confirmPassword,
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (e) => {
    setAgreedToTermsAndPrivacy(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');

    if (!agreedToTermsAndPrivacy) {
      setError(
        'You must agree to the Terms of Service and Privacy Policy to register.'
      );
      return;
    }

    if (!passwordRules.match) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Use the UID from Firebase Authentication
      const uid = user.uid;

      // Store additional user information in Firestore
      await setDoc(doc(firestore, 'users', uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date(),
      });

      setStatus('Registration successful!');
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to register. Please try again.');
    }
  };

  const handleOpenTerms = () => setOpenTerms(true);
  const handleCloseTerms = () => setOpenTerms(false);
  const handleOpenPrivacy = () => setOpenPrivacy(true);
  const handleClosePrivacy = () => setOpenPrivacy(false);

  const printDocument = (ref) => {
    printJS({
      printable: ref.current,
      type: 'html',
      style: `
        @media print {
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
          }
        }
      `,
    });
  };

  return (
    <div className="register-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Register
      </Typography>
      <form onSubmit={handleSubmit} className="register-form">
        <TextField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="register-input"
        />
        <TextField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="register-input"
        />
        <TextField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="register-input"
        />
        <TextField
          label="Phone (Optional)"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
          className="register-input"
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
          className="register-input"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
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
          className="register-input"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={agreedToTermsAndPrivacy}
              onChange={handleCheckboxChange}
            />
          }
          label={
            <span>
              I agree to the{' '}
              <Button onClick={handleOpenTerms} color="primary">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button onClick={handleOpenPrivacy} color="primary">
                Privacy Policy
              </Button>
              .
            </span>
          }
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="register-button"
        >
          Register
        </Button>
      </form>
      {error && (
        <Typography color="error" variant="body2" sx={{ marginTop: 2 }}>
          {error}
        </Typography>
      )}
      {status && (
        <Typography color="success" variant="body2" sx={{ marginTop: 2 }}>
          {status}
        </Typography>
      )}

      <div className="password-rules">
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          Password must:
          <ul>
            <li>
              <span className={passwordRules.length ? 'checkmark' : 'not-met'}>
                {passwordRules.length ? '✔️' : '❌'}
              </span>
              Be 8-32 characters long
            </li>
            <li>
              <span className={passwordRules.uppercase ? 'checkmark' : 'not-met'}>
                {passwordRules.uppercase ? '✔️' : '❌'}
              </span>
              Contain one uppercase letter
            </li>
            <li>
              <span className={passwordRules.lowercase ? 'checkmark' : 'not-met'}>
                {passwordRules.lowercase ? '✔️' : '❌'}
              </span>
              Contain one lowercase letter
            </li>
            <li>
              <span className={passwordRules.number ? 'checkmark' : 'not-met'}>
                {passwordRules.number ? '✔️' : '❌'}
              </span>
              Contain one number
            </li>
            <li>
              <span className={passwordRules.specialChar ? 'checkmark' : 'not-met'}>
                {passwordRules.specialChar ? '✔️' : '❌'}
              </span>
              Contain one special character
            </li>
            <li>
              <span className={passwordRules.match ? 'checkmark' : 'not-met'}>
                {passwordRules.match ? '✔️' : '❌'}
              </span>
              Match the confirmed password
            </li>
          </ul>
        </Typography>
      </div>

      <Dialog open={openTerms} onClose={handleCloseTerms}>
        <DialogContent>
          <TermsOfService ref={termsRef} />
          <Button onClick={() => printDocument(termsRef)}>
            Print Terms of Service
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={openPrivacy} onClose={handleClosePrivacy}>
        <DialogContent>
          <PrivacyPolicy ref={privacyRef} />
          <Button onClick={() => printDocument(privacyRef)}>
            Print Privacy Policy
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Register;
