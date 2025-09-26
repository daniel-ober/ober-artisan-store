import React, { useEffect, useState, useRef } from 'react';
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

/* ================= Inline Icons (no external deps) ================= */
const Icon = ({ name, size = 22 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
  switch (name) {
    case 'phone':
      return (
        <svg {...common}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2c-3.19-.35-6.18-1.86-8.47-4.15S7 12.37 6.64 9.18A2 2 0 0 1 8.63 7h3a1 1 0 0 1 1 .76l.57 2.3a1 1 0 0 1-.29.98l-1.27 1.27a12 12 0 0 0 4.15 4.15l1.27-1.27a1 1 0 0 1 .98-.29l2.3.57a1 1 0 0 1 .76 1z" />
        </svg>
      );
    case 'pen':
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
      );
    case 'music':
      return (
        <svg {...common}>
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );
    case 'mockup':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M3 15l5-5 4 4 3-3 6 6" />
        </svg>
      );
    case 'portal':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M2 12a10 6 0 0 1 20 0" />
          <path d="M2 12a10 6 0 0 0 20 0" />
        </svg>
      );
    case 'vault':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M8 10h8" />
          <circle cx="16" cy="13" r="2" />
        </svg>
      );
    case 'box':
      return (
        <svg {...common}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73L13 2.27a2 2 0 0 0-2 0L4 6.27A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="M3.3 7L12 12l8.7-5M12 22V12" />
        </svg>
      );
    case 'award': // premium bullet
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M15 11l2 9-5-3-5 3 2-9" />
        </svg>
      );
    case 'crown': // artist-first service
      return (
        <svg {...common}>
          <path d="M3 8l4 3 5-7 5 7 4-3v9H3z" />
        </svg>
      );
    case 'wallet': // flexible payments (trust blurb)
      return (
        <svg {...common}>
          <path d="M3 7h18a2 2 0 0 1 2 2v9H1V9a2 2 0 0 1 2-2z" />
          <path d="M3 7V5a2 2 0 0 1 2-2h11" />
          <circle cx="17" cy="13" r="1.5" />
        </svg>
      );
    default:
      return null;
  }
};

/* ================= Steps data (consolidated Build Proposal + Payment) ================= */
const steps = [
  {
    id: 1,
    key: 'phone',
    title: 'Consultation',
    blurb:
      'A relaxed one-on-one with Dan to understand your music, touch, and the exact voice you want this snare to have.',
    bullets: [
      'Goals, genres, feel, and tuning preferences',
      'References you love: records, players, tones',
      'Sensitivity, rimshot feel, ergonomics',
    ],
  },
  {
    id: 2,
    key: 'pen',
    title: 'Build Proposal',
    blurb:
      'We align on every detail in a clear, sign-off ready proposal—then checkout happens securely when you’re ready.',
    bullets: [
      'Size, shell construction, bearing edges, beds',
      'Lugs, hoops, throw-off, hardware finish',
      'Finish direction and badge treatment',
      'Secure Stripe checkout with optional Klarna installments',
    ],
    signwell: true,
    vendors: {
      signwell: {
        img: '/logos/signwell-logo.svg',
        alt: 'SignWell',
        label: 'Secure e-signing',
      },
      stripe: {
        img: '/logos/stripe-logo.png',
        alt: 'Stripe',
        label: 'Secure checkout',
      },
      klarna: {
        img: '/logos/klarna-logo.png',
        alt: 'Klarna',
        label: 'Buy now, pay later',
      },
    },
    note: 'Shop securely and choose to pay in full, 4 interest-free payments, in 30 days, or over time. Klarna availability and terms depend on your credit profile and location; approval is not guaranteed.',
  },
  {
    id: 3,
    key: 'music',
    title: 'Tone-Matched Wood',
    blurb:
      'Wood is hand-selected for grain, density, and character that will actually sing for you.',
    bullets: [
      'Curate boards, veneers, or exotic selects that “speak” to your legacy',
      'Match stiffness/weight to your desired voice',
      'Photographed + documented material selection',
    ],
  },
  {
    id: 4,
    key: 'mockup',
    title: 'Early Mockups',
    blurb:
      'High-resolution mockups using the <b>actual wood</b> chosen for your shell—see it before we shape it.',
    bullets: [
      'Raw-shell visuals with accurate grain',
      'Finish previews and layout options',
      'Iterate quickly before we commit',
    ],
    mockImages: [
      '/mockups/bubinga_waterfall.a.jpg',
      '/mockups/bubinga_waterfall.b.png',
      '/mockups/mappa-burl-ressner.jpeg',
      '/mockups/mappa_burl_gensler.png',
      '/mockups/mappa_burl_lopez_a.jpeg',
      '/mockups/mockup1.png',
      '/mockups/mappa-burl-blue-sheet.png',
    ],
  },
  {
    id: 5,
    key: 'portal',
    title: 'SoundLegend Portal',
    blurb:
      'Follow progress in a private portal—updates, photos, notes, and milestones as your snare comes to life.',
    bullets: [
      'Mobile-friendly build timeline',
      'Behind-the-scenes media drops',
      'Direct line to Dan throughout the build',
    ],
    portalSignin: '/soundlegends/signin',
  },
  {
    id: 6,
    key: 'vault',
    title: 'Legacy Vault',
    blurb:
      'Your finished instrument gets its own page—artist story, specs, gallery, and sound samples—your legacy, preserved.',
    bullets: [
      'Permanent page with photos, specs, and audio',
      'Artist story and provenance recorded',
      'Legacy Tuning™ notes + timeline highlights',
      'One link you can share anywhere',
    ],
    cta: { label: 'Explore the Vault', to: '/artisan-shop/soundlegend/vault' },
  },
  {
    id: 7,
    key: 'box',
    title: 'Ship — Tuned for Legacy',
    blurb:
      'Your snare leaves the bench dialed to its most natural voice—ready to record, inspire, and stand the test of time.',
    bullets: [
      'Final fine-voicing and torch-tune',
      'Heads installed, seated, and ready to play',
      'Packed with care and insured shipment',
      'SoundLegend gift item',
      'Resonance Analysis mini-report',
    ],
  },
];

