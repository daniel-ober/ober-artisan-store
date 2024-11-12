import React, { useState, useRef } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig'; // Assuming 'db' is your Firestore instance
import {
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TermsOfService from './TermsOfService';
import PrivacyPolicy from './PrivacyPolicy';
import './Register.css';
import printJS from 'print-js';

const Register = ({ orderDetails }) => {
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
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false); // Success popup dialog
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate(); // Used for navigation after successful signup
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
      // Create user without affecting the admin's authentication state
      const newUserCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Use the UID from the newly created user
      const uid = newUserCredential.user.uid;

      // Prepare data to store in Firestore
      const userDocData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        status: "active",
        createdAt: new Date(),
      };

      // Store order details if they exist (checking if orderDetails is passed correctly)
      if (orderDetails) {
        userDocData.orderDetails = orderDetails; // Only add if orderDetails is present
      }

      // Store additional user information in Firestore
      await setDoc(doc(db, 'users', uid), userDocData);

      setStatus('Registration successful!');
      setOpenSuccessDialog(true); // Open the success dialog popup
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

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    navigate('/products'); // Redirect to the Products page after clicking "OK"
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
                  aria-label="toggle password visibility"
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
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Password rules section */}
        <div className="password-rules">
          <Typography variant="body2" sx={{ marginTop: 2 }}>
            Password must:
            <ul>
              {/* Display password rules */}
              {/* Checkmark or cross for each rule */}
            </ul>
          </Typography>
        </div>

        {/* Terms and Privacy Agreement */}
        <FormControlLabel
          control={
            <Checkbox
              checked={agreedToTermsAndPrivacy}
              onChange={handleCheckboxChange}
            />
          }
          label={
            <span>
              I have read and agree to the{' '}
              <span
                onClick={handleOpenTerms}
                className="terms-link"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') handleOpenTerms(); }}
              >
                Terms of Service
              </span>{' '}
              and{' '}
              <span
                onClick={handleOpenPrivacy}
                className="privacy-link"
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') handleOpenPrivacy(); }}
              >
                Privacy Policy
              </span>
              .
            </span>
          }
        />

        {/* Error and Success Messages */}
        {error && (
          <Typography color="error" variant="body2" sx={{ marginTop: 2 }}>
            {error}
          </Typography>
        )}
        {status && (
          <Typography color="primary" variant="body2" sx={{ marginTop: 2 }}>
            {status}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={!agreedToTermsAndPrivacy || !formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword}
          className="register-button"
        >
          Register
        </Button>
      </form>

      {/* Success Dialog */}
      <Dialog open={openSuccessDialog} onClose={handleCloseSuccessDialog}>
        <DialogTitle>Registration Successful!</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Your account has been created successfully. You can now log in and
            start exploring our products.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terms and Privacy Modal */}
      <TermsOfService open={openTerms} onClose={handleCloseTerms} />
      <PrivacyPolicy open={openPrivacy} onClose={handleClosePrivacy} />
    </div>
  );
};

export default Register;
