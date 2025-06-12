import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  FormControl,
  Typography,
  Select,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { checkAuthentication } from '../authCheck';
import { addInquiry, fetchUserProfile } from '../services/firebaseService';
import { nanoid } from 'nanoid';
import './Contact.css';

const inquiryCategories = [
  { value: 'Billing', label: 'Billing – Update billing or inquire about payments' },
  { value: 'Custom Shop', label: 'Custom Shop – Custom drum builds or modifications' },
  { value: 'Partner Relations', label: 'Partner Relations – Vendor inquiries or partnership opportunities' },
  { value: 'Product Information', label: 'Product Information – Ask about products or specifications' },
  { value: 'Shipping & Delivery', label: 'Shipping & Delivery – Shipping updates or tracking info' },
  { value: 'Technical Assistance', label: 'Technical Assistance – Account and login issues' },
  { value: 'Website Feedback', label: 'Website Feedback – Share feedback or ideas' },
  { value: 'Other', label: 'Other' },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const inquiryId = nanoid();
      await addInquiry({
        id: inquiryId,
        ...formData,
        origin: 'web-contact',
        status: 'New',
        createdAt: new Date(),
      });

      await new Promise((resolve) => setTimeout(resolve, 700));

      setOpen(true);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        message: '',
        category: '',
      });
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    navigate('/artisan-shop');
  };

  return (
    <div className="contact-container">
      <Typography variant="h4" component="h1" gutterBottom className="contact-header">
        Contact Us
      </Typography>

      <form onSubmit={handleSubmit} className="form-container">
        <FormControl fullWidth margin="normal" required variant="outlined" className="contact-dropdown">
          <Select
            name="category"
            value={formData.category}
            onChange={handleChange}
            displayEmpty
            className="contact-select"
          >
            <MenuItem value=""><em>Select a category</em></MenuItem>
            {inquiryCategories.map((cat) => (
              <MenuItem key={cat.value} value={cat.value} className="contact-menu-item">
                {cat.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          variant="outlined"
          label="First Name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="contact-input"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          variant="outlined"
          label="Last Name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="contact-input"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          variant="outlined"
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          className="contact-input"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          variant="outlined"
          label="Phone (Optional)"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          fullWidth
          margin="normal"
          className="contact-input"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          variant="outlined"
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
          InputLabelProps={{ shrink: true }}
        />

        <Button type="submit" variant="contained" color="primary" className="contact-button" disabled={loading}>
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </form>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Message Sent</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Thank you for reaching out! We'll get back to you within 1–2 business days. Feel free to explore our Artisan Shop.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Continue</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Contact;