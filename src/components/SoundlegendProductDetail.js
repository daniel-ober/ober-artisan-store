import React, { useEffect, useState } from 'react';
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
import {
  collection,
  addDoc,
  Timestamp,
  doc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getRecaptchaToken } from '../utils/loadRecaptchaEnterprise';
import './SoundlegendProductDetail.css';

/* ================= Env ================= */
const RECAPTCHA_SITE_KEY =
  process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY ||
  process.env.REACT_APP_RECAPTCHA_SITE_KEY ||
  '';

/* ================= Helpers ================= */
const onlyDigits = (s = '') => s.replace(/\D/g, '').slice(0, 10);

const formatDashed = (d) => {
  if (!d) return '';
  if (d.length >= 6) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  if (d.length >= 3) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return d;
};

const isEmailFormat = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());

const normalizeEmail = (v = '') => String(v || '').trim().toLowerCase();

const buildQuestionnaireToken = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (err) {
    console.warn('[soundlegend] crypto.randomUUID unavailable:', err);
  }

  return `slq_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
};

const buildQuestionnaireUrl = (token) =>
  `https://www.oberartisandrums.com/soundlegend-questionnaire/${token}`;

const findExistingUserByEmail = async (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const usersRef = collection(db, 'users');

  const q1 = query(usersRef, where('email', '==', normalized));
  const snap1 = await getDocs(q1);
  if (!snap1.empty) {
    const d = snap1.docs[0];
    return { id: d.id, ...d.data() };
  }

  const q2 = query(usersRef, where('email', '==', email));
  const snap2 = await getDocs(q2);
  if (!snap2.empty) {
    const d = snap2.docs[0];
    return { id: d.id, ...d.data() };
  }

  return null;
};

const upsertLeadUser = async ({
  firstName,
  lastName,
  email,
  phoneDigits,
  questionnaireToken,
  questionnaireUrl,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const fullName = `${firstName} ${lastName}`.trim();
  const phonePretty = phoneDigits ? `+1 ${formatDashed(phoneDigits)}` : '';
  const phoneE164 = phoneDigits ? `+1${phoneDigits}` : '';

  const existing = await findExistingUserByEmail(normalizedEmail);

  const basePayload = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    fullName,
    email: normalizedEmail,
    phone: phonePretty || '',
    phoneE164: phoneE164 || '',
    isSoundlegend: true,
    isAdmin: false,

    soundlegendLead: true,
    soundlegendLeadStatus: 'questionnaire_pending',
    slPortalLocked: true,
    portalAccessGranted: false,
    portalInviteSent: false,

    latestQuestionnaireToken: questionnaireToken,
    latestQuestionnaireUrl: questionnaireUrl,
    questionnaireCompleted: false,
    consultationScheduled: false,
    consultationCompleted: false,

    updatedAt: serverTimestamp(),
  };

  if (existing?.id) {
    const userRef = doc(db, 'users', existing.id);
    await updateDoc(userRef, basePayload);
    return existing.id;
  }

  const newRef = doc(collection(db, 'users'));
  await setDoc(newRef, {
    ...basePayload,
    createdAt: serverTimestamp(),
    status: 'lead',
    projects: [],
    orderIds: [],
    uid: '',
  });

  return newRef.id;
};

const LazyImg = (props) => <img loading="lazy" decoding="async" {...props} />;

const InlineIcon = ({ children }) => (
  <span className="tb-icon" aria-hidden="true">
    {children}
  </span>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l2.4 4.86L20 8.7l-4 3.9.94 5.52L12 15.8l-4.94 2.62L8 12.6 4 8.7l5.6-.84L12 3z" />
  </svg>
);

const HeadphoneIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 13a8 8 0 0 1 16 0" />
    <rect x="3" y="12" width="4" height="7" rx="2" />
    <rect x="17" y="12" width="4" height="7" rx="2" />
    <path d="M7 19a5 5 0 0 0 10 0" />
  </svg>
);

const CardIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
    <path d="M6.5 15h4" />
  </svg>
);

