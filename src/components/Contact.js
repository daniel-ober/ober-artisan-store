import React, { useState, useEffect, useMemo } from 'react';
import {
  TextField,
  Button,
  MenuItem,
  FormControl,
  Typography,
  Select,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  ListItemText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { checkAuthentication } from '../authCheck';
import { addInquiry, fetchUserProfile } from '../services/firebaseService';
import { nanoid } from 'nanoid';
import './Contact.css';

// Keep "Other" last while alphabetizing everything else by label
const inquiryCategories = [
  {
    value: 'Custom Shop',
    label: 'Custom Shop',
    desc: 'Custom drum builds or modifications',
  },
  {
    value: 'Endorsements',
    label: 'Endorsements',
    desc: 'Artist relations and endorsement requests',
  },
  {
    value: 'Partner Relations',
    label: 'Partner Relations',
    desc: 'Vendor inquiries or partnership opportunities',
  },
  {
    value: 'Payments',
    label: 'Payments',
    desc: 'Update billing or inquire about payments',
  },
  {
    value: 'Product Information',
    label: 'Product Information',
    desc: 'Ask about products or specifications',
  },
  {
    value: 'Shipping & Delivery',
    label: 'Shipping & Delivery',
    desc: 'Shipping updates or tracking info',
  },
  {
    value: 'Technical Assistance',
    label: 'Technical Assistance',
    desc: 'Technical guidance using the website',
  },
  {
    value: 'Website Feedback',
    label: 'Website Feedback',
    desc: 'Share feedback or ideas',
  },
  {
    value: 'Other',
    label: 'Other',
    desc: 'Anything that doesn’t fit a category',
  },
].sort((a, b) => {
  if (a.value === 'Other') return 1;
  if (b.value === 'Other') return -1;
  return a.label.localeCompare(b.label);
});

// Category response windows (used in hint + success dialog)
const categorySLA = {
  'Custom Shop': 'Typical Response: 1–2 business days.',
  Endorsements: 'Typical Response: 1–2 business days.',
  Other: 'Typical Response: 2–3 business days.',
  'Partner Relations': 'Typical Response: 2–3 business days.',
  Payments: 'Typical Response: 1–2 business days.',
  'Product Information': 'Typical Response: 1–2 business days.',
  'Shipping & Delivery': 'Typical Response: 1–2 business days.',
  'Technical Assistance': 'Typical Response: 1–2 business days.',
  'Website Feedback': 'Typical Response: 2–3 business days.',
};

// helpers
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9()+\-\s.]{7,20}$/;
const MESSAGE_MAX = 1500;
const MESSAGE_MIN = 10;

const normalizePhone = (s = '') => s.replace(/[^\d()+\-\s.]/g, '').slice(0, 22);

// turn "Typical Response: 1–2 business days." -> "1–2 business days."
const slaWindow = (category) =>
  (categorySLA[category] || 'Typical Response: 1–2 business days.').replace(
    /^typical response:\s*/i,
    ''
  );

