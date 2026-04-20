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

  Box,

} from '@mui/material';

import { useNavigate } from 'react-router-dom';

import { checkAuthentication } from '../authCheck';

import { addInquiry, fetchUserProfile } from '../services/firebaseService';

import { nanoid } from 'nanoid';

import { getRecaptchaToken } from '../utils/loadRecaptchaEnterprise';

import './Contact.css';

/* ---- Config -------------------------------------------------------------- */

const RECAPTCHA_SITE_KEY =

  process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY || '';

/* ---- Categories (keep “Other” last) ------------------------------------- */

const inquiryCategories = [

  {

    value: 'Custom Shop',

    label: 'Custom Shop',

    desc: 'Custom drum builds, shell questions, or modifications',

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

    desc: 'Billing questions, invoices, or payment updates',

  },

  {

    value: 'Product Information',

    label: 'Product Information',

    desc: 'Product details, specifications, and recommendations',

  },

  {

    value: 'Shipping & Delivery',

    label: 'Shipping & Delivery',

    desc: 'Shipping timelines, tracking, or delivery updates',

  },

  {

    value: 'Technical Assistance',

    label: 'Technical Assistance',

    desc: 'Help using the website or customer portal',

  },

  {

    value: 'Website Feedback',

    label: 'Website Feedback',

    desc: 'Feedback, ideas, or suggestions about the website',

  },

  {

    value: 'Other',

    label: 'Other',

    desc: 'Anything else you’d like to reach out about',

  },

].sort((a, b) => {

  if (a.value === 'Other') return 1;

  if (b.value === 'Other') return -1;

  return a.label.localeCompare(b.label);

});

/* ---- SLA copy ------------------------------------------------------------ */

const categorySLA = {

  'Custom Shop': 'Typical response: 1–2 business days.',

  Endorsements: 'Typical response: 1–2 business days.',

  Other: 'Typical response: 2–3 business days.',

  'Partner Relations': 'Typical response: 2–3 business days.',

  Payments: 'Typical response: 1–2 business days.',

  'Product Information': 'Typical response: 1–2 business days.',

  'Shipping & Delivery': 'Typical response: 1–2 business days.',

  'Technical Assistance': 'Typical response: 1–2 business days.',

  'Website Feedback': 'Typical response: 2–3 business days.',

};

/* ---- Helpers ------------------------------------------------------------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_RE = /^[0-9()+\-\s.]{7,20}$/;

const MESSAGE_MAX = 1500;

const MESSAGE_MIN = 10;

const normalizePhone = (s = '') =>

  s.replace(/[^\d()+\-\s.]/g, '').slice(0, 22);

const slaWindow = (category) =>

  (categorySLA[category] || 'Typical response: 1–2 business days.').replace(

    /^typical response:\s*/i,

    ''

  );

/* ---- Component ----------------------------------------------------------- */

