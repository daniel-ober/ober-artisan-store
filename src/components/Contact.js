import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { checkAuthentication } from '../authCheck'; 
import { fetchUserProfile, addInquiry } from '../firebaseService'; 
import { nanoid } from 'nanoid'; 
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // Modal state
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchUserData = async () => {
      const user = checkAuthentication(); 
      if (user) {
        try {
          const profile = await fetchUserProfile(user.uid);
          if (profile) {
            setFormData((prev) => ({
              ...prev,
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              email: profile.email || '',
              phone: profile.phone || '',
            }));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inquiryId = nanoid(); 
      await addInquiry({
        id: inquiryId, 
        ...formData,
        createdAt: new Date(), 
      });
      setOpen(true); // Open the modal
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    navigate('/products'); // Redirect to products page
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
          inputProps={{ minLength: 5 }} 
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          className="contact-button"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </form>

      {/* Dialog for success message */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Message Sent</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Your message has been sent successfully! Someone will be in contact with you in the next 1-2 business days.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Contact;
