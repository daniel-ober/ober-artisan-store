// src/components/SoundLegendPortal/SoundLegendPortal.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../context/AuthContext';

import './SoundLegendTabs.css';
import './SoundLegendPortal.css';

import ProjectProgress from './ProjectProgress';

/* -------------------- shared helpers (TOP-LEVEL) -------------------- */
// Map many possible country strings/codes to ISO-2 (US/CA for now)
const normalizeCountry = (v = '') => {
  const s = String(v).trim().toLowerCase();
  if (!s) return '';
  // common US variants
  if (['us', 'usa', 'u.s.', 'u.s.a', 'united states', 'united states of america', 'america'].includes(s)) return 'US';
  // common CA variants
  if (['ca', 'can', 'canada'].includes(s)) return 'CA';
  // already ISO-2?
  if (s.length === 2) return s.toUpperCase();
  // fallback: titlecase first two letters (still returns something)
  return s.slice(0, 2).toUpperCase();
};

// Normalize various shapes of address objects into a consistent shape
const cleanAddr = (a = {}) => {
  // Try a wide set of aliases we’ve seen across Stripe/Shopify/custom schemas
  const rawLine1 =
    a.line1 ??
    a.addressLine1 ??
    a.address_line1 ??
    a.address1 ??
    a.addr1 ??
    a.street1 ??
    a.street_line1 ??
    a.street ??
    a.line_1 ??
    '';

  const rawLine2 =
    a.line2 ??
    a.addressLine2 ??
    a.address_line2 ??
    a.address2 ??
    a.addr2 ??
    a.street2 ??
    a.unit ??
    a.apartment ??
    a.apt ??
    a.suite ??
    a.line_2 ??
    '';

  const rawCity =
    a.city ??
    a.locality ??
    a.town ??
    '';

  const rawState =
    a.state ??
    a.region ??
    a.province ??
    a.stateCode ??
    a.state_code ??
    a.administrative_area ??
    '';

  const rawPostal =
    a.postal_code ??
    a.postalCode ??
    a.postcode ??
    a.zip ??
    a.zipCode ??
    a.zip_code ??
    '';

  const rawCountry =
    a.country ??
    a.countryCode ??
    a.country_code ??
    a.countryShort ??
    a.iso2 ??
    a.isoCountry ??
    a.country_name ??
    '';

  return {
    line1: String(rawLine1).trim(),
    line2: String(rawLine2).trim(),
    city: String(rawCity).trim(),
    state: String(rawState).trim(),
    postal_code: String(rawPostal).trim(),
    country: normalizeCountry(rawCountry),
  };
};

// Find an address on common paths we use across users/projects/orders
const pickAddressFrom = (obj = {}) => {
  const c =
    obj?.shipping?.address ||                    // {shipping:{address:{...}}}
    obj?.shippingAddress ||                      // {shippingAddress:{...}}
    obj?.customer?.shipping?.address ||          // {customer:{shipping:{address:{...}}}}
    obj?.customer?.shippingAddress ||            // {customer:{shippingAddress:{...}}}
    obj?.customer?.address ||                    // {customer:{address:{...}}}
    obj?.customerDetails?.address ||             // {customerDetails:{address:{...}}}
    obj?.customer_details?.address ||            // snake_case variant
    obj?.address ||                              // {address:{...}}
    null;

  if (!c) return null;
  const normalized = cleanAddr(c);

  // Only return if at least one field is present (line1/city/state/zip/country)
  return Object.values(normalized).some(Boolean) ? normalized : null;
};

// Pick earliest address seen across projects and orders
const firstRecordedAddress = (projectsArr = [], ordersArr = []) => {
  const candidates = [];

  // project shipping address (use project.createdAt as time)
  for (const p of projectsArr) {
    const addr = pickAddressFrom(p);
    const t = tsToMillis(p?.createdAt) || Number.MAX_SAFE_INTEGER;
    if (addr) candidates.push({ addr, t, src: 'project' });
  }

  // ANY order address, timestamped by order.createdAt
  for (const o of ordersArr) {
    const addr = pickAddressFrom(o);
    const t = tsToMillis(o?.createdAt) || Number.MAX_SAFE_INTEGER;
    if (addr) candidates.push({ addr, t, src: 'order' });
  }

  if (!candidates.length) return null;

  // earliest timestamp wins
  candidates.sort((a, b) => a.t - b.t);
  return candidates[0].addr;
};

