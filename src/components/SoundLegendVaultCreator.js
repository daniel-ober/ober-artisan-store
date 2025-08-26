import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { db, storage } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import './SoundLegendVaultCreator.css';
import SoundPrismSection from './SoundPrismSection';

const FALLBACK_HERO = '/fallback-images/images-coming-soon-regular.png';
const DOC_ID_REGEX = /^SL-\d{3}$/; // e.g., SL-003
const MAX_IMAGES = 9;

const emptyLinks = {
  facebook: '',
  instagram: '',
  youtube: '',
  spotify: '',
  itunes: '',
};
const emptySpecs = {
  bearingEdges: '',
  finish: '',
  hardware: '',
  shell: '',
  size: '',
  snareWires: '',
  // NEW
  fundamentalPitch: '', // e.g., "A2 (110 Hz)"
  legacyTuningNotes: '', // freeform blurb about the reference tuning
};

export default function SoundLegendVaultCreator({ prefillId = '' }) {
  // --- ID / doc
  const [serial3, setSerial3] = useState('');
  const docId = useMemo(
    () => `SL-${String(serial3 || '').padStart(3, '0')}`,
    [serial3]
  );

  // --- Form fields
  const [name, setName] = useState('');
  const [links, setLinks] = useState({ ...emptyLinks });
  const [specs, setSpecs] = useState({ ...emptySpecs });
  const [story, setStory] = useState('');

  // --- Gallery (local preview + persisted URLs)
  // item: { id, file?, url, isHero? }
  const [gallery, setGallery] = useState([]);
  const [existingHeroUrl, setExistingHeroUrl] = useState('');

  // --- Audio samples
  // row: { id, title, description, url, file?, cueStart, cueEnd, storagePath?, visible, variant? }
  const [audioSamples, setAudioSamples] = useState([]);

  // queue of storage paths to delete after successful Save()
  const [audioDeleteQueue, setAudioDeleteQueue] = useState([]);

  // immediate delete state
  const [deletingIdx, setDeletingIdx] = useState(null);

  // misc
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const fileInputRef = useRef(null);

  // --- helpers
  const remainingSlots = Math.max(0, MAX_IMAGES - gallery.length);

  const onChangeDigits = (val) => {
    const digits = String(val).replace(/\D/g, '').slice(0, 3);
    setSerial3(digits);
  };

  const addGalleryFiles = (files) => {
    const incoming = Array.from(files || []);
    const toAdd = incoming.slice(0, remainingSlots).map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      file,
      url: URL.createObjectURL(file),
      isHero: false,
    }));
    setGallery((g) => [...g, ...toAdd]);
  };
  const onPickGallery = (e) => addGalleryFiles(e.target.files);

  // drag sort
  const dragItemIndex = useRef(null);
  const onDragStart = (idx) => (e) => {
    dragItemIndex.current = idx;
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    const from = dragItemIndex.current;
    if (from === null || from === idx) return;
    setGallery((items) => {
      const copy = [...items];
      const [moved] = copy.splice(from, 1);
      copy.splice(idx, 0, moved);
      return copy;
    });
    dragItemIndex.current = null;
  };

  const removeGalleryItem = (idx) =>
    setGallery((g) => {
      const wasHero = g[idx]?.isHero;
      const next = g.filter((_, i) => i !== idx);
      return wasHero ? next.map((it) => ({ ...it, isHero: false })) : next;
    });

  const moveUp = (idx) =>
    setGallery((g) => {
      if (idx === 0) return g;
      const c = [...g];
      [c[idx - 1], c[idx]] = [c[idx], c[idx - 1]];
      return c;
    });

  const moveDown = (idx) =>
    setGallery((g) => {
      if (idx === g.length - 1) return g;
      const c = [...g];
      [c[idx + 1], c[idx]] = [c[idx], c[idx + 1]];
      return c;
    });

  const setAsHero = (idx) =>
    setGallery((g) => g.map((it, i) => ({ ...it, isHero: i === idx })));

  const updateLink = (key, val) => setLinks((l) => ({ ...l, [key]: val }));
  const updateSpec = (key, val) => setSpecs((s) => ({ ...s, [key]: val }));

  // --- AUDIO: row ops
  const addEmptyAudioRow = () => {
    setAudioSamples((rows) => [
      ...rows,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: '',
        description: '',
        url: '',
        cueStart: '',
        cueEnd: '',
        storagePath: '',
        visible: true,
        variant: 'other', // NEW (legacy | adjacent-low | adjacent-high | other)
      },
    ]);
  };

  const removeAudioRow = (idx) =>
    setAudioSamples((rows) => {
      const row = rows[idx];
      if (row?.storagePath) {
        // schedule the current blob for deletion on Save
        setAudioDeleteQueue((q) => [...q, row.storagePath]);
      }
      return rows.filter((_, i) => i !== idx);
    });

  const moveAudioUp = (idx) =>
    setAudioSamples((rows) => {
      if (idx === 0) return rows;
      const copy = [...rows];
      [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
      return copy;
    });

  const moveAudioDown = (idx) =>
    setAudioSamples((rows) => {
      if (idx === rows.length - 1) return rows;
      const copy = [...rows];
      [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
      return copy;
    });

  const updateAudioField = (idx, key, val) =>
    setAudioSamples((rows) => {
      const copy = [...rows];
      copy[idx] = { ...copy[idx], [key]: val };
      return copy;
    });

  // immediate delete (Storage + Firestore) for a specific row
  const trimAudioForFirestore = (a) => ({
    title: a.title?.trim() || '',
    description: a.description?.trim() || '',
    url: a.url || '',
    storagePath: a.storagePath || '',
    cueStart: Number(a.cueStart || 0),
    cueEnd: Number(a.cueEnd || 0),
    visible: a.visible !== false,
    variant: a.variant || 'other',
  });

  const deleteAudioNow = async (idx) => {
    const row = audioSamples[idx];
    if (!row) return;
    const label = row.title || `Sample ${idx + 1}`;
    if (
      !window.confirm(
        `Delete "${label}" now?\n\nThis will remove the file from Storage (if any) and update Firestore immediately.`
      )
    ) {
      return;
    }

    setDeletingIdx(idx);
    try {
      if (row.storagePath) {
        try {
          await deleteObject(ref(storage, row.storagePath));
        } catch (e) {
          console.warn('Storage delete failed (continuing):', e);
        }
      }

      const next = audioSamples.filter((_, i) => i !== idx);
      setAudioSamples(next);

      await setDoc(
        doc(db, 'soundlegend_showroom', docId),
        { audioSamples: next.map(trimAudioForFirestore) },
        { merge: true }
      );

      alert('Audio deleted.');
    } catch (err) {
      console.error(err);
      alert(`Delete failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setDeletingIdx(null);
    }
  };

  // --- validation, upload helpers
  const validate = () => {
    const errors = [];
    if (!DOC_ID_REGEX.test(docId))
      errors.push('ID must match format SL-000 (e.g., SL-007).');
    if (!serial3 || serial3.length !== 3)
      errors.push('Enter the 3 digits for the ID.');
    if (!name.trim()) errors.push('Legacy artist name is required.');
    if (gallery.length > MAX_IMAGES)
      errors.push(`Gallery can contain up to ${MAX_IMAGES} images.`);
    return errors;
  };

  const uploadToStorage = async (path, file) => {
    const r = ref(storage, path);
    await uploadBytes(r, file, { contentType: file.type || undefined });
    return await getDownloadURL(r);
  };

  // --- SAVE
  const save = async () => {
    const errors = validate();
    if (errors.length) {
      alert('Please fix the following:\n\n' + errors.join('\n'));
      return;
    }

    setSaving(true);
    try {
      // sanity write (perm check)
      try {
        await setDoc(
          doc(db, '__sanity_checks', 'can_write'),
          { t: Date.now() },
          { merge: true }
        );
      } catch {
        alert(
          'Firestore write blocked (rules/auth). Are you signed in as admin?'
        );
        return;
      }

      // 1) Gallery upload
      const uploadedUrls = [];
      const heroIndex = gallery.findIndex((g) => g.isHero);

      for (let i = 0; i < gallery.length; i++) {
        const item = gallery[i];
        if (item.file) {
          const safeName =
            item.file.name?.replace(/\s+/g, '_') ||
            `image_${Date.now()}_${i}.jpg`;
          const url = await uploadToStorage(
            `soundlegend_showroom/${docId}/gallery/${i}-${safeName}`,
            item.file
          );
          uploadedUrls.push(url);
        } else {
          uploadedUrls.push(item.url);
        }
      }

      let heroImageUrl;
      if (heroIndex >= 0) heroImageUrl = uploadedUrls[heroIndex] || null;
      else if (existingHeroUrl && uploadedUrls.includes(existingHeroUrl))
        heroImageUrl = existingHeroUrl;
      else if (uploadedUrls.length > 0) heroImageUrl = uploadedUrls[0];
      else heroImageUrl = FALLBACK_HERO;

      // 2) Audio upload + replacement queue
      const uploadedAudio = [];
      const localDeleteQueue = [...audioDeleteQueue]; // rows removed with pending blobs

      for (let i = 0; i < audioSamples.length; i++) {
        const row = audioSamples[i];
        let finalUrl = row.url?.trim() || '';
        let storagePath = row.storagePath || '';

        if (row.file) {
          // if replacing, queue old blob for deletion
          if (row.storagePath) localDeleteQueue.push(row.storagePath);

          const ext = (row.file.name?.split('.').pop() || 'wav').toLowerCase();
          const safe =
            row.file.name?.replace(/\s+/g, '_') ||
            `sample_${Date.now()}_${i}.${ext}`;
          const path = `soundlegend_showroom/${docId}/audio/${i}-${safe}`;
          const r = ref(storage, path);
          await uploadBytes(r, row.file, {
            contentType: row.file.type || `audio/${ext}`,
          });
          finalUrl = await getDownloadURL(r);
          storagePath = path;
        }

        uploadedAudio.push({
          title: row.title?.trim() || `Sample ${i + 1}`,
          description: row.description?.trim() || '',
          url: finalUrl,
          storagePath,
          cueStart: Number(row.cueStart || 0),
          cueEnd: Number(row.cueEnd || 0),
          visible: row.visible !== false,
          variant: row.variant || 'other',
        });
      }

      // 3) Write Firestore (note the NEW specs fields)
      const payload = {
        heroImage: heroImageUrl || FALLBACK_HERO,
        gallery: uploadedUrls,
        links: {
          facebook: links.facebook?.trim() || '',
          instagram: links.instagram?.trim() || '',
          youtube: links.youtube?.trim() || '',
          spotify: links.spotify?.trim() || '',
          itunes: links.itunes?.trim() || '',
        },
        name: name.trim(),
        specs: {
          bearingEdges: specs.bearingEdges?.trim() || '',
          finish: specs.finish?.trim() || '',
          hardware: specs.hardware?.trim() || '',
          shell: specs.shell?.trim() || '',
          size: specs.size?.trim() || '',
          snareWires: specs.snareWires?.trim() || '',
          fundamentalPitch: specs.fundamentalPitch?.trim() || '',
          legacyTuningNotes: specs.legacyTuningNotes?.trim() || '',
        },
        story: story || '',
        audioSamples: uploadedAudio,
      };

      await setDoc(doc(db, 'soundlegend_showroom', docId), payload, {
        merge: true,
      });

      // 4) After successful write, delete queued blobs
      for (const p of localDeleteQueue) {
        try {
          await deleteObject(ref(storage, p));
        } catch (e) {
          console.warn('Could not delete old audio blob:', p, e);
        }
      }
      setAudioDeleteQueue([]);

      alert(`Saved ✅  Document ID: ${docId}`);

      // 5) Normalize local state
      setGallery(
        uploadedUrls.map((url, i) => ({
          id: `${Date.now()}-${i}`,
          url,
          isHero: url === (heroImageUrl || FALLBACK_HERO),
        }))
      );
      setExistingHeroUrl(heroImageUrl || FALLBACK_HERO);
      setAudioSamples(uploadedAudio);
    } catch (err) {
      console.error(err);
      alert(`Save failed: ${err?.message || 'Unknown error'}. See console.`);
    } finally {
      setSaving(false);
    }
  };

  // --- Load existing
  const fetchAndPopulate = useCallback(async (id) => {
    if (!/^(SL-\d{3})$/i.test(id)) {
      alert('Enter a valid ID (e.g., SL-003) to load.');
      return;
    }
    setLoadingExisting(true);
    try {
      const snap = await getDoc(doc(db, 'soundlegend_showroom', id));
      if (!snap.exists()) {
        alert(
          `No existing document found. You can create it with Save. (${id})`
        );
        return;
      }
      const data = snap.data();

      setName(data.name || '');
      setLinks({ ...emptyLinks, ...(data.links || {}) });
      // merge NEW spec fields safely
      setSpecs({ ...emptySpecs, ...(data.specs || {}) });
      setStory(data.story || '');

      const hero = data.heroImage || '';
      setExistingHeroUrl(hero);

      const gal = Array.isArray(data.gallery)
        ? data.gallery.map((url, i) => ({
            id: `${Date.now()}-${i}`,
            url,
            isHero: url === hero,
          }))
        : [];
      setGallery(gal);

      const incoming = Array.isArray(data.audioSamples)
        ? data.audioSamples
        : [];
      setAudioSamples(
        incoming.map((a, i) => ({
          id: `${Date.now()}-${i}`,
          title: a.title || '',
          description: a.description || '',
          url: a.url || '',
          storagePath: a.storagePath || '',
          cueStart: a.cueStart ?? '',
          cueEnd: a.cueEnd ?? '',
          visible: a.visible !== false,
          variant: a.variant || 'other',
        }))
      );

      const m = id.match(/^SL-(\d{3})$/i);
      if (m) setSerial3(m[1]);
    } catch (e) {
      console.error(e);
      alert('Failed to load existing doc.');
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  const loadExisting = useCallback(async () => {
    await fetchAndPopulate(docId);
  }, [docId, fetchAndPopulate]);

  useEffect(() => {
    if (!prefillId) return;
    const m = String(prefillId)
      .toUpperCase()
      .match(/^SL-(\d{3})$/);
    if (m) {
      setSerial3(m[1]);
      Promise.resolve().then(() => fetchAndPopulate(`SL-${m[1]}`));
    }
  }, [prefillId, fetchAndPopulate]);

  // --- clear form
  const clearForm = () => {
    setName('');
    setLinks({ ...emptyLinks });
    setSpecs({ ...emptySpecs });
    setStory('');
    setGallery([]);
    setExistingHeroUrl('');
    setSerial3('');
    setAudioSamples([]);
    setAudioDeleteQueue([]);
  };

  // --- Derived hero preview
  const heroPreviewUrl = useMemo(() => {
    const selected = gallery.find((g) => g.isHero)?.url;
    if (selected) return selected;
    if (existingHeroUrl && gallery.some((g) => g.url === existingHeroUrl))
      return existingHeroUrl;
    return FALLBACK_HERO;
  }, [gallery, existingHeroUrl]);

  // --- render
  return (
    <div className="slvc">
      <h1>SoundLegend Vault — Create/Update Showroom</h1>

      {/* ID */}
      <div className="slvc-card">
        <label className="slvc-label">
          Document ID <span className="slvc-label-muted">(format SL-000)</span>
        </label>

        <div className="slvc-row">
          <div className="slvc-idGroup">
            <span className="slvc-prefix">SL-</span>
            <input
              className="slvc-input slvc-digits"
              value={serial3}
              onChange={(e) => onChangeDigits(e.target.value)}
              placeholder="000"
              inputMode="numeric"
              pattern="\d{3}"
              maxLength={3}
              aria-label="SL digits"
            />
          </div>

          <div className="slvc-row slvc-row--gap">
            <button
              className="slvc-btn"
              onClick={loadExisting}
              disabled={loadingExisting || serial3.length !== 3}
            >
              {loadingExisting ? 'Loading…' : 'Load Existing'}
            </button>
            <button className="slvc-btnGhost" onClick={clearForm}>
              Clear Form
            </button>
          </div>
        </div>

        <div className="slvc-hint">
          Tip: enter only the 3 digits. Full ID will be{' '}
          <code>{docId || 'SL-000'}</code>.
        </div>
      </div>

      {/* Hero */}
      <div className="slvc-card">
        <h2>Hero Image</h2>
        <div className="slvc-hero">
          <div className="slvc-heroPreview">
            {heroPreviewUrl ? (
              <img
                src={heroPreviewUrl}
                alt="hero preview"
                className="slvc-heroImg"
              />
            ) : (
              <div className="slvc-heroFallback">
                <div>Using fallback:</div>
                <code>{FALLBACK_HERO}</code>
              </div>
            )}
          </div>
          <div className="slvc-hint">
            The hero is chosen from your gallery below. Click “Set as Hero” on
            any image to change it.
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="slvc-card">
        <h2>
          Gallery{' '}
          <span className="slvc-label-muted">
            (up to {MAX_IMAGES}, drag to sort)
          </span>
        </h2>

        <div className="slvc-row slvc-row--gap">
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={onPickGallery}
            disabled={remainingSlots === 0}
          />
          <div className="slvc-hint">
            {remainingSlots > 0
              ? `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} remaining`
              : `Max ${MAX_IMAGES} images reached`}
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="slvc-empty">No images yet. Add some above.</div>
        ) : (
          <div className="slvc-galleryGrid">
            {gallery.map((item, idx) => (
              <div
                key={item.id}
                className="slvc-galleryItem"
                draggable
                onDragStart={onDragStart(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('drag-over');
                }}
                onDragLeave={(e) =>
                  e.currentTarget.classList.remove('drag-over')
                }
                onDrop={(e) => {
                  e.currentTarget.classList.remove('drag-over');
                  onDrop(idx)(e);
                }}
                title="Drag to reorder"
              >
                <img
                  src={item.url}
                  alt={`gallery ${idx + 1}`}
                  className="slvc-galleryImg"
                />
                <div className="slvc-galleryControls">
                  <button className="slvc-btnSm" onClick={() => moveUp(idx)}>
                    ↑
                  </button>
                  <div className="slvc-index">{idx + 1}</div>
                  <button className="slvc-btnSm" onClick={() => moveDown(idx)}>
                    ↓
                  </button>
                </div>

                <div
                  className="slvc-galleryActions"
                  style={{ display: 'flex', gap: 8, padding: 8 }}
                >
                  <button
                    className={`slvc-btnSm ${item.isHero ? 'slvc-btnPrimary' : ''}`}
                    onClick={() => setAsHero(idx)}
                  >
                    {item.isHero ? 'Hero ✓' : 'Set as Hero'}
                  </button>
                  <button
                    className="slvc-removeBtn"
                    onClick={() => removeGalleryItem(idx)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="slvc-card">
        <label className="slvc-label">Legacy Artist Name</label>
        <input
          className="slvc-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Rick Ressner"
        />
      </div>

      {/* Links */}
      <div className="slvc-card">
        <h2>
          Artist Links <span className="slvc-label-muted">(optional)</span>
        </h2>
        <div className="slvc-grid2">
          <LabeledInput
            label="Facebook"
            value={links.facebook}
            onChange={(v) => updateLink('facebook', v)}
          />
          <LabeledInput
            label="Instagram"
            value={links.instagram}
            onChange={(v) => updateLink('instagram', v)}
          />
          <LabeledInput
            label="YouTube"
            value={links.youtube}
            onChange={(v) => updateLink('youtube', v)}
          />
          <LabeledInput
            label="Spotify"
            value={links.spotify}
            onChange={(v) => updateLink('spotify', v)}
          />
          <LabeledInput
            label="iTunes"
            value={links.itunes}
            onChange={(v) => updateLink('itunes', v)}
          />
        </div>
      </div>

      {/* Specs */}
      <div className="slvc-card">
        <h2>Specs</h2>
        <div className="slvc-grid2">
          <LabeledInput
            label="Bearing Edges"
            value={specs.bearingEdges}
            onChange={(v) => updateSpec('bearingEdges', v)}
            placeholder="e.g., 45° Inner / Rounded Outer"
          />
          <LabeledInput
            label="Finish"
            value={specs.finish}
            onChange={(v) => updateSpec('finish', v)}
            placeholder="e.g., Mappa Burl Poly Gloss"
          />
          <LabeledInput
            label="Hardware"
            value={specs.hardware}
            onChange={(v) => updateSpec('hardware', v)}
            placeholder="e.g., Brass/Gold Diecast Hoops, Vintage Tube Lugs"
          />
          <LabeledInput
            label="Shell"
            value={specs.shell}
            onChange={(v) => updateSpec('shell', v)}
            placeholder="e.g., Birch + Cherry Stave"
          />
          <LabeledInput
            label="Size"
            value={specs.size}
            onChange={(v) => updateSpec('size', v)}
            placeholder="e.g., 14x5"
          />
          <LabeledInput
            label="Snare Wires"
            value={specs.snareWires}
            onChange={(v) => updateSpec('snareWires', v)}
            placeholder="e.g., Puresound Custom 20-strand"
          />
          {/* NEW fields */}
          <LabeledInput
            label="Fundamental Pitch"
            value={specs.fundamentalPitch}
            onChange={(v) => updateSpec('fundamentalPitch', v)}
            placeholder="e.g., A2 (110 Hz)"
          />
          <LabeledInput
            label="Legacy Tuning Notes"
            value={specs.legacyTuningNotes}
            onChange={(v) => updateSpec('legacyTuningNotes', v)}
            placeholder="Short blurb about the drum’s reference tuning"
          />
        </div>
      </div>

      {/* AUDIO */}
      <div className="slvc-card">
        <h2>
          Audio Samples <span className="slvc-label-muted">(optional)</span>
        </h2>
        <div className="slvc-hint">
          Mark which clip represents the drum’s <b>Legacy</b> (reference)
          tuning. Others can be adjacent (low/high) or miscellaneous.
        </div>

        {audioSamples.length === 0 ? (
          <div className="slvc-empty">
            No audio yet. Click “+ Add Audio Sample”.
          </div>
        ) : null}

        {audioSamples.map((row, idx) => (
          <div key={row.id} className="slvc-audioRow">
            <div className="slvc-grid2">
              <div className="slvc-field">
                <label className="slvc-label">Title</label>
                <input
                  className="slvc-input"
                  value={row.title}
                  onChange={(e) =>
                    updateAudioField(idx, 'title', e.target.value)
                  }
                  placeholder={`e.g., Legacy Tuning — Rimshots (${idx + 1})`}
                />
              </div>

              {/* NEW: Variant */}
              <div className="slvc-field">
                <label className="slvc-label">Variant</label>
                <select
                  className="slvc-input"
                  value={row.variant || 'other'}
                  onChange={(e) =>
                    updateAudioField(idx, 'variant', e.target.value)
                  }
                >
                  <option value="legacy">Legacy (reference)</option>
                  <option value="adjacent-low">Adjacent — Low</option>
                  <option value="adjacent-high">Adjacent — High</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="slvc-grid2">
              <div className="slvc-field">
                <label className="slvc-label">Cue Start / End (seconds)</label>
                <div className="slvc-row slvc-row--gap">
                  <input
                    className="slvc-input"
                    type="number"
                    min="0"
                    value={row.cueStart}
                    onChange={(e) =>
                      updateAudioField(idx, 'cueStart', e.target.value)
                    }
                    placeholder="e.g., 12.5"
                  />
                  <input
                    className="slvc-input"
                    type="number"
                    min="0"
                    value={row.cueEnd}
                    onChange={(e) =>
                      updateAudioField(idx, 'cueEnd', e.target.value)
                    }
                    placeholder="e.g., 19.8"
                  />
                </div>
              </div>

              <div className="slvc-field">
                <label className="slvc-label">
                  Description{' '}
                  <span className="slvc-label-muted">(optional)</span>
                </label>
                <input
                  className="slvc-input"
                  value={row.description}
                  onChange={(e) =>
                    updateAudioField(idx, 'description', e.target.value)
                  }
                  placeholder="e.g., Natural rimshot crack with musical decay"
                />
              </div>
            </div>

            <div className="slvc-grid2">
              <div className="slvc-field">
                <label className="slvc-label">
                  External URL{' '}
                  <span className="slvc-label-muted">(https://…)</span>
                </label>
                <input
                  className="slvc-input"
                  value={row.url}
                  onChange={(e) => updateAudioField(idx, 'url', e.target.value)}
                  placeholder="Paste a direct audio file URL (mp3/m4a/wav)…"
                />
              </div>
              <div className="slvc-field">
                <label className="slvc-label">Or Upload File</label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    updateAudioField(idx, 'file', f); // replacement (old blob gets queued on Save)
                  }}
                />
              </div>
            </div>

            {/* controls */}
            <div className="slvc-row slvc-row--space">
              <label className="slvc-check">
                <input
                  type="checkbox"
                  checked={row.visible !== false}
                  onChange={(e) =>
                    updateAudioField(idx, 'visible', e.target.checked)
                  }
                />
                <span>Show on site</span>
              </label>

              <div className="slvc-row slvc-row--gap">
                <button
                  className="slvc-btnSm"
                  onClick={() => moveAudioUp(idx)}
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <div className="slvc-index">#{idx + 1}</div>
                <button
                  className="slvc-btnSm"
                  onClick={() => moveAudioDown(idx)}
                  disabled={idx === audioSamples.length - 1}
                >
                  ↓
                </button>

                {/* Remove locally (deletes blob on Save) */}
                <button
                  className="slvc-removeBtn"
                  onClick={() => removeAudioRow(idx)}
                >
                  Delete
                </button>

                {/* Delete Storage + Firestore immediately */}
                <button
                  className="slvc-removeBtn"
                  onClick={() => deleteAudioNow(idx)}
                  disabled={deletingIdx === idx}
                  title={
                    row.storagePath
                      ? 'Delete file from Storage and Firestore now'
                      : 'Remove from Firestore now'
                  }
                >
                  {deletingIdx === idx ? 'Deleting…' : 'Delete Now'}
                </button>
              </div>
            </div>

            <div className="slvc-audioHr" />
          </div>
        ))}

        <div className="slvc-actions">
          <button className="slvc-btn" type="button" onClick={addEmptyAudioRow}>
            + Add Audio Sample
          </button>
        </div>
      </div>

      {/* SoundPRISM */}
      <div className="slvc-card">
        <h2>SoundPRISM™ (admin-only)</h2>
        <div className="slvc-hint">
          Compute tuning sweet-spots from this drum’s fundamentals & build
          details, then publish a frozen snapshot for the showroom.
        </div>
        <SoundPrismSection docId={docId} specs={specs} />
      </div>

      {/* Actions */}
      <div className="slvc-actions">
        <button
          className="slvc-btnPrimary"
          onClick={save}
          disabled={saving || !DOC_ID_REGEX.test(docId)}
        >
          {saving ? 'Saving…' : 'Save to Firestore'}
        </button>
      </div>
    </div>
  );
}

/* helper */
function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <div className="slvc-field">
      <label className="slvc-label">{label}</label>
      <input
        className="slvc-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
