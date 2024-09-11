import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Typography } from '@mui/material';
import { checkAuthentication } from '../authCheck'; // Ensure this function checks auth status correctly
import { fetchUserProfile } from '../firebaseService'; // Ensure fetchUserProfile is implemented and exported
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = checkAuthentication(); // Function to get the current authenticated user
    if (user) {
      fetchUserProfile(user.uid).then(profile => {
        if (profile) {
          setFormData(prev => ({
            ...prev,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || '',
            phone: profile.phone || ''
          }));
        }
      }).catch(error => {
        console.error('Error fetching user profile:', error);
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(''); // Reset status before submitting
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact.json`, formData); // Use environment variable for API URL
      setStatus('Message sent successfully!');
      setFormData({ first_name: '', last_name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Contact Us
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="contact-input"
        />
        <TextField
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="contact-input"
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
          className="contact-input"
        />
        <TextField
          label="Phone (Optional)"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
          className="contact-input"
        />
        <TextField
          label="Message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          multiline
          rows={4}
          className="contact-input"
          inputProps={{ minLength: 20 }} // Minimum character limit
        />
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          className="contact-button"
          disabled={loading} // Disable button while loading
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </form>
      {status && (
        <Typography variant="body2" color="textSecondary" sx={{ marginTop: 2 }}>
          {status}
        </Typography>
      )}
    </div>
  );
};

export default Contact;