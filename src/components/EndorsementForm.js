// src/components/EndorsementForm.js
import React, { useState } from 'react';
import { db, app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getRecaptchaToken } from '../utils/loadRecaptchaEnterprise';
import './EndorsementForm.css';

const RECAPTCHA_SITE_KEY =
  process.env.REACT_APP_RECAPTCHA_ENTERPRISE_SITE_KEY ||
  process.env.REACT_APP_RECAPTCHA_SITE_KEY ||
  '';

const COUNTRY_US = 'US';
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const initial = {
  fullName: '',
  stageName: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  bands: '',
  website: '',
  instagram: '',
  youtube: '',
  tiktok: '',
  tourSchedule: '',
  currentGear: '',
  endorsementGoals: '',
  mediaLinks: '',
  whyOber: '',
  heardAboutUs: '',
  agree: false,
};

const looksUrlOrHandle = (s) =>
  /^https?:\/\//i.test(s) || /^@?[\w.\-]{2,}$/i.test(s);

export default function EndorsementForm() {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(new Set());
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setInvalid((prev) => {
      if (!prev.has(name)) return prev;
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
    if (error) setError('');
  };

  const validate = () => {
    const nextInvalid = new Set();

    if (!form.fullName.trim()) nextInvalid.add('fullName');
    const email = form.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      nextInvalid.add('email');

    const phoneDigits = form.phone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 10) nextInvalid.add('phone');

    if (!form.city.trim()) nextInvalid.add('city');
    const st = form.state.trim().toUpperCase();
    if (!US_STATES.includes(st)) nextInvalid.add('state');

    if (!form.bands.trim()) nextInvalid.add('bands');
    if (!form.website.trim() || !looksUrlOrHandle(form.website))
      nextInvalid.add('website');
    if (!form.instagram.trim() || !looksUrlOrHandle(form.instagram))
      nextInvalid.add('instagram');
    if (!form.youtube.trim() || !looksUrlOrHandle(form.youtube))
      nextInvalid.add('youtube');
    if (!form.tiktok.trim() || !looksUrlOrHandle(form.tiktok))
      nextInvalid.add('tiktok');

    if (!form.tourSchedule.trim()) nextInvalid.add('tourSchedule');
    if (!form.currentGear.trim()) nextInvalid.add('currentGear');
    if (!form.endorsementGoals.trim()) nextInvalid.add('endorsementGoals');
    if (!form.mediaLinks.trim()) nextInvalid.add('mediaLinks');
    if (!form.whyOber.trim()) nextInvalid.add('whyOber');
    if (!form.heardAboutUs.trim()) nextInvalid.add('heardAboutUs');

    if (!form.agree) nextInvalid.add('agree');

    if (nextInvalid.size) {
      setInvalid(nextInvalid);
      setError('Please complete all required fields correctly before submitting.');
      return false;
    }

    setError('');
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // reCAPTCHA Enterprise token (best-effort)
      let token = '';
      if (RECAPTCHA_SITE_KEY) {
        try {
          token = await getRecaptchaToken(RECAPTCHA_SITE_KEY, 'endorsement_form');
        } catch (recaptchaErr) {
          console.warn('[endorsement] reCAPTCHA token unavailable:', recaptchaErr);
        }
      }

      // 1) Create Firestore doc
      const colRef = collection(db, 'endorsement_applications');
      const payload = {
        ...form,
        country: COUNTRY_US,
        state: form.state.toUpperCase(),
        createdAt: serverTimestamp(),
        status: 'new',
        source: 'website',
        recaptchaToken: token,
      };
      const docRef = await addDoc(colRef, payload);

      // 2) Auto-reply email
      try {
        const functions = getFunctions(app, 'us-central1');
        const sendAutoReply = httpsCallable(functions, 'sendEndorsementAutoReply');
        await sendAutoReply({
          docId: docRef.id,
          toEmail: form.email,
          fullName: form.fullName,
          stageName: form.stageName,
        });
      } catch (mailErr) {
        console.warn('[endorsement] email send failed:', mailErr?.code, mailErr?.message || mailErr);
      }

      // Success UI
      setSuccessOpen(true);
      setForm(initial);
      setInvalid(new Set());
    } catch (e2) {
      console.error('[endorsement submit] error', e2?.code, e2?.message, e2);
      setError(e2?.message || 'Something went wrong submitting your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const markInvalid = (name) => (invalid.has(name) ? 'invalid' : '');

  return (
    <div className="endorsement-form-wrapper">
      <form onSubmit={onSubmit} className="endorsement-form">
        <h3>Artist Endorsement Application</h3>
        <p className="form-subcopy">
          <strong>Currently accepting U.S.-based artists only.</strong> We’re
          honored you want to represent the Ober brand. Please complete the form
          below—our team will review and follow up via email.
        </p>

        <div className="notice">
          <strong>Tier placement is determined by our team after review.</strong> We consider:
          <ul>
            <li>Touring activity and performance footprint</li>
            <li>Audience reach &amp; engagement (social/streaming)</li>
            <li>Consistency and quality of creative output</li>
            <li>Credits, discography, collaborations</li>
            <li>Press, industry support, and community impact</li>
            <li>Brand alignment, professionalism, reliability</li>
          </ul>
        </div>

        {/* --- Fields --- */}
        <div className="grid-2">
          <label className={markInvalid('fullName')}>
            Full Name
            <input
              name="fullName"
              value={form.fullName}
              onChange={onChange}
              required
              aria-invalid={invalid.has('fullName')}
              className={markInvalid('fullName')}
              placeholder="Your legal name"
            />
          </label>
          <label>
            Stage Name <span className="optional">(optional)</span>
            <input
              name="stageName"
              value={form.stageName}
              onChange={onChange}
              placeholder="If different from your full name"
            />
          </label>
        </div>

        <div className="grid-2">
          <label className={markInvalid('email')}>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
              aria-invalid={invalid.has('email')}
              className={markInvalid('email')}
              placeholder="you@example.com"
            />
          </label>
          <label className={markInvalid('phone')}>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={onChange}
              className={markInvalid('phone')}
              placeholder="(###) ###-####"
            />
          </label>
        </div>

        <div className="grid-2">
          <label className={markInvalid('city')}>
            City
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              className={markInvalid('city')}
              placeholder="City (U.S. only)"
            />
          </label>
          <label className={markInvalid('state')}>
            State
            <select
              name="state"
              value={form.state}
              onChange={onChange}
              className={markInvalid('state')}
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid-2">
          <label className={markInvalid('bands')}>
            Band(s) / Act(s)
            <input
              name="bands"
              value={form.bands}
              onChange={onChange}
              className={markInvalid('bands')}
              placeholder="Solo, band name(s), MD work, etc."
            />
          </label>
          <label className={markInvalid('website')}>
            Website
            <input
              name="website"
              value={form.website}
              onChange={onChange}
              className={markInvalid('website')}
              placeholder="https://"
            />
          </label>
        </div>

        <div className="grid-3">
          <label className={markInvalid('instagram')}>
            Instagram
            <input
              name="instagram"
              value={form.instagram}
              onChange={onChange}
              className={markInvalid('instagram')}
              placeholder="@handle or URL"
            />
          </label>
          <label className={markInvalid('tiktok')}>
            TikTok
            <input
              name="tiktok"
              value={form.tiktok}
              onChange={onChange}
              className={markInvalid('tiktok')}
              placeholder="@handle or URL"
            />
          </label>
          <label className={markInvalid('youtube')}>
            YouTube
            <input
              name="youtube"
              value={form.youtube}
              onChange={onChange}
              className={markInvalid('youtube')}
              placeholder="Channel or URL"
            />
          </label>
        </div>

        <label className={markInvalid('tourSchedule')}>
          Touring Schedule / Recent Gigs
          <textarea
            name="tourSchedule"
            value={form.tourSchedule}
            onChange={onChange}
            rows={3}
            className={markInvalid('tourSchedule')}
            placeholder="Highlights, support slots, residencies, festivals…"
          />
        </label>

        <label className={markInvalid('currentGear')}>
          Gear You Currently Use
          <textarea
            name="currentGear"
            value={form.currentGear}
            onChange={onChange}
            rows={3}
            className={markInvalid('currentGear')}
            placeholder="Core kit, snares, cymbals, hardware, electronics, etc."
          />
        </label>

        <label className={markInvalid('endorsementGoals')}>
          Endorsement Goals (what are you looking for?)
          <textarea
            name="endorsementGoals"
            value={form.endorsementGoals}
            onChange={onChange}
            rows={3}
            className={markInvalid('endorsementGoals')}
          />
        </label>

        <label className={markInvalid('mediaLinks')}>
          Media Links (photos, videos, press) — comma separated
          <textarea
            name="mediaLinks"
            value={form.mediaLinks}
            onChange={onChange}
            rows={2}
            className={markInvalid('mediaLinks')}
          />
        </label>

        <label className={markInvalid('whyOber')}>
          Why Ober Artisan Drums?
          <textarea
            name="whyOber"
            value={form.whyOber}
            onChange={onChange}
            rows={3}
            className={markInvalid('whyOber')}
          />
        </label>

        <label className={markInvalid('heardAboutUs')}>
          How did you hear about us?
          <input
            name="heardAboutUs"
            value={form.heardAboutUs}
            onChange={onChange}
            className={markInvalid('heardAboutUs')}
          />
        </label>

        {/* Agreement + CTA */}
        <div className="form-footer-block">
          <label className={`agree ${markInvalid('agree')}`}>
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={onChange}
              aria-invalid={invalid.has('agree')}
            />
            <div className="agree-text">
              <p><strong>By checking this box, you agree to the following:</strong></p>
              <ul>
                <li>You will represent the Ober Artisan Drums brand professionally and respectfully.</li>
                <li>You understand Ober supports full creative freedom and does not require exclusivity.</li>
                <li>You acknowledge that all endorsement placements, as well as tier placements, are determined by the Ober team and are at our discretion.</li>
              </ul>
            </div>
          </label>

          {error && <div className="error error-bottom">{error}</div>}

          <button className="submit" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>

        {successOpen && (
          <div className="modal">
            <div className="modal-card">
              <h4>Thanks for your interest!</h4>
              <p>
                Your application has been received. Please check your email for a confirmation note
                outlining next steps. Our typical review turnaround is <strong>5–10 business days</strong>.
              </p>
              <button
                onClick={() => {
                  setSuccessOpen(false);
                  navigate('/'); // redirect to homepage
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}