const SoundLegendProductDetail = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // schema continuity
  const [size] = useState('14');
  const [depth] = useState('6.5');
  const [shellConstruction] = useState('Stave');
  const [woodSpecies] = useState('Maple');
  const [snareBedDepth] = useState('Medium');
  const [consultationDate] = useState('');

  const [activeStep, setActiveStep] = useState(0);
  const railRef = useRef(null);

  // mockup modal
  const [mockOpen, setMockOpen] = useState(false);
  const [mockIdx, setMockIdx] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const el =
      document.querySelector('.soundlegend-product-detail') ||
      document.documentElement;
    el.scrollTo({ top: 0, behavior: 'auto' });
  }, [location]);

  // keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight')
        setActiveStep((s) => Math.min(s + 1, steps.length - 1));
      if (e.key === 'ArrowLeft') setActiveStep((s) => Math.max(s - 1, 0));
      if (e.key === 'Escape') setMockOpen(false);
      if (mockOpen && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const imgs = steps[activeStep].mockImages || [];
        if (!imgs.length) return;
        setMockIdx((i) => {
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const n = imgs.length;
          return (i + dir + n) % n;
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStep, mockOpen]);

  // keep active node centered when scrolling (mobile/smaller web)
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const node = rail.querySelector(`[data-step="${activeStep}"]`);
    if (!node) return;
    const railRect = rail.getBoundingClientRect();
    const nodeRect = node.getBoundingClientRect();
    const delta =
      nodeRect.left - (railRect.left + railRect.width / 2 - nodeRect.width / 2);
    rail.scrollBy({ left: delta, behavior: 'smooth' });
  }, [activeStep]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => navigate('/artisan-shop'), 200);
  };

  // helpers
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
      const phonePretty = `+1 ${dashed}`;
      const phoneE164 = `+1${phoneDigits}`;
      await addDoc(collection(db, 'soundlegend_submissions'), {
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
      });
      await new Promise((r) => setTimeout(r, 500));
      setOpen(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneDigits('');
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Submission failed. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMock = (i) => {
    setMockIdx(i);
    setMockOpen(true);
  };
  const nextMock = (dir) => {
    const imgs = steps[activeStep].mockImages || [];
    if (!imgs.length) return;
    setMockIdx((idx) => (idx + dir + imgs.length) % imgs.length);
  };

  return (
    <div className="soundlegend-product-detail">
      {/* Brand */}
      <img
        src="/resized-logos/soundlegend-white.png"
        alt="SOUNDLEGEND Series"
        className="soundlegend-header-image"
      />

      {/* HERO */}
      <div className="sl-hero-grid">
        <div className="sl-hero-media">
          <div className="sl-hero-frame">
            <img
              src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/soundlegend_showroom%2FSL-001%2Fgallery%2F0-IMG_1803.jpg?alt=media&token=f84c86d4-f111-4156-87c7-3b5e5992df28"
              alt="SoundLegend Snare — hero"
              className="soundlegend-hero-img"
            />
          </div>

          {/* === TRUST BAND (desktop under image; mobile collapses) === */}
          <section className="sl-trustband" aria-label="Assurances">
            <div className="tb-item">
              <span className="tb-icon">🇺🇸</span>
              <span className="tb-text">Handcrafted in Nashville, TN</span>
            </div>
            <div className="tb-item">
              <span className="tb-icon">
                <Icon name="crown" size={22} />
              </span>
              <span className="tb-text">Artist-first, boutique service</span>
            </div>
            <div className="tb-item">
              <span className="tb-icon">🎧</span>
              <span className="tb-text">
                Legacy Tuning™ voicing
                <span
                  className="sl-info"
                  title="A final tuning pass to reveal the drum’s most natural, resonant voice—balanced for response, feel, and overtones."
                >
                  i
                </span>
              </span>
            </div>
            <div className="tb-item">
              <span className="tb-icon">
                <Icon name="wallet" size={20} />
              </span>
              <span className="tb-text">
                Flexible payment options available
              </span>
            </div>
          </section>
        </div>

        <div className="sl-hero-copy">
          <h1 className="sl-title">Build Your Custom SoundLegend Snare</h1>
          <p className="sl-lede">
            Your sound is unique—your snare should be too. The
            <strong> SoundLegend Series</strong> is a fully custom, handcrafted
            instrument that brings your artistic vision to life.
          </p>
          <p>
            In a one-on-one collaboration with <strong>Dan Ober</strong>, you’ll
            design a snare that reflects your playing style and sonic identity.
          </p>
          <p>
            With high-resolution concept renders, VIP progress access, and a
            personal consultation, you’ll see your dream snare long before the
            final polish.
          </p>

          <div className="sl-keyfeatures">
            <h3>What’s Included</h3>
            <ul>
              <li>Direct collaboration with Dan Ober</li>
              <li>High-resolution design mockups</li>
              <li>Private SoundLegend Portal access</li>
              <li>Legacy Vault artist page</li>
              <li>Limited-edition gift item</li>
              <li>Builds starting at $1,499</li>
            </ul>
          </div>

          <p className="sl-closer">Your story. Your sound. Your legacy.</p>
        </div>
      </div>

      {/* ===== JOURNEY ===== */}
      <section className="sl-journey" aria-label="SoundLegend Experience">
        <h2 className="sl-exp-title">Your SoundLegend Experience</h2>

        {/* Rail */}
        <div className="sl-rail-wrap" ref={railRef}>
          <div
            className="sl-rail"
            role="tablist"
            aria-label="Experience steps"
            style={{ '--stepcount': steps.length }}
          >
            {steps.map((s, i) => (
              <button
                key={s.id}
                className={`sl-node ${i === activeStep ? 'active' : ''}`}
                data-step={i}
                role="tab"
                aria-selected={i === activeStep}
                aria-controls={`panel-step-${i}`}
                onClick={() => setActiveStep(i)}
              >
                <span className="sl-node-badge">
                  <Icon name={s.key} size={18} />
                </span>
                <span className="sl-node-caption">
                  <b>{i + 1}.</b> {s.title}
                </span>
              </button>
            ))}
            <div
              className="sl-rail-active"
              style={{ '--i': activeStep, '--n': steps.length }}
              aria-hidden="true"
            />
          </div>

          {/* Centered hint (fixed inside wrapper; hidden on large screens) */}
          <div className="sl-rail-hint">Swipe to explore →</div>
        </div>

        {/* Panel */}
        <div
          id={`panel-step-${activeStep}`}
          className="sl-journey-panel"
          role="tabpanel"
          aria-live="polite"
        >
          <div className="sl-panel-header">
            <span className="sl-step-kicker">
              Step {activeStep + 1} of {steps.length}
            </span>
            <h3 className="sl-panel-title">
              <span className="sl-panel-icon">
                <Icon name={steps[activeStep].key} size={22} />
              </span>
              {steps[activeStep].title}
            </h3>
          </div>

          <p
            className="sl-panel-text"
            dangerouslySetInnerHTML={{ __html: steps[activeStep].blurb }}
          />

          <ul className="sl-panel-bullets">
            {steps[activeStep].bullets.map((b, idx) => (
              <li key={idx}>
                <span className="bullet-award">
                  <Icon name="award" size={13} />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* Mockups AFTER bullets with helper copy */}
          {steps[activeStep].mockImages && (
            <>
              <p className="sl-mockup-hint">Tap an image to enlarge</p>
              <div className="mockup-strip">
                {steps[activeStep].mockImages.map((src, i) => (
                  <button
                    key={i}
                    className="mockup-thumb"
                    onClick={() => openMock(i)}
                    aria-label={`Open mockup ${i + 1}`}
                  >
                    <img src={src} alt={`Mockup ${i + 1}`} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Payment/approval note */}
          {steps[activeStep].note && (
            <p className="sl-note">* {steps[activeStep].note}</p>
          )}

          {/* Footer badges row (order: SignWell, Stripe, Klarna) */}
          {steps[activeStep].vendors && (
            <div className="sl-badges-row">
              {steps[activeStep].vendors.signwell && (
                <span className="sl-badge sl-badge-vendor">
                  <img
                    src={steps[activeStep].vendors.signwell.img}
                    alt={steps[activeStep].vendors.signwell.alt}
                    height="16"
                  />
                  <span>{steps[activeStep].vendors.signwell.label}</span>
                </span>
              )}
              {steps[activeStep].vendors.stripe && (
                <span className="sl-badge sl-badge-vendor">
                  <img
                    src={steps[activeStep].vendors.stripe.img}
                    alt={steps[activeStep].vendors.stripe.alt}
                    height="16"
                  />
                  <span>{steps[activeStep].vendors.stripe.label}</span>
                </span>
              )}
              {steps[activeStep].vendors.klarna && (
                <span className="sl-badge sl-badge-vendor">
                  <img
                    src={steps[activeStep].vendors.klarna.img}
                    alt={steps[activeStep].vendors.klarna.alt}
                    height="16"
                  />
                  <span>{steps[activeStep].vendors.klarna.label}</span>
                </span>
              )}
            </div>
          )}

          {/* Portal sign-in link */}
          {steps[activeStep].portalSignin && (
            <Link to={steps[activeStep].portalSignin} className="sl-panel-link">
              Go to SoundLegend Portal Sign-in →
            </Link>
          )}

          {/* Vault CTA footer */}
          {steps[activeStep].key === 'vault' && (
            <div className="sl-vault-cta">
              <span className="sl-vault-text">Explore the</span>
              <Link
                to={steps[activeStep].cta.to}
                className="sl-vault-logo-link"
                aria-label="Explore the Legacy Vault"
              >
                <img src="/legacy-vault-nav/white2.png" alt="Legacy Vault" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Mockup lightbox modal with arrow-only nav + X close */}
      {mockOpen && (
        <div
          className="mockup-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setMockOpen(false)}
        >
          <button
            className="mockup-close"
            onClick={() => setMockOpen(false)}
            aria-label="Close"
          >
            ×
          </button>
          <button
            className="mockup-arrow left"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              nextMock(-1);
            }}
          >
            ‹
          </button>
          <img
            src={(steps[activeStep].mockImages || [])[mockIdx]}
            alt={`Mockup ${mockIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="mockup-arrow right"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              nextMock(1);
            }}
          >
            ›
          </button>
        </div>
      )}

      {/* ===== Start Your Journey (Form only) ===== */}
      <aside className="sl-card sl-form-only">
        <div className="sl-card-section">
          <h2 className="sl-card-title">Start Your Journey</h2>
          <p className="sl-form-sub">
            Tell us where to reach you. We’ll follow up personally within 1–2
            business days.
          </p>
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
            <p className="field-note">
              We never share or sell your email. No spam—ever.
            </p>

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
            <p className="field-note">
              We will only use your number for your build process.
            </p>

            <button type="submit" className="sl-cta">
              {isSubmitting ? 'Submitting…' : 'Start Your Custom Snare Journey'}
            </button>
          </form>
        </div>
      </aside>

      {/* Success dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Request Sent</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Thank you for reaching out! We’ll get back to you within 1–2
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
  );
};

export default SoundLegendProductDetail;