/* -------------------- helpers -------------------- */
function tsToMillis(v) {
  if (!v) return 0;
  if (typeof v === 'string') {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  if (typeof v === 'number') return v;
  if (v instanceof Date) return v.getTime() || 0;
  if (typeof v === 'object' && v.seconds) return v.seconds * 1000;
  try {
    const t = new Date(v).getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}
function fmtDate(v) {
  const ms = tsToMillis(v);
  return ms ? new Date(ms).toLocaleDateString() : '—';
}
function dollars(cents) {
  if (cents == null) return '—';
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

/* small reusable pieces */
const MailLink = ({ label, subject, body }) => {
  const href = React.useMemo(() => {
    const s = encodeURIComponent(subject || '');
    const b = encodeURIComponent(body || '');
    return `mailto:soundlegend@oberartisandrums.com?subject=${s}&body=${b}`;
  }, [subject, body]);
  return (
    <a className="apo-btn request" href={href}>
      {label} ↗
    </a>
  );
};

const Tabs = ({ tabs, current, onChange, rightSlot }) => (
  <div className="slp-tabs">
    <div
      className="slp-tablist"
      role="tablist"
      aria-label="SoundLegend sections"
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={current === t.key}
          className={`slp-tab ${current === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
    <div className="slp-tab-right">{rightSlot}</div>
  </div>
);

/* -------------------- main portal -------------------- */
const SoundLegendPortal = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [orders, setOrders] = useState([]);
  const [mediaLinks, setMediaLinks] = useState([]);
  const [tab, setTab] = useState('progress');

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      try {
        let qProj = query(
          collection(db, 'projects'),
          where('ownerUid', '==', user.uid)
        );
        let snap = await getDocs(qProj);

        if (snap.empty && user.email) {
          const emailLower = user.email.trim().toLowerCase();
          qProj = query(
            collection(db, 'projects'),
            where('customer.emailLower', '==', emailLower)
          );
          snap = await getDocs(qProj);
        }

        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => tsToMillis(a.createdAt) - tsToMillis(b.createdAt));
        setProjects(list);
        setSelectedId(list[0]?.id || '');
      } catch (e) {
        console.error('Error loading projects', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  useEffect(() => {
    const run = async () => {
      if (!user?.email) return;
      try {
        const qOrders = query(
          collection(db, 'orders'),
          where('customerEmail', '==', user.email)
        );
        const snap = await getDocs(qOrders);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));
        setOrders(list);
      } catch (e) {
        console.warn('Order fetch skipped/failed', e);
      }
    };
    run();
  }, [user?.email]);

  useEffect(() => {
    const run = async () => {
      if (!selectedId) {
        setMediaLinks([]);
        return;
      }
      try {
        const snap = await getDocs(
          collection(db, 'projects', selectedId, 'media_links')
        );
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt));
        setMediaLinks(list);
      } catch (e) {
        console.warn('media_links fetch skipped/failed', e);
        setMediaLinks([]);
      }
    };
    run();
  }, [selectedId]);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) || null,
    [projects, selectedId]
  );

  const latestOrder = useMemo(() => orders[0] || null, [orders]);

  if (!user)
    return (
      <div className="slp-page">Please sign in to view your Artist Portal.</div>
    );
  if (loading) return <div className="slp-page">Loading your SoundLegend…</div>;
  if (!projects.length) {
    return (
      <div className="slp-page">
        <h2>Welcome to your SoundLegend</h2>
        <p>
          No projects are linked to your account yet. If this seems wrong,
          email:{' '}
          <a href="mailto:soundlegend@oberartisandrums.com">
            soundlegend@oberartisandrums.com
          </a>
        </p>
      </div>
    );
  }

  const ProjectPicker =
    projects.length > 1 ? (
      <select
        className="slp-picker"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.lineSerial || p.globalSerial || p.artisanLine || p.id}
            {p.width && p.shellDepth ? ` — ${p.width}×${p.shellDepth}"` : ''}
          </option>
        ))}
      </select>
    ) : null;

  const tabs = [
    { key: 'progress', label: 'Build Progress' },
    { key: 'scope', label: 'Scope of Work' },
    { key: 'vault', label: 'Vault Preferences' },
    { key: 'media', label: 'Media' },
    { key: 'orders', label: 'Payments & Orders' },
    { key: 'account', label: 'Account Settings' },
  ];

  return (
    <div className="slp-page">
      <h2 className="slp-title">SoundLegend</h2>

      <Tabs
        tabs={tabs}
        current={tab}
        onChange={setTab}
        rightSlot={ProjectPicker}
      />

      <div className="slp-panel">
        {tab === 'progress' && (
          <BuildProgress project={selected} isAdmin={isAdmin} />
        )}
        {tab === 'scope' && <ScopeOfWork project={selected} />}
        {tab === 'vault' && <VaultPrefs project={selected} />}
        {tab === 'media' && (
          <MediaTab
            projectId={selected?.id}
            project={selected}
            isAdmin={isAdmin}
            user={user}
            mediaLinks={mediaLinks}
            onAdded={async () => {
              const snap = await getDocs(
                collection(db, 'projects', selected.id, 'media_links')
              );
              const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
              list.sort(
                (a, b) => tsToMillis(b.createdAt) - tsToMillis(a.createdAt)
              );
              setMediaLinks(list);
            }}
          />
        )}
        {tab === 'orders' && <PaymentsOrders orders={orders} />}

        {tab === 'account' && (
          <AccountSettings
            user={user}
            projects={projects}
            orders={orders}
            latestOrder={latestOrder}
            isAdmin={isAdmin}
          />
        )}
      </div>
    </div>
  );
};

