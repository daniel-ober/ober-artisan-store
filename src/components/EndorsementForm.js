import React, { useRef, useState } from 'react';
import { db, storage, app } from '../firebaseConfig';
import { useNavigate } from 'react-router-dom';
import {
  addDoc,
  collection,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import './EndorsementForm.css';

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

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPT_EXTS = ['.pdf', '.doc', '.docx', '.zip', '.jpg', '.jpeg', '.png'];
const ACCEPT_ATTR = ACCEPT_EXTS.join(',');

/* -------------------- utils -------------------- */
const formatBytes = (b = 0) => {
  if (!b) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(1024));
  return `${(b / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
};

const looksUrlOrHandle = (s) =>
  /^https?:\/\//i.test(s) || /^@?[\w.\-]{2,}$/i.test(s);

/* magic-byte helpers */
const hex = (buf, n) =>
  Array.from(new Uint8Array(buf.slice(0, n)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

const isPdf = (buf) => new TextDecoder().decode(buf.slice(0, 5)) === '%PDF-';
const isJpeg = (buf) => hex(buf, 3) === 'ffd8ff';
const isPng = (buf) => hex(buf, 8) === '89504e470d0a1a0a';
const isZip = (buf) =>
  ['504b0304', '504b0506', '504b0708'].includes(hex(buf, 4));
const isOleDoc = (buf) => hex(buf, 8) === 'd0cf11e0a1b11ae1'; // legacy .doc

async function sha256Hex(file) {
  const buf = await file.arrayBuffer();
  if (!crypto?.subtle?.digest) return ''; // graceful fallback if not supported
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}

async function preScanFile(file) {
  if (!file) return { ok: false, reason: 'No file selected.' };

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, reason: 'File is larger than 10 MB.' };
  }

  const name = file.name || '';
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  if (!ACCEPT_EXTS.includes(ext)) {
    return {
      ok: false,
      reason: 'Unsupported file type. Allowed: PDF, DOC, DOCX, ZIP, JPG, JPEG, PNG.',
    };
  }

  const head = await file.slice(0, 560).arrayBuffer();
  const passesMagic =
    (ext === '.pdf' && isPdf(head)) ||
    ((ext === '.jpg' || ext === '.jpeg') && isJpeg(head)) ||
    (ext === '.png' && isPng(head)) ||
    ((ext === '.zip' || ext === '.docx') && isZip(head)) ||
    (ext === '.doc' && isOleDoc(head));

  if (!passesMagic) {
    return {
      ok: false,
      reason:
        'File header does not match its type. Please re-export and try again.',
    };
  }

  const sha = await sha256Hex(file);
  return { ok: true, sha256: sha };
}

/* -------------------- component -------------------- */
export default function EndorsementForm() {
  const [form, setForm] = useState(initial);
  const [file, setFile] = useState(null);
  const [fileSha256, setFileSha256] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(new Set());
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

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

  const acceptFile = async (f) => {
    setScanMessage('');
    setFile(null);
    setFileSha256('');
    if (!f) return;

    const scan = await preScanFile(f);
    if (!scan.ok) {
      setInvalid((s) => new Set(s).add('file'));
      setError(scan.reason);
      setScanMessage(scan.reason);
      return;
    }
    setInvalid((s) => {
      const next = new Set(s);
      next.delete('file');
      return next;
    });
    setFile(f);
    setFileSha256(scan.sha256 || '');
    setScanMessage('File looks good.');
  };

  const onFileInput = async (e) => {
    const f = e.target.files?.[0] || null;
    await acceptFile(f);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    await acceptFile(f || null);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
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

    // upload is optional

    if (!form.agree) nextInvalid.add('agree');

    if (nextInvalid.size) {
      setInvalid(nextInvalid);
      const msgs = [];
      if (nextInvalid.has('fullName')) msgs.push('Full name is required.');
      if (nextInvalid.has('email')) msgs.push('Enter a valid email address.');
      if (nextInvalid.has('phone')) msgs.push('Enter a valid U.S. phone number.');
      if (nextInvalid.has('city')) msgs.push('City is required.');
      if (nextInvalid.has('state')) msgs.push('Select a valid U.S. state.');
      if (nextInvalid.has('bands')) msgs.push('Band(s)/Act(s) is required.');
      if (nextInvalid.has('website') || nextInvalid.has('instagram') || nextInvalid.has('youtube') || nextInvalid.has('tiktok'))
        msgs.push('Website & social fields must be a URL or @handle.');
      if (nextInvalid.has('tourSchedule')) msgs.push('Touring schedule is required.');
      if (nextInvalid.has('currentGear')) msgs.push('Current gear is required.');
      if (nextInvalid.has('endorsementGoals')) msgs.push('Endorsement goals are required.');
      if (nextInvalid.has('mediaLinks')) msgs.push('Media links are required.');
      if (nextInvalid.has('whyOber')) msgs.push('Tell us why Ober resonates with you.');
      if (nextInvalid.has('heardAboutUs')) msgs.push('Please tell us how you heard about us.');
      if (nextInvalid.has('agree')) msgs.push('Please confirm your agreement to represent the brand.');
      setError(msgs.join(' '));
      return false;
    }

    setError('');
    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    if (file && file.size > MAX_UPLOAD_BYTES) {
      setInvalid((s) => new Set(s).add('file'));
      setError('File is larger than 10 MB. Please upload a smaller file.');
      return;
    }

    setSubmitting(true);
    try {
      // 1) Create Firestore doc
      const colRef = collection(db, 'endorsement_applications');
      const payload = {
        ...form,
        country: COUNTRY_US,
        state: form.state.toUpperCase(),
        createdAt: serverTimestamp(),
        status: 'new',
        source: 'website',
        hasAttachment: !!file,
        fileName: file?.name || '',
        fileSize: file?.size || 0,
        fileSha256: file ? fileSha256 || '' : '',
        clientScan: file ? scanMessage || '' : '',
      };
      const docRef = await addDoc(colRef, payload);

      // 2) Optional upload
      if (file) {
        const path = `endorsement_applications/${docRef.id}/uploads/${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file, {
          contentType: file.type || undefined,
          customMetadata: {
            sha256: fileSha256 || '',
            source: 'endorsement_form',
          },
        });
        const url = await getDownloadURL(fileRef);
        await updateDoc(doc(db, 'endorsement_applications', docRef.id), {
          attachment: {
            name: file.name,
            size: file.size,
            url,
            path,
            contentType: file.type || '',
            sha256: fileSha256 || '',
          },
        });
      }

      // 3) Auto-reply email
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
      setFile(null);
      setFileSha256('');
      setScanMessage('');
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
            placeholder=""
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
            placeholder=""
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
            placeholder="Tell us what resonates with you about our craft and brand."
          />
        </label>

        <label className={markInvalid('heardAboutUs')}>
          How did you hear about us?
          <input
            name="heardAboutUs"
            value={form.heardAboutUs}
            onChange={onChange}
            className={markInvalid('heardAboutUs')}
            placeholder="Tour, referral, ad, etc."
          />
        </label>

        {/* Footer: centered uploader + agreement + CTA */}
        <div className="form-footer-block">
          <div
            className={`dropzone ${dragOver ? 'drag-over' : ''} ${markInvalid('file')}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
            aria-label="Upload an optional file by clicking or dragging a file here"
          >
            {!file ? (
              <>
                <div className="dropzone-icon">⬆︎</div>
                <div className="dropzone-title">Upload (EPK / press kit / resume) — optional</div>
                <div className="dropzone-sub">
                  Drag &amp; drop here, or <span className="linkish">browse</span>
                </div>
                <div className="dropzone-meta">
                  Accepted: PDF, DOC, DOCX, ZIP, JPG, JPEG, PNG • Max {formatBytes(MAX_UPLOAD_BYTES)}
                </div>
                {scanMessage && <div className="dropzone-note">{scanMessage}</div>}
              </>
            ) : (
              <div className="dropzone-file">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatBytes(file.size)}</div>
                {fileSha256 && <div className="file-hash">SHA-256: {fileSha256.slice(0, 12)}…</div>}
                <button
                  type="button"
                  className="file-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setFileSha256('');
                    setScanMessage('');
                  }}
                >
                  Remove
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              onChange={onFileInput}
              hidden
            />
          </div>

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
            {submitting ? 'Submitting...' : 'Submit Application'}
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