const SoundLegendProductDetail = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [size] = useState('14');
  const [depth] = useState('6.5');
  const [shellConstruction] = useState('Stave');
  const [woodSpecies] = useState('Maple');
  const [snareBedDepth] = useState('Medium');
  const [consultationDate] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const el =
      document.querySelector('.soundlegend-product-detail') ||
      document.documentElement;
    el.scrollTo({ top: 0, behavior: 'auto' });
  }, [location]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => navigate('/artisan-shop'), 200);
  };

  const validate = () => {
    const missing = [];
    if (!firstName.trim()) missing.push('First Name');
    if (!lastName.trim()) missing.push('Last Name');
    if (!email.trim()) missing.push('Email');
    if (!phoneDigits.trim()) missing.push('Phone');

    const issues = [];
    if (email && !isEmailFormat(email)) issues.push('Valid Email');
    if (!phoneDigits || phoneDigits.length !== 10) {
      issues.push('Valid 10-digit Phone');
    }

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
      let recaptchaToken = '';
      if (RECAPTCHA_SITE_KEY) {
        try {
          recaptchaToken = await getRecaptchaToken(
            RECAPTCHA_SITE_KEY,
            'soundlegend_interest'
          );
        } catch (tokErr) {
          console.warn('[soundlegend] recaptcha token unavailable:', tokErr);
        }
      }

      const normalizedEmail = normalizeEmail(email);
      const questionnaireToken = buildQuestionnaireToken();
      const questionnaireUrl = buildQuestionnaireUrl(questionnaireToken);

      let userId = '';

      try {
        userId = await upsertLeadUser({
          firstName,
          lastName,
          email: normalizedEmail,
          phoneDigits,
          questionnaireToken,
          questionnaireUrl,
        });
      } catch (userErr) {
        console.error(
          '[soundlegend] lead user mirror failed, continuing submission:',
          userErr
        );
      }

      const dashed = phoneDigits ? formatDashed(phoneDigits) : '';
      const phonePretty = phoneDigits ? `+1 ${dashed}` : '';
      const phoneE164 = phoneDigits ? `+1${phoneDigits}` : '';

      await addDoc(collection(db, 'soundlegend_submissions'), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        fullName: `${firstName} ${lastName}`.trim(),
        email: normalizedEmail,
        phone: phonePretty || '',
        phoneE164: phoneE164 || '',
        size,
        depth,
        shellConstruction,
        woodSpecies,
        snareBedDepth,
        consultationDate,

        status: 'Questionnaire Pending',
        stage: 'lead_capture',
        submissionType: 'soundlegend_interest',

        questionnaireToken,
        questionnaireUrl,
        questionnaireCompleted: false,
        consultationScheduled: false,
        consultationCompleted: false,
        portalInviteSent: false,
        portalAccessGranted: false,

        linkedUserId: userId || '',
        recaptchaToken,
        submittedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      });

      await new Promise((r) => setTimeout(r, 250));

      setOpen(true);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhoneDigits('');
    } catch (err) {
      console.error('[soundlegend] submission failed:', err);
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
        decoding="async"
        fetchpriority="high"
      />

      <div className="sl-hero-grid">
        <div className="sl-hero-media">
          <div className="sl-hero-frame">
            <LazyImg
              src="https://firebasestorage.googleapis.com/v0/b/danoberartisandrums.appspot.com/o/soundlegend_showroom%2FSL-001%2Fgallery%2F0-IMG_1803.jpg?alt=media&token=f84c86d4-f111-4156-87c7-3b5e5992df28"
              alt="SoundLegend Snare hero"
              className="soundlegend-hero-img"
              width={1600}
              height={1200}
              fetchpriority="low"
            />
          </div>

          <section className="sl-trustband" aria-label="Assurances">
            <div className="tb-item">
              <InlineIcon>🇺🇸</InlineIcon>
              <span className="tb-text">Handcrafted in Nashville, TN</span>
            </div>

            <div className="tb-item">
              <InlineIcon>
                <StarIcon />
              </InlineIcon>
              <span className="tb-text">Artist-first, boutique service</span>
            </div>

            <div className="tb-item">
              <InlineIcon>
                <HeadphoneIcon />
              </InlineIcon>
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
              <InlineIcon>
                <CardIcon />
              </InlineIcon>
              <span className="tb-text">
                Flexible payment options available
              </span>
            </div>
          </section>
        </div>

        <aside className="sl-card sl-form-only">
          <div className="sl-card-section">
            <h2 className="sl-card-title">Start Your Journey</h2>
            <p className="sl-form-sub">
              Tell us where to reach you. We’ll email your private questionnaire
              so you can begin the SoundLegend experience.
            </p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="sl-form-grid">
                <div className="sl-field">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="sl-field">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    aria-required="true"
                  />
                </div>

                <div className="sl-field sl-field--full">
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
                </div>

                <div className="sl-field sl-field--full">
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
                      aria-invalid={
                        phoneDigits ? !(phoneDigits.length === 10) : undefined
                      }
                      required
                      aria-required="true"
                    />
                  </div>
                  <p className="field-note">
                    We’ll use this to coordinate your consultation scheduling.
                  </p>
                </div>
              </div>

              <button type="submit" className="sl-cta" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting…' : 'Start Your Custom Snare Journey'}
              </button>
            </form>
          </div>
        </aside>
      </div>

      <div className="sl-copy-lower-wrap">
        <div className="sl-hero-copy sl-hero-copy--lower">
          <div className="sl-eyebrow">Custom-built. Artist-led. One-on-one.</div>

          <h1 className="sl-title">Build Your Custom SoundLegend Snare</h1>

          <p className="sl-lede">
            Your sound is unique, and your snare should be too. The
            <strong> SoundLegend Series</strong> is a fully custom,
            handcrafted instrument built around your playing style, sonic goals,
            and artistic identity.
          </p>

          <p>
            In direct collaboration with <strong>Dan Ober</strong>, you will
            shape a snare that feels personal, inspiring, and unmistakably yours.
          </p>

          <p>
            Every build begins with a focused intake and a free consultation,
            then moves into concept development, proposal, and custom build
            direction.
          </p>

          <div className="sl-keyfeatures">
            <h3>What’s Included</h3>
            <ul>
              <li>Direct collaboration with Dan Ober</li>
              <li>Private pre-build questionnaire and consultation</li>
              <li>High-resolution design mockups</li>
              <li>Priority SoundLegend Portal access during active builds</li>
              <li>Legacy Vault artist page opportunity</li>
              <li>Builds starting at $1,499</li>
            </ul>
          </div>

          <p className="sl-closer">Your story. Your sound. Your legacy.</p>
        </div>
      </div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Check Your Email</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1.5 }}>
            Thanks for reaching out. Your SoundLegend inquiry has been received.
          </Typography>
          <Typography variant="body1" sx={{ mb: 1.5 }}>
            We’ve sent your private questionnaire link to your email address.
            Once your questionnaire is complete, our craftsman will personally
            review it and reach out within 2 business days by email to schedule
            your FREE consultation.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Full SoundLegend Portal access is reserved for clients who move into
            the custom build process. In some cases, early preview access may be
            extended during the consultation phase.
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