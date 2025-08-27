import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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

/* ---------- Minimal inline 360 viewer (no external libs) ---------- */
const InlineFrame360 = ({
  totalFrames = 480, // set to your exact count
  basePath = '/soundlegend360/med', // where frame_001.webp ... live (public/)
  prefix = 'frame_',
  pad = 3,
  ext = 'webp',
  fps = 30,
  dragSensitivity = 0.25,
}) => {
  const [loaded, setLoaded] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [frame, setFrame] = React.useState(0);
  const imgsRef = React.useRef([]);
  const rafRef = React.useRef(null);
  const lastTsRef = React.useRef(0);
  const draggingRef = React.useRef(false);
  const lastXRef = React.useRef(0);

  const urlFor = React.useCallback(
    (i) => {
      const n = String(i + 1).padStart(pad, '0');
      return `${basePath}/${prefix}${n}.${ext}`;
    },
    [basePath, prefix, pad, ext]
  );

  // Preload frames once
  React.useEffect(() => {
    imgsRef.current = Array.from({ length: totalFrames }, (_, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.src = urlFor(i);
      img.onload = () => setLoaded((v) => v + 1);
      return img;
    });
    return () => {
      imgsRef.current = [];
    };
  }, [totalFrames, urlFor]);

  // Autoplay
  React.useEffect(() => {
    const tick = (ts) => {
      if (!isPlaying) return;
      const ft = 1000 / fps;
      const delta = ts - (lastTsRef.current || ts);
      if (delta >= ft) {
        lastTsRef.current = ts;
        setFrame((f) => (f + 1) % totalFrames);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (isPlaying && loaded > 0) {
      lastTsRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [isPlaying, fps, loaded, totalFrames]);

  // Drag to scrub
  const onDown = (e) => {
    draggingRef.current = true;
    lastXRef.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setIsPlaying(false);
  };
  const onMove = (e) => {
    if (!draggingRef.current) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? lastXRef.current;
    const dx = x - lastXRef.current;
    lastXRef.current = x;
    if (Math.abs(dx) < 0.01) return;
    const step = Math.round(-dx * dragSensitivity);
    if (step) {
      setFrame((f) => {
        let nf = (f + step) % totalFrames;
        if (nf < 0) nf += totalFrames;
        return nf;
      });
    }
  };
  const onUp = () => {
    draggingRef.current = false;
  };

  const pct = Math.round((loaded / totalFrames) * 100);
  const src = imgsRef.current[frame]?.src || urlFor(0); // never black

  return (
    <div
      className="sl360-stage"
      onMouseDown={onDown}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchStart={onDown}
      onTouchMove={onMove}
      onTouchEnd={onUp}
      role="img"
      aria-label="360 degree product viewer"
      tabIndex={0}
    >
      <img src={src} alt="SoundLegend 360 view" draggable={false} />
      {loaded < totalFrames && (
        <div className="sl360-loader">
          <div className="sl360-bar">
            <div style={{ width: `${pct}%` }} />
          </div>
          <span>Loading {pct}%</span>
        </div>
      )}
      <div className="sl360-controls">
        {/* <button type="button" onClick={() => setIsPlaying((p) => !p)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button> */}
        <span className="sl360-hint">Drag to rotate</span>
      </div>
    </div>
  );
};
/* ------------------------------------------------------------------ */

const SoundLegendProductDetail = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  // Phone: digits-only while typing; dashed on blur
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);

  const [open, setOpen] = useState(false);

  // (kept from your original state — not shown in the form here)
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

  // ---------- helpers ----------
  const onlyDigits = (s = '') => s.replace(/\D/g, '').slice(0, 10);
  const formatDashed = (d) => {
    if (!d) return '';
    if (d.length >= 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length >= 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d;
  };
  const isPhoneValid = phoneDigits.length === 10;
  const isEmailFormat = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((val || '').trim());

  // Validate visible fields (add more keys here if you add more inputs)
  const validate = () => {
    const missing = [];
    if (!firstName.trim()) missing.push('First Name');
    if (!lastName.trim()) missing.push('Last Name');
    if (!email.trim()) missing.push('Email');
    if (!phoneDigits) missing.push('Phone');

    const issues = [];
    if (email && !isEmailFormat(email)) issues.push('Valid Email');
    if (phoneDigits && !isPhoneValid) issues.push('Valid 10-digit Phone');

    return { missing, issues };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { missing, issues } = validate();
    if (missing.length || issues.length) {
      const lines = [];
      if (missing.length) lines.push(`Missing required: ${missing.join(', ')}`);
      if (issues.length) lines.push(`Please fix: ${issues.join(', ')}`);
      alert(lines.join('\n'));
      return; // stop submission
    }

    setIsSubmitting(true);

    try {
      const dashed = formatDashed(phoneDigits); // "123-456-7890"
      const phonePretty = `+1 ${dashed}`; // "+1 123-456-7890"
      const phoneE164 = `+1${phoneDigits}`; // "+11234567890" (handy for querying)

      const submissionData = {
        firstName,
        lastName,
        email,
        phone: phonePretty,
        phoneE164,
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
      await new Promise((r) => setTimeout(r, 700));
      setOpen(true);

      // resets
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneDigits('');
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
        {/* LEFT: Static hero image instead of 360 viewer */}
        <div className="soundlegend-product-image">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/soundlegend_showroom%2FSL-001%2Fgallery%2F0-IMG_1803.jpg?alt=media&token=f84c86d4-f111-4156-87c7-3b5e5992df28"
            alt="SoundLegend Snare Hero"
            className="soundlegend-hero-img"
          />

          <h2 className="sl-header-section">
            Build Your Custom SoundLegend Snare
          </h2>
          <div className="sl-desc-section">
            Your sound is unique—your snare should be too. The{' '}
            <strong>SoundLegend Series</strong> is a fully custom, handcrafted
            drum built to bring your artistic vision to life.
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
            <div className="slogan">Your Story. Your Sound. Your Legacy.</div>
          </div>
        </div>

        {/* RIGHT: features + form stays unchanged */}
        <div className="soundlegend-product-options">
          <div className="soundlegend-features">
            <h2>Key Features</h2>
            <ul>
              <li>Custom Handcrafted Snare Drum</li>
              <li>Collaborate directly with Artisan, Dan Ober</li>
              <li>High-Resolution Mockup Renders</li>
              <li>Behind-the-scenes access</li>
              <li>Limited Edition gift item</li>
              <li>Builds starting at $1499</li>
            </ul>
          </div>

          <div className="customer-header">Customer Information</div>
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              aria-required="true"
            />

            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              aria-required="true"
            />

            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              autoComplete="email"
            />

            <label htmlFor="phone">Phone</label>
            <div className="phone-input-container">
              <input
                type="tel"
                id="phone"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="123-456-7890"
                value={phoneFocused ? phoneDigits : formatDashed(phoneDigits)}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                onChange={(e) => setPhoneDigits(onlyDigits(e.target.value))}
                required
                aria-required="true"
                aria-invalid={phoneDigits ? !isPhoneValid : undefined}
              />
            </div>
            <p className="phone-hint">Enter a valid 10-digit phone number.</p>

            <button type="submit">
              {isSubmitting
                ? 'Submitting...'
                : 'Start Your Custom Snare Journey'}
            </button>
          </form>

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Request Sent</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Thank you for reaching out! We'll get back to you within 1–2
                business days.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Continue
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </div>

      {/* --- Explore Legacy Vault band --- */}
      {/* <section className="sl-vault-cta">
        <div className="sl-vault-cta-inner">
          <div
            className="sl-vault-logo-bg"
            role="img"
            aria-label="Legacy Vault"
            style={{ backgroundImage: 'url(/legacy-vault-nav/white.png)' }}
          />
          <div className="sl-vault-copy">
            <h3>Explore our Legacy Vault</h3>
            <p>
              Hear real drums, meet the artists, and dive into specs, stories,
              photos, and Legacy Tuning™ samples for each instrument.
            </p>
          </div>
          <div className="sl-vault-actions">
            <Link
              to="/artisan-shop/soundlegend/vault"
              className="sl-vault-btn primary"
            >
              Explore the Vault
            </Link>
            <Link
              to="/artisan-shop/soundlegend/vault/learn/legacy-tuning"
              className="sl-vault-btn ghost"
            >
              What is Legacy Tuning?
            </Link>
          </div>
        </div>
      </section> */}
    </div>
  );
};

export default SoundLegendProductDetail;
