import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import './SoundlegendProductDetail.css';

import SoundLegend360Viewer from '../components/SoundLegend360Viewer';

const CRUISE_RPS = 0.12;
const ZOOMS = [1, 2, 3]; // 1×, 2×, 3×

const FEATURED_LEGACY = [
  {
    id: 'artist-1',
    name: 'Rick “Doc” S.',
    role: 'Retired Child Psychiatrist • Americana/Classic Rock',
    quote:
      'The SoundLegend brought my hands back to life. Responsive, musical, and inspiring.',
    photo: '/legacy/artist_rick.jpg',
    link: '/legacy/rick',
  },
  {
    id: 'artist-2',
    name: 'Tony D.',
    role: 'Taj Mahal Quintet • Roots/Blues',
    quote: 'Warmth, crack, and control. It just breathes with the band.',
    photo: '/legacy/artist_tony.jpg',
    link: '/legacy/tony',
  },
  {
    id: 'artist-3',
    name: 'Maya R.',
    role: 'Indie/Folk • Studio/Live',
    quote: 'It records beautifully. Zero fuss. Pure character.',
    photo: '/legacy/artist_maya.jpg',
    link: '/legacy/maya',
  },
];

// max pan in % of element width/height for a given zoom (keeps edges inside frame)
const getMaxPct = (s) => ((s - 1) / s) * 50; // e.g., 2× => 25%, 3× => 33.333%

