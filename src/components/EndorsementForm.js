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

const FIELD_LABELS = {
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  city: 'City',
  state: 'State',
  bands: 'Band(s) / Act(s)',
  website: 'Website (must be a full URL starting with https://)',
  instagram: 'Instagram (@handle or URL)',
  tiktok: 'TikTok (@handle or URL)',
  youtube: 'YouTube (channel or URL)',
  tourSchedule: 'Touring Schedule / Recent Gigs',
  currentGear: 'Gear You Currently Use',
  endorsementGoals: 'Endorsement Goals',
  mediaLinks: 'Media Links (photos, videos, press)',
  whyOber: 'Why Ober Artisan Drums?',
  heardAboutUs: 'How did you hear about us?',
  agree: 'Agreement checkbox',
};

const looksUrlOrHandle = (s) =>
  /^https?:\/\//i.test(s) || /^@?[\w.\-]{2,}$/i.test(s);

const looksUrl = (s) => /^https?:\/\//i.test(String(s || '').trim());

export default function EndorsementForm() {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // CHANGED: error is now an object so we can render bullets
  // { message: string, fields: string[] }
  const [error, setError] = useState(null);

  const [invalid, setInvalid] = useState(new Set());
  const navigate = useNavigate();

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));

    // clear invalid marker on edit
    setInvalid((prev) => {
      if (!prev.has(name)) return prev;
      const next = new Set(prev);
      next.delete(name);
      return next;
    });

    if (error) setError(null);
  };

  const validate = () => {
    const nextInvalid = new Set();

    if (!form.fullName.trim()) nextInvalid.add('fullName');

    const email = form.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextInvalid.add('email');

    const phoneDigits = String(form.phone || '').replace(/[^\d]/g, '');
    if (phoneDigits.length < 10) nextInvalid.add('phone');

    if (!form.city.trim()) nextInvalid.add('city');

    const st = form.state.trim().toUpperCase();
    if (!US_STATES.includes(st)) nextInvalid.add('state');

    if (!form.bands.trim()) nextInvalid.add('bands');

    // Website should be an actual URL (not handle)
    if (!form.website.trim() || !looksUrl(form.website)) nextInvalid.add('website');

    // Socials can be URL or @handle
    if (!form.instagram.trim() || !looksUrlOrHandle(form.instagram)) nextInvalid.add('instagram');
    if (!form.youtube.trim() || !looksUrlOrHandle(form.youtube)) nextInvalid.add('youtube');
    if (!form.tiktok.trim() || !looksUrlOrHandle(form.tiktok)) nextInvalid.add('tiktok');

    if (!form.tourSchedule.trim()) nextInvalid.add('tourSchedule');
    if (!form.currentGear.trim()) nextInvalid.add('currentGear');
    if (!form.endorsementGoals.trim()) nextInvalid.add('endorsementGoals');
    if (!form.mediaLinks.trim()) nextInvalid.add('mediaLinks');
    if (!form.whyOber.trim()) nextInvalid.add('whyOber');
    if (!form.heardAboutUs.trim()) nextInvalid.add('heardAboutUs');

    if (!form.agree) nextInvalid.add('agree');

    if (nextInvalid.size) {
      setInvalid(nextInvalid);

      // Build bullet list labels in a consistent order
      const orderedKeys = Object.keys(FIELD_LABELS);
      const fields = orderedKeys
        .filter((k) => nextInvalid.has(k))
        .map((k) => FIELD_LABELS[k] || k);

      setError({
        message: 'Please correct the following fields before submitting:',
        fields,
      });

      return false;
    }

    setError(null);
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
        updatedAt: serverTimestamp(),
        status: 'new',
        overviewStatus: 'new',
        source: 'website',
        recaptcha: token ? { hasToken: true } : { hasToken: false },
      };

      const docRef = await addDoc(colRef, payload);

      // Success UI
      setSuccessOpen(true);
      setForm(initial);
      setInvalid(new Set());
    } catch (e2) {
      console.error('[endorsement submit] error', e2?.code, e2?.message, e2);
      setError({
        message: e2?.message || 'Something went wrong submitting your application. Please try again.',
        fields: [],
      });
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
                <li>You acknowledge endorsement and tier placement decisions are at Ober’s discretion.</li>
              </ul>
            </div>
          </label>

          {/* CHANGED: render bullet list if we have it */}
          {error && (
            <div className="error error-bottom">
              <div><strong>{error.message || 'Please correct the following:'}</strong></div>
              {Array.isArray(error.fields) && error.fields.length > 0 && (
                <ul className="error-bullets">
                  {error.fields.map((f, idx) => (
                    <li key={`${f}-${idx}`}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
                  navigate('/');
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