export default SoundLegendPortal;

/* ==================== TAB: Build Progress (inline) ==================== */
const BuildProgress = ({ project, isAdmin }) => {
  if (!project) return null;
  return (
    <div className="slp-card">
      <h3>Build Progress</h3>
      <div className="slp-block">
        <ProjectProgress
          projectId={project.id}
          project={project}
          readOnly={!isAdmin}
        />
      </div>
    </div>
  );
};

/* ==================== TAB: Scope of Work (full) ==================== */
const ScopeOfWork = ({ project }) => {
  const [showAll, setShowAll] = useState(false);
  if (!project) return null;

  const nice = (k) =>
    String(k || '')
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (s) => s.toUpperCase());

  const curated = [
    ['artisanLine', 'Artisan Line'],
    ['shellConstructionName', 'Shell Construction'],
    ['width', 'Width'],
    ['shellDepth', 'Depth'],
    ['woodPrimary', 'Wood Species'],
    ['finishName', 'Finish'],
    ['bearingEdges', 'Bearing Edges'],
    ['hardware', 'Hardware'],
    ['snareWires', 'Snare Wires'],
  ];

  const remaining = Object.entries(project)
    .filter(([k, v]) => {
      const already = curated.some(([key]) => key === k);
      const simple =
        typeof v === 'string' ||
        typeof v === 'number' ||
        typeof v === 'boolean' ||
        v == null;
      return !already && simple;
    })
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="slp-card">
      <h3>Scope of Work</h3>

      <div className="slp-two-col">
        <ul className="slp-spec">
          {curated.map(([key, label]) => (
            <li key={key}>
              <span>{label}</span>
              <b>
                {project[key] != null
                  ? key === 'width' && project.shellDepth
                    ? `${project.width}×${project.shellDepth}"`
                    : String(project[key])
                  : '—'}
              </b>
            </li>
          ))}
        </ul>

        <div className="slp-summary">
          <div className="slp-summary-title">{project.artisanLine || '—'}</div>
          <div className="slp-summary-sub">
            {project.shellConstructionName || '—'}
          </div>
          <div className="slp-summary-sub">
            {project.width && project.shellDepth
              ? `${project.width}×${project.shellDepth}"`
              : '—'}
          </div>
          <div className="slp-summary-sub">{project.woodPrimary || '—'}</div>
        </div>
      </div>

      <button
        className="apo-btn"
        style={{ marginTop: 12 }}
        onClick={() => setShowAll((s) => !s)}
      >
        {showAll ? 'Hide extra fields' : 'Show all fields'}
      </button>

      {showAll && (
        <table className="slp-table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {remaining.map(([k, v]) => (
              <tr key={k}>
                <td>{nice(k)}</td>
                <td>{v == null || v === '' ? '—' : String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

/* ==================== TAB: Vault Preferences ==================== */
const VaultPrefs = ({ project }) => {
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({ showName: false, showStory: false });

  // on-file values (may be overridden by showroom doc)
  const [onFileName, setOnFileName] = useState('Anonymous Legend');
  const [onFileStoryHtml, setOnFileStoryHtml] = useState(
    '<p>Legacy Unknown.</p>'
  );

  useEffect(() => {
    const p = project?.publicPrefs || {};
    setPrefs({ showName: !!p.showName, showStory: !!p.showStory });

    const baseName =
      project?.publicPrefs?.displayName ||
      project?.customer?.name ||
      'Anonymous Legend';

    const baseStory =
      project?.publicPrefs?.storyHtml?.trim() ||
      project?.story ||
      project?.specs?.story ||
      '<p>Legacy Unknown.</p>';

    setOnFileName(baseName);
    setOnFileStoryHtml(baseStory);
  }, [
    project?.publicPrefs,
    project?.customer?.name,
    project?.story,
    project?.specs?.story,
  ]);

  useEffect(() => {
    const serial = project?.lineSerial || project?.globalSerial;
    if (!serial) return;
    let alive = true;

    (async () => {
      try {
        const ref = doc(
          db,
          'soundlegend_showroom',
          String(serial).trim().toUpperCase()
        );
        const snap = await getDoc(ref);
        if (!alive || !snap.exists()) return;
        const d = snap.data() || {};

        const showroomName =
          (typeof d?.meta?.name === 'string' && d.meta.name.trim()) ||
          (typeof d?.publicDisplay?.name === 'string' &&
            d.publicDisplay.name.trim()) ||
          null;
        if (showroomName) setOnFileName(showroomName);

        const showroomStoryHtml =
          (typeof d?.story === 'string' && d.story.trim()) ||
          (typeof d?.publicDisplay?.storyHtml === 'string' &&
            d.publicDisplay.storyHtml.trim()) ||
          (typeof d?.specs?.story === 'string' && d.specs.story.trim()) ||
          null;
        if (showroomStoryHtml) setOnFileStoryHtml(showroomStoryHtml);
      } catch (e) {
        console.debug('Showroom fetch skipped', e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [project?.lineSerial, project?.globalSerial]);

  const save = async () => {
    if (!project?.id) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'projects', project.id),
        {
          publicPrefs: {
            showName: !!prefs.showName,
            showStory: !!prefs.showStory,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      alert('Vault preferences saved.');
    } catch (e) {
      console.error('Vault save error:', e);
      alert('Sorry, there was a problem saving.');
    } finally {
      setSaving(false);
    }
  };

  const StatusChip = ({ on, kind }) => (
    <span className={`vp-status ${on ? 'public' : 'private'}`}>
      {on ? `LEGACY ${kind} ACTIVE` : `LEGACY ${kind} PRIVATE`}
    </span>
  );

  const NameGuidelines = () => (
    <span className="vp-help" tabIndex={0} aria-label="Stage name guidelines">
      ⓘ
      <span className="vp-popover" role="tooltip">
        <b>Stage/Public Name Guidelines</b>
        <ul>
          <li>2–40 characters</li>
          <li>Letters, numbers, spaces, . ’ - only</li>
          <li>No profanity, hate speech, or impersonation</li>
          <li>Subject to admin approval</li>
        </ul>
      </span>
    </span>
  );

  const StoryGuidelines = () => (
    <span className="vp-help" tabIndex={0} aria-label="Legacy story guidelines">
      ⓘ
      <span className="vp-popover" role="tooltip">
        <b>Legacy Story Guidelines</b>
        <ul>
          <li>1–3 short paragraphs; keep it personal and respectful</li>
          <li>No sensitive personal info (addresses, phone, etc.)</li>
          <li>We may lightly edit for clarity/length</li>
          <li>Requests reviewed by Ober before publishing</li>
        </ul>
      </span>
    </span>
  );

  return (
    <div className="slp-card">
      <h3>Vault Preferences</h3>
      <p className="slp-muted">
        By default your Legacy is <strong>Private</strong>. Use the switches
        below to share your name or story publicly.
      </p>

      <div className="vp-grid">
        {/* NAME */}
        <div className="vp-col">
          <div className="vp-row between">
            <label className="vp-label">Display my name publicly</label>
            <Switch
              checked={prefs.showName}
              onChange={(v) => setPrefs({ ...prefs, showName: v })}
            />
          </div>

          <div className="vp-row">
            <div className="vp-sub">
              STAGE / PUBLIC NAME <NameGuidelines />
            </div>
            <div className="vp-hint">
              Name is managed by Ober (to prevent spoofing). Use the button
              below to request a change.
            </div>

            <div
              className={`vp-preview ${!prefs.showName ? 'is-private' : ''}`}
            >
              <div className="vp-preview-top">
                <StatusChip on={prefs.showName} kind="NAME" />
              </div>
              <div className="vp-preview-name">{onFileName}</div>
            </div>

            <div className="vp-requests" style={{ marginTop: 10 }}>
              <MailLink
                label="Request a name change"
                subject="SoundLegend Vault — Stage/Public Name change"
                body={`Project ID: ${project?.id || ''}\nCurrent: ${onFileName}\nRequested: `}
              />
            </div>
          </div>
        </div>

        {/* STORY */}
        <div className="vp-col">
          <div className="vp-row between">
            <label className="vp-label">Display my story publicly</label>
            <Switch
              checked={prefs.showStory}
              onChange={(v) => setPrefs({ ...prefs, showStory: v })}
            />
          </div>

          <div className="vp-row">
            <div className="vp-sub">
              STORY (MANAGED BY OBER) <StoryGuidelines />
            </div>
            <div className="vp-hint">
              Story is managed by Ober (to prevent spoofing). Use the button
              below to request a change.
            </div>

            <div
              className={`vp-preview ${!prefs.showStory ? 'is-private' : ''}`}
            >
              <div className="vp-preview-top">
                <StatusChip on={prefs.showStory} kind="STORY" />
              </div>
              <div
                className="vp-preview-story"
                dangerouslySetInnerHTML={{ __html: onFileStoryHtml }}
              />
            </div>

            <div className="vp-requests" style={{ marginTop: 10 }}>
              <MailLink
                label="Request a story revision"
                subject="SoundLegend Vault — Story revision request"
                body={`Project ID: ${project?.id || ''}\nRequested edits:\n`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="vp-actions">
        <button className="apo-btn primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save Vault Preferences'}
        </button>
      </div>
    </div>
  );
};

/* ==================== tiny bits ==================== */
const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    className={`apo-toggle ${checked ? 'on' : 'off'}`}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
  >
    <span className="knob" />
  </button>
);

/* ==================== TAB: Media ==================== */
const MediaTab = ({
  projectId,
  project, // (kept for future)
  isAdmin,
  user,
  mediaLinks,
  onAdded,
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const addLink = async () => {
    if (!projectId || !linkUrl.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'projects', projectId, 'media_links'), {
        url: linkUrl.trim(),
        title: linkTitle.trim() || null,
        addedBy: user?.uid || null,
        createdAt: serverTimestamp(),
      });
      setLinkUrl('');
      setLinkTitle('');
      onAdded?.();
    } catch (e) {
      console.error('add link failed', e);
      alert('Could not save link. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="slp-card">
      <h3>Media</h3>
      <div className="slp-muted" style={{ marginBottom: 10 }}>
        Admins can upload/download anything. Artists can add media links
        (YouTube, Spotify, Apple Music, press kits, websites, etc.).
      </div>

      {isAdmin && (
        <div className="slp-admin-box">
          <div className="slp-admin-title">Admin Uploads</div>
          <div className="slp-muted">
            Storage uploads/downloads can be wired here (files, images,
            audio/video).
          </div>
        </div>
      )}

      <div className="slp-link-add">
        <input
          className="vp-input"
          placeholder="https://youtube.com/… or https://open.spotify.com/…"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
        <input
          className="vp-input"
          placeholder="Title (optional)"
          value={linkTitle}
          onChange={(e) => setLinkTitle(e.target.value)}
        />
        <button
          className="apo-btn"
          onClick={addLink}
          disabled={saving || !linkUrl.trim()}
        >
          {saving ? 'Saving…' : 'Add Link'}
        </button>
      </div>

      <div className="slp-links-list">
        {mediaLinks.length === 0 ? (
          <div className="slp-muted">No media links yet.</div>
        ) : (
          <ul>
            {mediaLinks.map((m) => (
              <li key={m.id} className="slp-link-row">
                <div className="slp-link-title">{m.title || 'Media Link'}</div>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="apo-btn"
                >
                  Open ↗
                </a>
                <div className="slp-link-date">{fmtDate(m.createdAt)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {project?.attachments && (
        <div style={{ marginTop: 16 }}>
          <div className="slp-muted" style={{ marginBottom: 6 }}>
            Project Attachments (read-only preview):
          </div>
          <AttachmentStrip attachments={project.attachments} />
        </div>
      )}
    </div>
  );
};

const AttachmentStrip = ({ attachments }) => {
  const groups = Object.entries(attachments || {});
  if (!groups.length) return null;
  return (
    <div className="slp-attachments">
      {groups.map(([group, arr]) => {
        const items = Array.isArray(arr) ? arr : [];
        if (!items.length) return null;
        return (
          <div key={group} className="slp-attach-group">
            <div className="slp-attach-title">{group.replace(/_/g, ' ')}</div>
            <div className="slp-attach-row">
              {items.map((it, i) =>
                it?.url ? (
                  <a
                    key={i}
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="slp-thumb"
                  >
                    <img src={it.url} alt={it.category || 'attachment'} />
                  </a>
                ) : null
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ==================== TAB: Payments & Orders ==================== */
const PaymentsOrders = ({ orders }) => {
  if (!orders?.length)
    return (
      <div className="slp-card">
        <h3>Payments & Orders</h3>
        <p className="slp-muted">
          No order/payment records found for your account email.
        </p>
      </div>
    );

  return (
    <div className="slp-card">
      <h3>Payments & Orders</h3>
      <table className="slp-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td className="mono">{o.id}</td>
              <td>{fmtDate(o.createdAt)}</td>
              <td>{dollars(o.amountTotal)}</td>
              <td>{o.status || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


/* ==================== TAB: Account Settings (per-section edit) ==================== */
const AccountSettings = ({ user, projects, orders, latestOrder, isAdmin }) => {
  const uid = user?.uid;

  // ---------- helpers ----------
  const s = (v) => String(v || '').toLowerCase();
  const isDelivered = (p) => !!p?.shipping?.deliveryDate;
  const isInTransit = (p) => !!p?.shipping?.shipDate && !isDelivered(p);
  const isFinished = (p) =>
    s(p?.status) === 'finished' ||
    /all steps complete|completed/.test(s(p?.currentPhase)) ||
    isDelivered(p);

  // If ANY project is mid-build or in transit → lock address section
  const addressLocked = (projects || []).some(
    (p) => !isFinished(p) || isInTransit(p)
  );
  const lockReason = (projects || []).some(isInTransit)
    ? 'in transit'
    : (projects || []).some((p) => !isFinished(p))
      ? 'in progress'
      : null;

  // ---------- load current values ----------
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState({
    name: '',
    email: '',
    phone: '',
    notifyEmail: true,
    notifySms: false,
    address: null,
  });

  // working values (shown in inputs)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addr, setAddr] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
  });

  // notifications (unchanged behavior; still editable together)
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(false);

  // errors
  const [emailErr, setEmailErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');

  // section edit toggles
  const [editName, setEditName] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [editPhone, setEditPhone] = useState(false);
  const [editAddr, setEditAddr] = useState(false);

  // section saving flags
  const [savingName, setSavingName] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test((val || '').trim());

  const digitsOnly = (str) => (str || '').replace(/\D/g, '');
  const prettyUSPhone = (d) => {
    const v = (d || '').slice(0, 10);
    if (v.length < 4) return v;
    if (v.length < 7) return `(${v.slice(0, 3)}) ${v.slice(3)}`;
    return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}`;
  };

useEffect(() => {
  let alive = true;
  (async () => {
    if (!uid) return;

    try {
      const uref = doc(db, 'users', uid);
      const usnap = await getDoc(uref);

      const fallbackName =
        projects?.[0]?.customer?.name ||
        projects?.[0]?.publicPrefs?.displayName ||
        user?.displayName ||
        '';

      const fallbackEmail =
        projects?.[0]?.customer?.email || user?.email || '';

      const fallbackPhone = projects?.[0]?.customer?.phone || '';

      // try users/{uid}.address, or any address-like shape on the user doc
      const userDoc = usnap.exists() ? (usnap.data() || {}) : {};
      const userLevelAddr =
        pickAddressFrom({ address: userDoc.address }) ||
        pickAddressFrom(userDoc) ||
        null;

      // earliest address found across projects/orders
      const originAddr = firstRecordedAddress(projects, orders || []);

      // DEBUG: see exactly what we found
      if (typeof window !== 'undefined') {
        console.log('[AccountSettings] address debug →', {
          userDocAddress: userDoc.address,
          pick_userDoc: pickAddressFrom(userDoc),
          pick_userDoc_wrapped: pickAddressFrom({ address: userDoc.address }),
          pick_firstProject: projects?.[0] ? pickAddressFrom(projects[0]) : null,
          firstRecordedAddress: originAddr,
        });
      }

      const base = {
        name: usnap.exists() ? (userDoc.name || fallbackName) : fallbackName,
        email: usnap.exists() ? (userDoc.email || fallbackEmail) : fallbackEmail,
        phone: usnap.exists() ? (userDoc.phone || fallbackPhone) : fallbackPhone,
        notifyEmail: !!(userDoc.notificationPrefs?.email ?? true),
        notifySms: !!(userDoc.notificationPrefs?.sms ?? false),
        address: userLevelAddr || originAddr || null,
      };

      if (!alive) return;

      setInitial(base);
      setName(base.name || '');
      setEmail(base.email || '');
      setPhone(prettyUSPhone(digitsOnly(base.phone || '')));
      setNotifyEmail(base.notifyEmail);
      setNotifySms(base.notifySms);
      setAddr(
        base.address || { line1:'', line2:'', city:'', state:'', postal_code:'', country:'' }
      );

      setEmailErr(isValidEmail(base.email) || !base.email ? '' : 'Enter a valid email');
      const d = digitsOnly(base.phone || '');
      setPhoneErr(d.length === 10 || d.length === 0 ? '' : 'Enter a valid 10-digit phone number');
    } finally {
      if (alive) setLoading(false);
    }
  })();
  return () => { alive = false; };
}, [uid, projects, orders, user]);

  // ---------- shared patch writer ----------
  const writeUserPatch = async (patch, auditChanges, primaryProjectPatch) => {
    await setDoc(
      doc(db, 'users', uid),
      { ...patch, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // keep primary project customer info in sync (name/email/phone/address)
    const primaryProject = projects?.[0];
    if (isAdmin && primaryProject?.id && primaryProjectPatch) {
      await setDoc(
        doc(db, 'projects', primaryProject.id),
        {
          customer: {
            ...(primaryProject.customer || {}),
            ...primaryProjectPatch,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // audit (basic)
    if (Object.keys(auditChanges || {}).length) {
      const logRef = doc(collection(db, 'users', uid, 'audit_logs'));
      await setDoc(logRef, {
        type: 'account_update',
        actorUid: uid,
        actorEmail: user?.email || null,
        changes: auditChanges,
        createdAt: serverTimestamp(),
        source: 'AccountSettings/section-save',
      });
    }
  };

  // ---------- section actions ----------
  const onSaveName = async () => {
    setSavingName(true);
    try {
      const before = initial.name || '';
      const after = (name || '').trim();
      await writeUserPatch(
        { name: after },
        before === after ? {} : { name: { before, after } },
        { name: after }
      );
      setInitial((i) => ({ ...i, name: after }));
      setEditName(false);
      alert('Name updated.');
    } catch (e) {
      console.error(e); alert('Could not save name.');
    } finally { setSavingName(false); }
  };

  const onCancelName = () => {
    setName(initial.name || '');
    setEditName(false);
  };

  const onSaveEmail = async () => {
    if (!isValidEmail(email)) { setEmailErr('Enter a valid email'); return; }
    setSavingEmail(true);
    try {
      const before = initial.email || '';
      const after = (email || '').trim();
      await writeUserPatch(
        { email: after },
        before === after ? {} : { email: { before, after } },
        { email: after }
      );
      setInitial((i) => ({ ...i, email: after }));
      setEditEmail(false);
      alert('Email updated.');
    } catch (e) {
      console.error(e); alert('Could not save email.');
    } finally { setSavingEmail(false); }
  };

  const onCancelEmail = () => {
    setEmail(initial.email || '');
    setEmailErr('');
    setEditEmail(false);
  };

  const onSavePhone = async () => {
    const digits = digitsOnly(phone);
    if (digits.length !== 10) { setPhoneErr('Enter a valid 10-digit phone number'); return; }
    setSavingPhone(true);
    try {
      const pretty = prettyUSPhone(digits);
      const before = initial.phone || '';
      const after = pretty;
      await writeUserPatch(
        { phone: after },
        before === after ? {} : { phone: { before, after } },
        { phone: after }
      );
      setInitial((i) => ({ ...i, phone: after }));
      setEditPhone(false);
      alert('Phone updated.');
    } catch (e) {
      console.error(e); alert('Could not save phone.');
    } finally { setSavingPhone(false); }
  };

  const onCancelPhone = () => {
    setPhone(prettyUSPhone(digitsOnly(initial.phone || '')));
    setPhoneErr('');
    setEditPhone(false);
  };

  const onSaveAddr = async () => {
    setSavingAddr(true);
    try {
      const before = initial.address || null;
      const after = cleanAddr(addr);
      const changed = JSON.stringify(before || {}) !== JSON.stringify(after || {});
      await writeUserPatch(
        { address: after },
        changed ? { address: { before, after } } : {},
        { shippingAddress: after }
      );
      setInitial((i) => ({ ...i, address: after }));
      setEditAddr(false);
      alert('Address updated.');
    } catch (e) {
      console.error(e); alert('Could not save address.');
    } finally { setSavingAddr(false); }
  };

  const onCancelAddr = () => {
    setAddr(initial.address || { line1:'', line2:'', city:'', state:'', postal_code:'', country:'' });
    setEditAddr(false);
  };

  const onSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      await writeUserPatch(
        { notificationPrefs: { email: !!notifyEmail, sms: !!notifySms } },
        { notificationPrefs: { before: null, after: { email: !!notifyEmail, sms: !!notifySms } } },
        null
      );
      alert('Notification preferences saved.');
    } catch (e) {
      console.error(e); alert('Could not save preferences.');
    } finally { setSavingPrefs(false); }
  };

  if (loading) {
    return (
      <div className="slp-card">
        <h3>Account Settings</h3>
        <div className="slp-muted">Loading…</div>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <div className="slp-card">
      <h3>Account Settings</h3>

      {/* NAME */}
      <div className="as-section">
        <div className="as-header">
          <label className="vp-label">Name</label>
          {!editName ? (
            <button className="apo-btn" onClick={() => setEditName(true)}>Edit</button>
          ) : (
            <div className="as-actions">
              <button className="apo-btn" onClick={onCancelName}>Cancel</button>
              <button className="apo-btn primary" onClick={onSaveName} disabled={savingName}>
                {savingName ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <input
          className="vp-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!editName}
          placeholder="Full name"
        />
      </div>

      {/* EMAIL */}
      <div className="as-section">
        <div className="as-header">
          <label className="vp-label">Email</label>
          {!editEmail ? (
            <button className="apo-btn" onClick={() => setEditEmail(true)}>Edit</button>
          ) : (
            <div className="as-actions">
              <button className="apo-btn" onClick={onCancelEmail}>Cancel</button>
              <button className="apo-btn primary" onClick={onSaveEmail} disabled={savingEmail}>
                {savingEmail ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <input
          className={`vp-input ${emailErr ? 'has-error' : ''}`}
          type="email"
          value={email}
          onChange={(e) => {
            const v = e.target.value;
            setEmail(v);
            setEmailErr(isValidEmail(v) ? '' : 'Enter a valid email');
          }}
          onBlur={() => setEmailErr(isValidEmail(email) ? '' : 'Enter a valid email')}
          disabled={!editEmail}
          placeholder="name@example.com"
        />
        {emailErr && <div className="vp-hint" style={{ color: '#ff9a9a' }}>{emailErr}</div>}
      </div>

      {/* PHONE */}
      <div className="as-section">
        <div className="as-header">
          <label className="vp-label">Phone</label>
          {!editPhone ? (
            <button className="apo-btn" onClick={() => setEditPhone(true)}>Edit</button>
          ) : (
            <div className="as-actions">
              <button className="apo-btn" onClick={onCancelPhone}>Cancel</button>
              <button className="apo-btn primary" onClick={onSavePhone} disabled={savingPhone}>
                {savingPhone ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <input
          className={`vp-input ${phoneErr ? 'has-error' : ''}`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => {
            const d = digitsOnly(e.target.value).slice(0, 10);
            setPhone(prettyUSPhone(d));
            setPhoneErr(d.length === 10 ? '' : 'Enter a valid 10-digit phone number');
          }}
          onBlur={() => {
            const d = digitsOnly(phone).slice(0, 10);
            setPhone(prettyUSPhone(d));
            setPhoneErr(d.length === 10 ? '' : 'Enter a valid 10-digit phone number');
          }}
          disabled={!editPhone}
          placeholder="(555) 555-5555"
        />
        {phoneErr && <div className="vp-hint" style={{ color: '#ff9a9a' }}>{phoneErr}</div>}
      </div>

      {/* NOTIFICATIONS (optional to split later) */}
      <div className="as-section">
        <div className="as-header">
          <label className="vp-label">Notifications</label>
          <div className="as-actions">
            <button className="apo-btn primary" onClick={onSavePrefs} disabled={savingPrefs}>
              {savingPrefs ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, alignItems:'center', marginTop:8 }}>
          <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
            <Switch checked={notifyEmail} onChange={setNotifyEmail} />
            <span className="slp-muted">Email updates</span>
          </label>
          <label style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
            <Switch checked={notifySms} onChange={setNotifySms} />
            <span className="slp-muted">Text (SMS) updates</span>
          </label>
        </div>
        <div className="vp-hint">Opt into email and/or SMS notifications for build updates and important account notices.</div>
      </div>

      {/* ADDRESS */}
      <div className="as-section">
        <div className="as-header">
          <label className="vp-label">Shipping Address</label>
          {!addressLocked && !editAddr ? (
            <button className="apo-btn" onClick={() => setEditAddr(true)}>Edit</button>
          ) : !addressLocked ? (
            <div className="as-actions">
              <button className="apo-btn" onClick={onCancelAddr}>Cancel</button>
              <button className="apo-btn primary" onClick={onSaveAddr} disabled={savingAddr}>
                {savingAddr ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : null}
        </div>

        {!addressLocked ? (
          <>
            <div style={{ display:'grid', gap:8, gridTemplateColumns:'1fr' }}>
              <input
                className="vp-input"
                placeholder="Address line 1"
                value={addr.line1}
                onChange={(e) => setAddr({ ...addr, line1: e.target.value })}
                disabled={!editAddr}
              />
              <input
                className="vp-input"
                placeholder="Address line 2 (optional)"
                value={addr.line2}
                onChange={(e) => setAddr({ ...addr, line2: e.target.value })}
                disabled={!editAddr}
              />
              <div style={{ display:'grid', gap:8, gridTemplateColumns:'1.2fr 0.8fr' }}>
                <input
                  className="vp-input"
                  placeholder="City"
                  value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })}
                  disabled={!editAddr}
                />
                <input
                  className="vp-input"
                  placeholder="State/Province"
                  value={addr.state}
                  onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                  disabled={!editAddr}
                />
              </div>
              <div style={{ display:'grid', gap:8, gridTemplateColumns:'0.8fr 1.2fr' }}>
                <input
                  className="vp-input"
                  placeholder="Postal / ZIP"
                  value={addr.postal_code}
                  onChange={(e) => setAddr({ ...addr, postal_code: e.target.value })}
                  disabled={!editAddr}
                />
                <input
                  className="vp-input"
                  placeholder="Country"
                  value={addr.country}
                  onChange={(e) => setAddr({ ...addr, country: e.target.value })}
                  disabled={!editAddr}
                />
              </div>
            </div>
            <div className="vp-hint">
              Updating your address here affects future shipments only. Past orders remain unchanged.
            </div>
          </>
        ) : (
          <>
            <div className="vp-card" style={{ whiteSpace:'pre-line' }}>
              {(() => {
                const a = initial.address || addr;
                const parts = [
                  a?.line1,
                  a?.line2,
                  [a?.city, a?.state].filter(Boolean).join(', '),
                  [a?.postal_code, a?.country].filter(Boolean).join(' '),
                ].filter(Boolean);
                return parts.length ? parts.join('\n') : '—';
              })()}
            </div>
            <div className="vp-hint" style={{ marginTop: 8 }}>
              {lockReason === 'in transit'
                ? 'Your order is in transit. For security, address changes are locked until delivery.'
                : 'Your drum is currently in production. Address changes are locked until the build is complete.'}
            </div>
            <div className="vp-requests" style={{ marginTop: 10 }}>
              <MailLink
                label="Request an address change"
                subject="SoundLegend — Shipping address change request"
                body={`Hi Ober team,\n\nI need to update my shipping address for an in-progress build.\n\nNew address:\n\n(Street)\n(City, State, ZIP)\n(Country)\n\nThanks!`}
              />
            </div>
          </>
        )}
      </div>

      <p className="slp-muted" style={{ marginTop: 8 }}>
        Edit one section at a time. Changes won’t apply until you hit <b>Save</b> for that section.
      </p>
    </div>
  );
};