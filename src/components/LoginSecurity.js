import React, { useState } from 'react';
import { Typography, TextField, Button, InputAdornment } from '@mui/material';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const LoginSecurity = () => {
  const [formData, setFormData] = useState({
    firstName: 'Daniel',
    lastName: 'Ober',
    email: 'chilldrummer@gmail.com',
    phone: '+16151234567',
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const saveChanges = (field) => {
    alert(`${field} updated successfully!`);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Login & Security
      </Typography>
      <Typography variant="body1" gutterBottom>
        Update your account information:
      </Typography>
      <div className="login-security-section">
        <TextField
          label="First Name"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Last Name"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          fullWidth
          margin="normal"
        />
        <PhoneInput
          country={'us'}
          value={formData.phone}
          onChange={(value) => handleChange('phone', value)}
        />
        <Button variant="contained" color="primary" onClick={() => saveChanges('Name')}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default LoginSecurity;
