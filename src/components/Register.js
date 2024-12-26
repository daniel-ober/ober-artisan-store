import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
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
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false); // Success popup dialog
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate(); // Used for navigation after successful signup

  const passwordRules = {
    length: formData.password.length >= 8 && formData.password.length <= 32,
    uppercase: /[A-Z]/.test(formData.password),
    lowercase: /[a-z]/.test(formData.password),
    number: /\d/.test(formData.password),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    match: formData.password === formData.confirmPassword,
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/account');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

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
      setError('You must agree to the Terms of Service and Privacy Policy to register.');
      return;
    }

    if (!passwordRules.match) {
      setError('Passwords do not match');
      return;
    }

    try {
      const newUserCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const uid = newUserCredential.user.uid;
      const userDocData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        status: 'active',
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', uid), userDocData);

      setStatus('Registration successful!');
      setOpenSuccessDialog(true);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Failed to register. Please try again.');
    }
  };

  const handleOpenTerms = () => setOpenTerms(true);
  const handleCloseTerms = () => setOpenTerms(false);
  const handleOpenPrivacy = () => setOpenPrivacy(true);
  const handleClosePrivacy = () => setOpenPrivacy(false);

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false);
    navigate('/products');
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

        {/* Terms and Privacy Agreement */}
        <div className="legal-checkbox">
  <Checkbox
    checked={agreedToTermsAndPrivacy}
    onChange={handleCheckboxChange}
  />
  <span>
    I have read and agree to the{' '}
    <span className="inline-links">
      <button
        type="button"
        onClick={handleOpenTerms}
        className="terms-link"
      >
        Terms of Service
      </button>
      {' and '}
      <button
        type="button"
        onClick={handleOpenPrivacy}
        className="privacy-link"
      >
        Privacy Policy
      </button>
    </span>
    .
  </span>
</div>



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
          fullWidth
        >
          Register
        </Button>
      </form>

      {/* Success Dialog */}
      <Dialog
        open={openSuccessDialog}
        onClose={handleCloseSuccessDialog}
        aria-labelledby="success-dialog-title"
      >
        <DialogTitle id="success-dialog-title">Registration Successful</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Your registration was successful!</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuccessDialog} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={openTerms} onClose={handleCloseTerms}>
        <DialogContent>
          <TermsOfService />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTerms}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={openPrivacy} onClose={handleClosePrivacy}>
        <DialogContent>
          <PrivacyPolicy />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrivacy}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Register;
