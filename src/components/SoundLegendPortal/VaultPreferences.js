import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useActorContext } from '../../hooks/useActorContext';
import './VaultPreferences.css';

/* -------------------- tiny shared bits -------------------- */

const FALLBACK_POSTER = '/craft_in_motion/craftinmotion.png';

const MailLink = ({ label, subject, body }) => {
  const href = useMemo(() => {
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

// strip HTML tags for teaser text
const stripHtml = (s = '') => s.replace(/<[^>]*>/g, '').trim();

const buildTeaser = (raw) => {
  const base = stripHtml(raw || '');
  if (!base) return '';
  return base.length > 110 ? base.slice(0, 110) + '…' : base;
};

/** Mini version of the Legacy Vault card (non-clickable) */
function VaultCardPreview({ serial, heroImage, name, teaser }) {
  return (
    <div className="lv-item lv-item--preview">
      <div className="lv-item-media">
        {heroImage ? (
          <img
            className="lv-thumb"
            src={heroImage}
            alt={`${serial} – ${name || 'SoundLegend'}`}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        ) : (
          <video
            className="lv-item-video"
            src="/craft_in_motion/craftinmotion1080p.mp4"
            poster={FALLBACK_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}
      </div>

      <div className="lv-item-body">
        <h3 className="lv-artist">{name || 'Legacy Artisan'}</h3>
        <div className="lv-item-top">
          <span className="lv-item-serial">{serial}</span>
        </div>
        {teaser && <p className="lv-teaser">“{teaser}”</p>}
      </div>
    </div>
  );
}

/** Mini version of the Showroom story layout */
function ShowroomStoryPreview({ serial, name, storyHtml, isStoryPublic }) {
  return (
    <section className="showroom-story elegant-font showroom-story-preview">
      {name ? <h2 className="artist-name">{name}</h2> : null}
      <p className="legacy-subtitle">LEGACY ARTIST ({serial})</p>

      {isStoryPublic && storyHtml ? (
        <div
          className="showroom-story-content"
          dangerouslySetInnerHTML={{ __html: storyHtml }}
        />
      ) : (
        <p className="showroom-story-private">
          Legacy story kept private by the artist.
        </p>
      )}
    </section>
  );
}

/**
 * Dedicated vault toggle so we can control styling precisely
 */
const Switch = ({ checked, onChange }) => (
  <button
    type="button"
    className={`vp-toggle ${checked ? 'is-on' : 'is-off'}`}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
  >
    <span className="vp-toggle-knob" />
  </button>
);

/* -------------------- main component -------------------- */

export default function VaultPreferences({ project }) {
  const { actorIsAdmin } = useActorContext() || {};
  const canAdminEdit = !!actorIsAdmin;

  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({ showName: false, showStory: false });

  // on-file values (may be overridden by showroom doc)
  const [onFileName, setOnFileName] = useState('Anonymous Legend');
  const [onFileStoryHtml, setOnFileStoryHtml] = useState(
    '<p>Legacy Unknown.</p>'
  );

  // editable admin fields
  const [editName, setEditName] = useState('Anonymous Legend');
  const [editStory, setEditStory] = useState('<p>Legacy Unknown.</p>');

  // preview-specific bits from showroom doc
  const [heroImage, setHeroImage] = useState('');
  const [rawTeaser, setRawTeaser] = useState('');

  // serial used across previews
  const serial =
    project?.lineSerial ||
    project?.globalSerial ||
    project?.serial ||
    'SL-000';

  /* ---------- hydrate from project itself ---------- */
  useEffect(() => {
    const p = project?.publicPrefs || {};
    const nextPrefs = {
      showName: !!p.showName,
      showStory: !!p.showStory,
    };
    setPrefs(nextPrefs);

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
    setEditName(baseName);
    setEditStory(baseStory);
  }, [
    project?.publicPrefs,
    project?.customer?.name,
    project?.story,
    project?.specs?.story,
  ]);

  /* ---------- hydrate from showroom doc (if present) ---------- */
  useEffect(() => {
    const s = project?.lineSerial || project?.globalSerial;
    if (!s) return;
    let alive = true;

    (async () => {
      try {
        const ref = doc(
          db,
          'soundlegend_showroom',
          String(s).trim().toUpperCase()
        );
        const snap = await getDoc(ref);
        if (!alive || !snap.exists()) return;
        const d = snap.data() || {};

        // Stage / public name priority:
        // 1) top-level `name` on showroom doc
        // 2) meta.name
        // 3) publicDisplay.name
        const showroomName =
          (typeof d?.name === 'string' && d.name.trim()) ||
          (typeof d?.meta?.name === 'string' && d.meta.name.trim()) ||
          (typeof d?.publicDisplay?.name === 'string' &&
            d.publicDisplay.name.trim()) ||
          null;
        if (showroomName) {
          setOnFileName(showroomName);
          setEditName(showroomName);
        }

        const showroomStoryHtml =
          (typeof d?.story === 'string' && d.story.trim()) ||
          (typeof d?.publicDisplay?.storyHtml === 'string' &&
            d.publicDisplay.storyHtml.trim()) ||
          (typeof d?.specs?.story === 'string' && d.specs.story.trim()) ||
          null;
        if (showroomStoryHtml) {
          setOnFileStoryHtml(showroomStoryHtml);
          setEditStory(showroomStoryHtml);
        }

        const hero =
          d.heroImage ||
          (Array.isArray(d.gallery) && d.gallery[0]) ||
          '';
        setHeroImage(hero || '');

        const teaserSource =
          d.teaser ||
          d.tagline ||
          d.quote ||
          d.storyTeaser ||
          d.specs?.tagline ||
          showroomStoryHtml ||
          '';
        setRawTeaser(teaserSource || '');
      } catch (e) {
        console.debug('VaultPreferences: showroom fetch skipped', e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [project?.lineSerial, project?.globalSerial]);

  /* ---------- save prefs / fields to project ---------- */

  const savePrefsToFirestore = async (nextPrefs) => {
    if (!project?.id) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'projects', project.id),
        {
          publicPrefs: {
            showName: !!nextPrefs.showName,
            showStory: !!nextPrefs.showStory,
            // keep current editable values in sync
            displayName: editName || onFileName || 'Anonymous Legend',
            storyHtml: editStory || onFileStoryHtml || '<p>Legacy Unknown.</p>',
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Vault save error:', e);
      alert('Sorry, there was a problem saving Vault preferences.');
    } finally {
      setSaving(false);
    }
  };

  const confirmMakePrivate = () => {
    return window.confirm(
      'Are you sure you want to remove your personal legacy details from the public vault?'
    );
  };

  const handleToggleName = async (next) => {
    // going from public -> private
    if (!next && prefs.showName && !confirmMakePrivate()) {
      return;
    }
    const nextPrefs = { ...prefs, showName: next };
    setPrefs(nextPrefs);
    await savePrefsToFirestore(nextPrefs);
  };

  const handleToggleStory = async (next) => {
    if (!next && prefs.showStory && !confirmMakePrivate()) {
      return;
    }
    const nextPrefs = { ...prefs, showStory: next };
    setPrefs(nextPrefs);
    await savePrefsToFirestore(nextPrefs);
  };

  const handleAdminSaveName = async () => {
    if (!project?.id) return;
    const trimmed = (editName || '').trim() || 'Anonymous Legend';
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'projects', project.id),
        {
          publicPrefs: {
            displayName: trimmed,
            showName: !!prefs.showName,
            showStory: !!prefs.showStory,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setOnFileName(trimmed);
    } catch (e) {
      console.error('Vault admin name save error:', e);
      alert('Sorry, there was a problem saving the public name.');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminSaveStory = async () => {
    if (!project?.id) return;
    const value = editStory || '<p>Legacy Unknown.</p>';
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'projects', project.id),
        {
          publicPrefs: {
            storyHtml: value,
            showName: !!prefs.showName,
            showStory: !!prefs.showStory,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setOnFileStoryHtml(value);
    } catch (e) {
      console.error('Vault admin story save error:', e);
      alert('Sorry, there was a problem saving the legacy story.');
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

  /* ---------- what the public will actually see ---------- */
  const storyIsPublic = !!prefs.showStory;

  const publicName = prefs.showName
    ? (onFileName || 'Anonymous Legend')
    : 'Anonymous Legend';

  const publicStoryHtml = storyIsPublic ? onFileStoryHtml : '';

  // Only show teaser if story is public; otherwise Vault home card
  // should not surface the story at all.
  const teaser = storyIsPublic ? buildTeaser(rawTeaser || onFileStoryHtml) : '';

  if (!project) {
    return (
      <div className="slp-card">
        <h3>Vault Preferences</h3>
        <p className="slp-muted">No project selected.</p>
      </div>
    );
  }

  return (
    <div
      className="slp-card vp-card-root"
      data-component="VaultPreferences"
    >
      <h3>VAULT PREFERENCES</h3>
      <p className="slp-muted vp-intro">
        By default your Legacy is <strong>Private</strong>. Use the switches
        below to share your name or story publicly. Changes save automatically.
      </p>

      <div className="vp-layout">
        {/* LEFT SIDE – controls (stacked) */}
        <div className="vp-left">
          {/* NAME BLOCK */}
          <div className="vp-col">
            <div className="vp-row between">
              <label className="vp-label">Display my name publicly</label>
              <Switch checked={prefs.showName} onChange={handleToggleName} />
            </div>

            <div className="vp-row">
              <div className="vp-sub">
                STAGE / PUBLIC NAME <NameGuidelines />
              </div>
              <div className="vp-hint">
                Name is managed by Ober (to prevent spoofing).
                {canAdminEdit ? (
                  <> As an admin, you can update it directly below.</>
                ) : (
                  <> Use the button below to request a change.</>
                )}
              </div>

              <div
                className={`vp-preview ${!prefs.showName ? 'is-private' : ''}`}
              >
                <div className="vp-preview-top">
                  <StatusChip on={prefs.showName} kind="NAME" />
                </div>
                {canAdminEdit ? (
                  <>
                    <input
                      type="text"
                      className="vp-input"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Stage / public name"
                    />
                    <div className="vp-admin-actions">
                      <button
                        type="button"
                        className="apo-btn primary vp-admin-save"
                        onClick={handleAdminSaveName}
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save name'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="vp-preview-name">{onFileName}</div>
                )}
              </div>

              {!canAdminEdit && (
                <div className="vp-requests">
                  <MailLink
                    label="Request change to public / stage name"
                    subject="SoundLegend Vault — Stage/Public Name change"
                    body={`Project ID: ${project?.id || ''}\nCurrent: ${
                      onFileName || ''
                    }\nRequested: `}
                  />
                </div>
              )}
            </div>
          </div>

          {/* STORY BLOCK */}
          <div className="vp-col">
            <div className="vp-row between">
              <label className="vp-label">Display my story publicly</label>
              <Switch checked={prefs.showStory} onChange={handleToggleStory} />
            </div>

            <div className="vp-row">
              <div className="vp-sub">
                STORY (MANAGED BY OBER) <StoryGuidelines />
              </div>
              <div className="vp-hint">
                Story is managed by Ober (to prevent spoofing).
                {canAdminEdit ? (
                  <> As an admin, you can edit the story directly.</>
                ) : (
                  <> Use the button below to request a change.</>
                )}
              </div>
              <div className="vp-note-private">
                If this switch is off, your Legacy story is kept private by you,
                the Legacy Artist. It remains visible only to you and Ober.
              </div>

              <div
                className={`vp-preview ${!prefs.showStory ? 'is-private' : ''}`}
              >
                <div className="vp-preview-top">
                  <StatusChip on={prefs.showStory} kind="STORY" />
                </div>

                {canAdminEdit ? (
                  <>
                    <textarea
                      className="vp-textarea"
                      value={editStory}
                      onChange={(e) => setEditStory(e.target.value)}
                      rows={6}
                    />
                    <div className="vp-admin-actions">
                      <button
                        type="button"
                        className="apo-btn primary vp-admin-save"
                        onClick={handleAdminSaveStory}
                        disabled={saving}
                      >
                        {saving ? 'Saving…' : 'Save story'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div
                    className="vp-preview-story"
                    dangerouslySetInnerHTML={{ __html: onFileStoryHtml }}
                  />
                )}
              </div>

              {!canAdminEdit && (
                <div className="vp-requests">
                  <MailLink
                    label="Request change to legacy story"
                    subject="SoundLegend Vault — Story revision request"
                    body={`Project ID: ${
                      project?.id || ''
                    }\nRequested edits:\n`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – public preview */}
        <div className="vp-right">
          <section className="vp-public-preview">
            <div className="vp-public-header">
              <h4>Public preview</h4>
              <p>
                This is how your Legacy will appear in the public SoundLegend
                Vault and on your Legacy page, based on the switches on the
                left.
              </p>
            </div>

            <div className="vp-public-row">
              <div className="vp-public-card">
                <VaultCardPreview
                  serial={serial}
                  heroImage={heroImage}
                  name={publicName}
                  teaser={teaser}
                />
              </div>

              <div className="vp-public-story">
                <ShowroomStoryPreview
                  serial={serial}
                  name={publicName}
                  storyHtml={publicStoryHtml}
                  isStoryPublic={storyIsPublic}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}