const SoundLegendProductDetail = () => {
  // -------- Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // kept fields (still posted)
  const [size, setSize] = useState('14');
  const [depth, setDepth] = useState('6.5');
  const [shellConstruction, setShellConstruction] = useState('Stave');
  const [woodSpecies, setWoodSpecies] = useState('Maple');
  const [snareBedDepth, setSnareBedDepth] = useState('Medium');
  const [consultationDate, setConsultationDate] = useState('');

  const navigate = useNavigate();

  // -------- 360 viewer
  const viewerRef = useRef(null);
  const heroFrameRef = useRef(null);

  // start paused
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0);

  // Zoom & Pan (CSS-driven)
  const [zoom, setZoom] = useState(1);
  const [panXPct, setPanXPct] = useState(0); // -max..+max
  const [panYPct, setPanYPct] = useState(0); // -max..+max

  // rotation easing
  const rafRef = useRef(null);
  const animFromRef = useRef(0);
  const animToRef = useRef(0);
  const animStartRef = useRef(0);
  const animDurRef = useRef(1200);
  const easing = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

  const tweenSpeed = (to, { duration = 1200 } = {}) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    animFromRef.current = speed;
    animToRef.current = to;
    animStartRef.current = performance.now();
    animDurRef.current = duration;

    if (to > 0 && !playing) {
      setPlaying(true);
      viewerRef.current?.play?.();
    }

    const step = (now) => {
      const t = Math.min(1, (now - animStartRef.current) / animDurRef.current);
      const k = easing(t);
      const val =
        animFromRef.current + (animToRef.current - animFromRef.current) * k;
      setSpeed(val);
      viewerRef.current?.setSpeed?.(val);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        if (to === 0) {
          setPlaying(false);
          viewerRef.current?.pause?.();
        } else {
          setPlaying(true);
          viewerRef.current?.play?.();
        }
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(step);
  };

  // keyboard nudge for frames
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') {
        viewerRef.current?.prev?.() ||
          viewerRef.current?.step?.(-1) ||
          viewerRef.current?.nudge?.(-1);
      } else if (e.key === 'ArrowRight') {
        viewerRef.current?.next?.() ||
          viewerRef.current?.step?.(1) ||
          viewerRef.current?.nudge?.(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // scroll to top once
  useEffect(() => {
    (
      document.querySelector('.soundlegend-product-detail') ||
      document.documentElement ||
      document.body
    ).scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // BLOCK wheel/pinch from reaching the viewer (keeps page scroll natural)
  useEffect(() => {
    const el = heroFrameRef.current;
    if (!el) return;

    const stopWheel = (e) => {
      e.stopPropagation();
    }; // do NOT preventDefault
    const stopGesture = (e) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', stopWheel, { capture: true, passive: true });
    el.addEventListener('gesturestart', stopGesture, {
      capture: true,
      passive: true,
    });
    el.addEventListener('gesturechange', stopGesture, {
      capture: true,
      passive: true,
    });
    el.addEventListener('gestureend', stopGesture, {
      capture: true,
      passive: true,
    });

    return () => {
      el.removeEventListener('wheel', stopWheel, { capture: true });
      el.removeEventListener('gesturestart', stopGesture, { capture: true });
      el.removeEventListener('gesturechange', stopGesture, { capture: true });
      el.removeEventListener('gestureend', stopGesture, { capture: true });
    };
  }, []);

  // ---- Zoom helpers
  const setZoomAndResetPan = (z) => {
    setZoom(z);
    // reset pan when zoom changes so user isn't "lost"
    setPanXPct(0);
    setPanYPct(0);
  };

  const nudgePan = (dxPct, dyPct) => {
    const max = getMaxPct(zoom);
    setPanXPct((p) => Math.max(-max, Math.min(max, p + dxPct)));
    setPanYPct((p) => Math.max(-max, Math.min(max, p + dyPct)));
  };

  const stepForZoom = (z) => {
    // arrow click step (as % of element) — tuned to feel right at 2×/3×
    // 2×: max=25%, so 8% step => ~3 clicks to edge; 3×: max≈33%, 8% also feels right
    return 8;
  };

  // helpers
  const handleClose = () => {
    setOpen(false);
    setTimeout(() => navigate('/artisan-shop'), 200);
  };

  const onlyDigits = (s = '') => s.replace(/\D/g, '').slice(0, 10);
  const formatDashed = (d) => {
    if (!d) return '';
    if (d.length >= 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length >= 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return d;
  };
  const isPhoneValid = phoneDigits.length === 10;
  const isEmailFormat = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

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
      return;
    }

    setIsSubmitting(true);
    try {
      const dashed = formatDashed(phoneDigits);
      const submissionData = {
        firstName,
        lastName,
        email,
        phone: `+1 ${dashed}`,
        phoneE164: `+1${phoneDigits}`,
        size,
        depth,
        shellConstruction,
        woodSpecies,
        snareBedDepth,
        consultationDate,
        status: 'New',
        submittedAt: Timestamp.now(),
        source: 'SoundLegend Product Page',
      };
      await addDoc(collection(db, 'soundlegend_submissions'), submissionData);
      await new Promise((r) => setTimeout(r, 700));
      setOpen(true);

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
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Submission failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="soundlegend-product-detail">
      {/* Top Logo */}
      <img
        src="/resized-logos/soundlegend-white.png"
        alt="SOUNDLEGEND Series"
        className="soundlegend-header-image"
      />

      {/* ===== HERO (360 centerpiece) ===== */}
      <section className="sl-hero" aria-label="360° view of SoundLegend snare">
        <div className="sl-hero-media">
          <div className="sl-hero-frame" ref={heroFrameRef}>
            {/* CSS-driven zoom + pan wrapper */}
            <div
              className="sl-zoom-wrap"
              style={{
                '--slZoom': zoom,
                '--slPanX': `${panXPct}%`,
                '--slPanY': `${panYPct}%`,
              }}
              onWheelCapture={(e) => e.stopPropagation()}
            >
              <SoundLegend360Viewer
                ref={viewerRef}
                frameCount={482}
                indexStart={1}
                zeroPad={3}
                className="sl-viewer"
                style={{ width: '100%', height: '100%' }}
                srcPattern={(idx) => `/soundlegend360/med/frame_${idx}.webp`}
                autoRotate={playing}
                autoRotateRps={speed}
                dragSensitivity={3}
                /* If supported, disable built-in wheel zoom:
                   enableWheelZoom={false}
                */
              />
            </div>

            {/* PAN ARROWS (only when zoomed) */}
            {zoom > 1 && (
              <div className="sl-pan-arrows" aria-label="Pan controls">
                <button
                  type="button"
                  className="sl-pan-btn sl-pan-up"
                  onClick={() => nudgePan(0, -stepForZoom(zoom))}
                  aria-label="Pan up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  className="sl-pan-btn sl-pan-down"
                  onClick={() => nudgePan(0, stepForZoom(zoom))}
                  aria-label="Pan down"
                >
                  ▼
                </button>
                <button
                  type="button"
                  className="sl-pan-btn sl-pan-left"
                  onClick={() => nudgePan(-stepForZoom(zoom), 0)}
                  aria-label="Pan left"
                >
                  ◀
                </button>
                <button
                  type="button"
                  className="sl-pan-btn sl-pan-right"
                  onClick={() => nudgePan(stepForZoom(zoom), 0)}
                  aria-label="Pan right"
                >
                  ▶
                </button>
              </div>
            )}
          </div>

          <div
            className="sl-hero-controls"
            aria-label="Auto-play and zoom controls"
          >
            <button
              type="button"
              className="sl-ghost-btn"
              onClick={() =>
                playing || speed > 0
                  ? tweenSpeed(0, { duration: 1000 })
                  : tweenSpeed(CRUISE_RPS, { duration: 1000 })
              }
            >
              {playing || speed > 0 ? 'Pause Auto-Play' : 'Start Auto-Play'}
            </button>

            {/* Zoom presets */}
            <div
              className="sl-zoom-group"
              role="group"
              aria-label="Zoom presets"
            >
              {ZOOMS.map((z) => (
                <button
                  key={z}
                  type="button"
                  className={`sl-zoom-btn ${zoom === z ? 'is-active' : ''}`}
                  onClick={() => setZoomAndResetPan(z)}
                >
                  {z}×
                </button>
              ))}
              <button
                type="button"
                className="sl-zoom-btn"
                onClick={() => setZoomAndResetPan(1)}
              >
                Reset
              </button>
            </div>

            <span className="sl-hero-hint">
              Drag to rotate • Use arrows to pan when zoomed
            </span>
          </div>
        </div>

        <div className="sl-hero-copy">
          <h1 className="sl-title">Build Your Custom SoundLegend Snare</h1>
          <p className="sl-subtitle">
            Your sound is unique—your snare should be too. Collaborate
            one-on-one with
            <strong> Dan Ober</strong> to design a handcrafted instrument that
            reflects your playing and your story.
          </p>

          <ul className="sl-highlights">
            <li>Handcrafted, one-of-one build</li>
            <li>High-res mockup renders</li>
            <li>VIP behind-the-scenes access</li>
            <li>Personal consultation</li>
          </ul>

          <div className="sl-cta-row">
            <a href="#sl-form" className="sl-primary-cta">
              Start Your Custom Snare Journey
            </a>
            {/* <a href="#sl-legacy" className="sl-secondary-cta">
              See Legacy Artists
            </a> */}
          </div>

          <div className="sl-badges">
            <div className="sl-badge">
              <span>Starting at</span>
              <strong>$1,499</strong>
            </div>
            <div className="sl-badge">
              <span>Build slots</span>
              <strong>Limited</strong>
            </div>
            <div className="sl-badge">
              <span>Average Build Time</span>
              <strong>8 to 12 weeks</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Legacy Artists ===== */}
      <section id="sl-legacy" className="sl-legacy">
        <div className="sl-section-head">
          <h2>Featured Legacy Artists</h2>
          <p className="sl-section-kicker">
            Real players. Real stories. Instruments with purpose.
          </p>
        </div>

        <div
          className="sl-carousel"
          role="region"
          aria-label="Featured Legacy Artists"
        >
          <div className="sl-carousel-track">
            {FEATURED_LEGACY.map((a) => (
              <article key={a.id} className="sl-card" tabIndex={0}>
                <div className="sl-card-media">
                  <img src={a.photo} alt={`${a.name} — ${a.role}`} />
                </div>
                <div className="sl-card-body">
                  <h3 className="sl-card-name">{a.name}</h3>
                  <p className="sl-card-role">{a.role}</p>
                  <blockquote className="sl-card-quote">“{a.quote}”</blockquote>
                  <a className="sl-card-link" href={a.link}>
                    View Legacy →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Copy block ===== */}
      <section className="sl-copy">
        <p>
          With concept renderings, VIP access, and a focused design session,
          you’ll see your snare before a single chip is cut. This isn’t a
          catalog pick — it’s a collaboration.
        </p>
        <p>
          <strong>Your Story. Your Sound. Your Legacy.</strong>
        </p>
      </section>

      {/* ===== Features + Lead Form ===== */}
      <section className="sl-stack">
        <div className="sl-features">
          <h2>What You Get</h2>
          <ul>
            <li>Dedicated consult with Dan</li>
            <li>High-res mockup renders</li>
            <li>Progress access & behind-the-scenes</li>
            <li>Custom spec guidance (sizes, woods, hardware)</li>
            <li>Limited edition gift item</li>
            <li>Priority scheduling for approved builds</li>
          </ul>
        </div>

        <div id="sl-form" className="sl-form">
          <div className="customer-header">Start Your Custom Journey</div>
          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="firstName">First Name</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              aria-required="true"
            />

            <label htmlFor="lastName">Last Name</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              aria-required="true"
            />

            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-required="true"
              autoComplete="email"
            />

            <label htmlFor="phone">Phone</label>
            <div className="phone-input-container">
              <input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="123-456-7890"
                value={
                  phoneFocused
                    ? phoneDigits
                    : phoneDigits
                      ? `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`
                      : ''
                }
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
                onChange={(e) => setPhoneDigits(onlyDigits(e.target.value))}
                required
                aria-required="true"
                aria-invalid={phoneDigits ? !isPhoneValid : undefined}
              />
            </div>
            <p className="phone-hint">Enter a valid 10-digit phone number.</p>

            {/* Hidden context fields */}
            <div className="sl-hidden-context" aria-hidden="true">
              <input
                type="hidden"
                value={size}
                onChange={(e) => setSize(e.target.value)}
              />
              <input
                type="hidden"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
              />
              <input
                type="hidden"
                value={shellConstruction}
                onChange={(e) => setShellConstruction(e.target.value)}
              />
              <input
                type="hidden"
                value={woodSpecies}
                onChange={(e) => setWoodSpecies(e.target.value)}
              />
              <input
                type="hidden"
                value={snareBedDepth}
                onChange={(e) => setSnareBedDepth(e.target.value)}
              />
              <input
                type="hidden"
                value={consultationDate}
                onChange={(e) => setConsultationDate(e.target.value)}
              />
            </div>

            <button type="submit" className="sl-submit">
              {isSubmitting ? 'Submitting…' : 'Request Your Consultation'}
            </button>
            <p className="sl-disclaimer">
              No spam. We’ll reach out within 1–2 business days.
            </p>
          </form>

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Request Sent</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Thank you! We’ll reach out within 1–2 business days to schedule
                your consultation.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary">
                Continue
              </Button>
            </DialogActions>
          </Dialog>
        </div>
      </section>
    </div>
  );
};

export default SoundLegendProductDetail;