const Contact = () => {

  const [formData, setFormData] = useState({

    first_name: '',

    last_name: '',

    email: '',

    phone: '',

    message: '',

    category: '',

    okToContact: false,

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

    if (!formData.category) {

      next.category = 'Please select a category.';

    }

    if (!formData.first_name.trim()) {

      next.first_name = 'First name is required.';

    }

    if (!formData.last_name.trim()) {

      next.last_name = 'Last name is required.';

    }

    if (!formData.email.trim()) {

      next.email = 'Email is required.';

    } else if (!EMAIL_RE.test(formData.email.trim())) {

      next.email = 'Enter a valid email.';

    }

    if (formData.phone && !PHONE_RE.test(formData.phone)) {

      next.phone = 'Enter a valid phone number.';

    }

    const msg = formData.message.trim();

    if (!msg) {

      next.message = 'Message is required.';

    } else if (msg.length < MESSAGE_MIN) {

      next.message = `Please add a bit more detail (minimum ${MESSAGE_MIN} characters).`;

    } else if (msg.length > MESSAGE_MAX) {

      next.message = `Please shorten your message to ${MESSAGE_MAX} characters.`;

    }

    if (!formData.okToContact) {

      next.okToContact =

        'Please confirm that it is okay for us to contact you about this inquiry.';

    }

    setErrors(next);

    return Object.keys(next).length === 0;

  };

  const isValid =

    Boolean(formData.category) &&

    Boolean(formData.first_name.trim()) &&

    Boolean(formData.last_name.trim()) &&

    EMAIL_RE.test(formData.email.trim()) &&

    (!formData.phone || PHONE_RE.test(formData.phone)) &&

    formData.message.trim().length >= MESSAGE_MIN &&

    formData.message.trim().length <= MESSAGE_MAX &&

    formData.okToContact === true;

  const handleSubmit = async (e) => {

    e.preventDefault();

    const valid = validate();

    if (!valid) {

      setToast({

        open: true,

        msg: 'Please review the highlighted fields.',

        severity: 'error',

      });

      return;

    }

    setLoading(true);

    try {

      const inquiryId = nanoid();

      let recaptchaToken = null;

      if (RECAPTCHA_SITE_KEY) {

        try {

          recaptchaToken = await getRecaptchaToken(

            RECAPTCHA_SITE_KEY,

            'contact_form'

          );

        } catch (tokErr) {

          console.warn('[recaptcha] token unavailable:', tokErr);

        }

      }

      await addInquiry({

        id: inquiryId,

        ...formData,

        origin: 'web-contact',

        status: 'New',

        createdAt: new Date(),

        utm: urlParams,

        recaptchaToken,

      });

      setSubmittedCategory(formData.category);

      await new Promise((r) => setTimeout(r, 500));

      setOpen(true);

      setFormData({

        first_name: '',

        last_name: '',

        email: '',

        phone: '',

        message: '',

        category: '',

        okToContact: false,

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

  const selectedCategory = inquiryCategories.find(

    (c) => c.value === formData.category

  );

  return (

    <div className="contact-page">

      <div className="contact-page-overlay" />

      <div className="contact-shell">

        <div className="contact-hero">

          <Typography className="contact-eyebrow">Get in Touch</Typography>

          <Typography variant="h2" component="h1" className="contact-header">

            Contact Ober Artisan

          </Typography>

          <Typography variant="body1" className="contact-subheader">

            Questions about a build, an order, a product, or something else?

            Send a note below and we’ll respond as soon as we can.

          </Typography>

        </div>

        <form

          onSubmit={handleSubmit}

          className="contact-form-container"

          noValidate

        >

          <div className="contact-form-topline">

            <div className="contact-form-topline-copy">

              <Typography className="contact-form-title">

                Start the conversation

              </Typography>

              <Typography className="contact-intro">

                Thoughtful questions deserve thoughtful replies.

              </Typography>

              <Typography className="contact-response-text">

                {formData.category

                  ? categorySLA[formData.category] ||

                    'Typical response: 1–2 business days.'

                  : 'Typical response: 1–2 business days.'}

              </Typography>

            </div>

          </div>

          <Grid container spacing={2.25}>

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

                          sx: {

                            color: 'rgba(190, 190, 190, 0.82)',

                            whiteSpace: 'normal',

                            overflow: 'hidden',

                            textOverflow: 'ellipsis',

                            display: '-webkit-box',

                            WebkitLineClamp: 2,

                            WebkitBoxOrient: 'vertical',

                            lineHeight: 1.28,

                            mt: 0.45,

                            fontSize: '0.92rem',

                          },

                        }}

                      />

                    </MenuItem>

                  ))}

                </Select>

                {selectedCategory?.desc && (

                  <Box className="contact-category-meta">

                    <Typography

                      variant="caption"

                      className="contact-category-desc"

                    >

                      {selectedCategory.desc}

                    </Typography>

                  </Box>

                )}

                {errors.category && (

                  <Typography

                    id="category-helper"

                    variant="caption"

                    color="error"

                    sx={{ mt: 0.65 }}

                  >

                    {errors.category}

                  </Typography>

                )}

              </FormControl>

            </Grid>

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

                minRows={5}

                maxRows={8}

                className="contact-input"

                error={Boolean(errors.message)}

                helperText={

                  errors.message ? (

                    errors.message

                  ) : (

                    <span className="char-counter">

                      {`${formData.message.trim().length}/${MESSAGE_MAX}`}

                    </span>

                  )

                }

                inputProps={{ maxLength: MESSAGE_MAX }}

                InputLabelProps={{ shrink: true }}

              />

            </Grid>

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

                  label="It’s okay to contact me by email or text about this inquiry."

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

      </div>

      <Dialog

        open={open}

        onClose={handleCloseDialog}

        className="contact-dialog"

      >

<DialogTitle className="contact-dialog-title">

  <span className="contact-dialog-check" aria-hidden="true">

    ✓

  </span>

  <span>Message sent</span>

</DialogTitle>

        <DialogContent>

          <Typography variant="body1" sx={{ mb: 1 }}>

            Thank you for reaching out. We’ll follow up within{' '}

            {slaWindow(submittedCategory)}

          </Typography>

          <Typography variant="body1">

            In the meantime, feel free to explore the Artisan Shop.

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