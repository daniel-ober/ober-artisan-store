import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import './SoundlegendProductDetail.css';

const SoundLegendProductDetail = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [open, setOpen] = useState(false);

  const [size, setSize] = useState('14');
  const [depth, setDepth] = useState('6.5');
  const [shellConstruction, setShellConstruction] = useState('Stave');
  const [woodSpecies, setWoodSpecies] = useState('Maple');
  const [snareBedDepth, setSnareBedDepth] = useState('Medium');
  const [consultationDate, setConsultationDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const scrollContainer =
      document.querySelector('.soundlegend-product-detail') ||
      document.documentElement ||
      document.body;
    scrollContainer.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => navigate('/artisan-shop'), 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submissionData = {
        firstName,
        lastName,
        email,
        phone,
        size,
        depth,
        shellConstruction,
        woodSpecies,
        snareBedDepth,
        consultationDate,
        status: 'New',
        submittedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'soundlegend_submissions'), submissionData);
      await new Promise((resolve) => setTimeout(resolve, 700));
      setOpen(true);

      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSize('14');
      setDepth('6.5');
      setShellConstruction('Stave');
      setWoodSpecies('Maple');
      setSnareBedDepth('Medium');
      setConsultationDate('');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Submission failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="soundlegend-product-detail">
      <img
        src="/resized-logos/soundlegend-white.png"
        alt="SOUNDLEGEND Series"
        className="soundlegend-header-image"
      />

      <div className="soundlegend-product-content">
        <div className="soundlegend-product-image">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/artisan%2Fsoundlegend%2FIMG_1803.jpeg?alt=media&token=0dd78f95-2101-44e7-b95f-2b7cbe3c01a1"
            alt="SOUNDLEGEND Experience"
          />
          <h2 className="soundlegend-header">
            Build Your Custom SoundLegend Snare
          </h2>
          <p>
            Your sound is unique—your snare should be too. The{' '}
            <strong>SoundLegend Series</strong> is a fully custom, handcrafted
            drum built to bring your artistic vision to life.
          </p>
          <p>
            In a one-on-one collaboration with{' '}
            <strong>Ober Artisan founder, Dan Ober</strong>, you'll design a
            snare drum that reflects your playing style and sonic identity.
          </p>
          <p>
            With high-resolution concept renderings, VIP access to
            behind-the-scenes content, and a personal consultation, you'll see
            your dream snare come to life before it even hits the workbench.
          </p>
          <p>
            This isn’t about picking from a catalog—it’s about crafting a
            one-of-a-kind snare that’s truly yours.
          </p>
          <p>
            <strong>Your Story. Your Sound. Your Legacy.</strong>
          </p>
        </div>

        <div className="soundlegend-product-options">
          <div className="soundlegend-features">
            <h2>Key Features</h2>
            <ul>
              <li>Custom Handcrafted Snare Drum</li>
              <li>Collaborate directly with Artisan, Dan Ober</li>
              <li>High-Resolution Mockup Renders</li>
              <li>Behind-the-scenes access</li>
              <li>Limited Edition gift item</li>
              <li>Builds starting at $1250</li>
            </ul>
          </div>

          <div className="customer-header">Customer Information</div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="phone">Phone</label>
            <div className="phone-input-container">
              <input
                type="tel"
                id="phone"
                value={phone.replace('+1 ', '')}
                onChange={(e) => {
                  let input = e.target.value.replace(/\D/g, '');
                  if (input.length > 10) input = input.slice(0, 10);
                  if (input.length >= 6) {
                    input = `${input.slice(0, 3)}-${input.slice(3, 6)}-${input.slice(6, 10)}`;
                  } else if (input.length >= 3) {
                    input = `${input.slice(0, 3)}-${input.slice(3)}`;
                  }
                  setPhone('+1 ' + input);
                }}
                required
                placeholder="123-456-7890"
              />
            </div>
            <p className="phone-hint">Enter a valid 10-digit phone number.</p>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Start Your Custom Snare Journey'}
            </button>
          </form>

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Request Sent</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Thank you for reaching out! We'll get back to you within 1–2 business days.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">Continue</Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SoundLegendProductDetail;