const Contact = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    message: '',
    category: '',
    okToContact: false, // must be checked to submit
    // honeypot (keep blank)
    company: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    msg: '',
    severity: 'error',
  });
  const [submittedCategory, setSubmittedCategory] = useState('');
  const navigate = useNavigate();

  // Optional: capture UTM/source info
  const urlParams = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      return Object.fromEntries(u.searchParams.entries());
    } catch {
      return {};
    }
  }, []);

  useEffect(() => {
    const prefill = async () => {
      const user = checkAuthentication();
      if (!user) return;
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
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    prefill();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'phone'
          ? normalizePhone(value)
          : type === 'checkbox'
            ? checked
            : value,
    }));
  };

  const validate = () => {
    const next = {};
    if (!formData.category) next.category = 'Please select a category.';
    if (!formData.first_name.trim())
      next.first_name = 'First name is required.';
    if (!formData.last_name.trim()) next.last_name = 'Last name is required.';
    if (!formData.email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_RE.test(formData.email.trim()))
      next.email = 'Enter a valid email.';
    if (formData.phone && !PHONE_RE.test(formData.phone))
      next.phone = 'Enter a valid phone (optional).';
    const msg = formData.message.trim();
    if (!msg) next.message = 'Message is required.';
    else if (msg.length < MESSAGE_MIN)
      next.message = `Please add more detail (min ${MESSAGE_MIN} chars).`;
    else if (msg.length > MESSAGE_MAX)
      next.message = `Please shorten to ${MESSAGE_MAX} characters.`;

    // require consent
    if (!formData.okToContact)
      next.okToContact =
        'Please agree so we can contact you about this inquiry.';

    // honeypot
    if (formData.company && formData.company.trim().length > 0) {
      next._bot = 'Something went wrong. Please try again.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // disable submit until reasonable validity (including consent)
  const isValid =
    formData.category &&
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    EMAIL_RE.test(formData.email.trim()) &&
    (!formData.phone || PHONE_RE.test(formData.phone)) &&
    formData.message.trim().length >= MESSAGE_MIN &&
    formData.okToContact === true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({
        open: true,
        msg: 'Please fix the highlighted fields.',
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const inquiryId = nanoid();

      await addInquiry({
        id: inquiryId,
        ...formData,
        origin: 'web-contact',
        status: 'New',
        createdAt: new Date(),
        utm: urlParams,
      });

      // capture category before resetting so dialog can be dynamic
      setSubmittedCategory(formData.category);

      await new Promise((r) => setTimeout(r, 500));
      setOpen(true);

      // reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        message: '',
        category: '',
        okToContact: false,
        company: '',
      });
      setErrors({});
    } catch (error) {
      console.error('Error sending message:', error);
      setToast({
        open: true,
        msg: 'Could not send your message. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    navigate('/artisan-shop');
  };

  return (
    <div className="contact-page">
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        className="contact-header"
      >
        Contact Us
      </Typography>

      <form
        onSubmit={handleSubmit}
        className="contact-form-container"
        noValidate
      >
        {/* Short intro (fits on one line) */}
        <Typography
          variant="subtitle1"
          align="center"
          className="contact-intro"
        >
          Questions, comments, feedback? Use this form to contact us.
        </Typography>

        {/* Honeypot (hidden) */}
        <div className="hp-wrapper" aria-hidden>
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            tabIndex={-1}
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <Grid container spacing={2}>
          {/* Category */}
          <Grid item xs={12}>
            <FormControl
              fullWidth
              required
              error={Boolean(errors.category)}
              className="contact-dropdown"
            >
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                label="Category"
                value={formData.category}
                onChange={handleChange}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) return <em>Select a category</em>;
                  const item = inquiryCategories.find(
                    (c) => c.value === selected
                  );
                  return item ? item.label : selected;
                }}
                inputProps={{
                  'aria-describedby': errors.category
                    ? 'category-helper'
                    : undefined,
                }}
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>

                {inquiryCategories.map((cat) => (
                  <MenuItem
                    key={cat.value}
                    value={cat.value}
                    className="contact-menu-item"
                  >
                    <ListItemText
                      primary={cat.label}
                      secondary={cat.desc}
                      primaryTypographyProps={{
                        noWrap: true,
                        sx: { fontWeight: 600 },
                      }}
                      secondaryTypographyProps={{
                        // always show, brighter, up to 2 lines
                        sx: {
                          color: 'rgba(183, 183, 183, 0.76)',
                          display: 'block',
                          whiteSpace: 'normal',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: 1.2,
                          mt: 0.5,
                          fontSize: '0.92rem',
                        },
                      }}
                    />
                  </MenuItem>
                ))}
              </Select>

              {/* Description + SLA under select */}
              {formData.category &&
                (() => {
                  const picked = inquiryCategories.find(
                    (c) => c.value === formData.category
                  );
                  return (
                    <>
                      {picked?.desc && (
                        <Typography
                          variant="caption"
                          sx={{ mt: 0.5, display: 'block', opacity: 0.85 }}
                        >
                          {picked.desc}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{ mt: 0.25, display: 'block', opacity: 0.8 }}
                      >
                        {categorySLA[formData.category] ||
                          'Typical Response: 1–2 business days.'}
                      </Typography>
                    </>
                  );
                })()}

              {errors.category && (
                <Typography
                  id="category-helper"
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5 }}
                >
                  {errors.category}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* First / Last */}
          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
              required
              className="contact-input"
              error={Boolean(errors.first_name)}
              helperText={errors.first_name}
              autoComplete="given-name"
              inputProps={{ autoCapitalize: 'words' }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
              required
              className="contact-input"
              error={Boolean(errors.last_name)}
              helperText={errors.last_name}
              autoComplete="family-name"
              inputProps={{ autoCapitalize: 'words' }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Email / Phone */}
          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              className="contact-input"
              error={Boolean(errors.email)}
              helperText={errors.email}
              autoComplete="email"
              inputProps={{ inputMode: 'email' }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              variant="outlined"
              label="Phone (Optional)"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
              className="contact-input"
              error={Boolean(errors.phone)}
              helperText={errors.phone}
              autoComplete="tel"
              inputProps={{ inputMode: 'tel' }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Message */}
          <Grid item xs={12} className="message-grid">
    <TextField
  variant="outlined"
  label="Message"
  name="message"
  value={formData.message}
  onChange={handleChange}
  fullWidth
  required
  multiline
  minRows={2}   // was 4
  maxRows={4}   // optional: prevents it from expanding too tall
  className="contact-input"
  error={Boolean(errors.message)}
  helperText={
    errors.message
      ? errors.message
      : <span className="char-counter">{`${formData.message.trim().length}/${MESSAGE_MAX} characters`}</span>
  }
  inputProps={{ maxLength: MESSAGE_MAX }}
  InputLabelProps={{ shrink: true }}
/>
          </Grid>

          {/* Consent (required) */}
          <Grid item xs={12} className="consent-grid">
            <div className="consent-row">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.okToContact}
                    onChange={handleChange}
                    name="okToContact"
                    color="primary"
                  />
                }
                label="It's okay to contact me via email or text about this inquiry."
              />
            </div>
            {errors.okToContact && (
              <Typography
                variant="caption"
                color="error"
                className="consent-error"
              >
                {errors.okToContact}
              </Typography>
            )}
          </Grid>

          {/* Submit */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              className="contact-button"
              disabled={loading || !isValid}
            >
              {loading ? <CircularProgress size={22} /> : 'Send Message'}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Success dialog with dynamic SLA */}
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#22c55e',
              color: '#fff',
              fontWeight: 700,
            }}
            aria-hidden
          >
            ✓
          </span>
          Message sent
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 0.5 }}>
            Thank you for reaching out! We’ll get back to you within{' '}
            {slaWindow(submittedCategory)}.
          </Typography>
          <Typography variant="body1">
            In the meantime, feel free to explore our Artisan Shop.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Contact;
