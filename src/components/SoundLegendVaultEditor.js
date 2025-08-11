// src/components/LegacyVaultEditor.js
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { db, storage } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import './LegacyVaultEditor.css';

/**
 * Firestore schema this component expects/writes:
 *  legacyVault/{artistId} {
 *    gallery: [{ url: string, path: string }],    // up to 9
 *    heroUrl: string|null,                        // must be one of gallery urls (or null)
 *    heroPath: string|null,                       // matching storage path (or null)
 *    updatedAt: serverTimestamp()
 *  }
 *
 * Fallback logic:
 *  - If gallery is empty OR no image marked as hero -> use fallbackHeroUrl for display only.
 *  - We do NOT persist fallback to Firestore; we just avoid clearing the stored hero unless changed.
 */

const MAX_IMAGES = 9;

export default function LegacyVaultEditor({
  artistId,
  fallbackHeroUrl,
  onSaved, // optional callback(docData)
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // gallery state stores: { url, path, isHero, _localId }
  const [gallery, setGallery] = useState([]);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [pathsToDelete, setPathsToDelete] = useState(new Set()); // storage paths scheduled for deletion

  // ----- Load existing doc -----
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const snap = await getDoc(doc(db, 'legacyVault', artistId));
        if (snap.exists()) {
          const data = snap.data();
          const currentHeroUrl = data.heroUrl || null;
          const mapped = (data.gallery || []).map((g, idx) => ({
            url: g.url,
            path: g.path,
            isHero: g.url === currentHeroUrl, // mark hero based on stored heroUrl
            _localId: `${idx}-${g.path || g.url}`,
          }));
          if (mounted) setGallery(mapped);
        } else {
          if (mounted) setGallery([]);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Failed to load artist gallery.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [artistId]);

  // ----- Derived hero image for preview -----
  const heroForPreview = useMemo(() => {
    const selected = gallery.find((g) => g.isHero);
    if (selected) return selected.url;
    // If no hero set or gallery empty, show fallback for display only
    return fallbackHeroUrl || '';
  }, [gallery, fallbackHeroUrl]);

  // ----- Handlers -----
  const handleChooseFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const slotsLeft = MAX_IMAGES - gallery.length - filesToUpload.length;
    const accepted = files.slice(0, Math.max(0, slotsLeft));
    setFilesToUpload((prev) => [...prev, ...accepted]);
    e.target.value = '';
  };

  const handleRemoveExisting = (idx) => {
    const target = gallery[idx];
    if (!target) return;
    // mark for deletion in storage upon Save (if image existed in storage)
    if (target.path) {
      setPathsToDelete((prev) => new Set(prev).add(target.path));
    }
    setGallery((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemovePending = (idx) => {
    setFilesToUpload((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSetHero = (idx, isPending = false) => {
    if (isPending) {
      // Setting hero on an image not uploaded yet:
      // First mark none as hero in gallery, then mark on pending placeholder via temp flag
      setGallery((prev) => prev.map((g) => ({ ...g, isHero: false })));
      setFilesToUpload((prev) =>
        prev.map((f, i) => ({ file: f.file || f, isHero: i === idx }))
      );
      return;
    }
    setFilesToUpload((prev) => prev.map((f) => ({ file: f.file || f, isHero: false })));
    setGallery((prev) =>
      prev.map((g, i) => ({ ...g, isHero: i === idx }))
    );
  };

  // Simple reordering (drag & drop would be nicer; this keeps it minimal + robust)
  const moveExisting = (from, to) => {
    setGallery((prev) => {
      const arr = [...prev];
      if (to < 0 || to >= arr.length) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      return arr;
    });
  };

  // ----- Upload helper -----
  const uploadBatch = async (list) => {
    // list can be File[] OR objects {file, isHero}
    const results = [];
    for (let i = 0; i < list.length; i++) {
      const entry = list[i];
      const file = entry.file || entry;
      const ext = file.name?.split('.').pop() || 'jpg';
      const ts = Date.now();
      const safeName = file.name?.replace(/\s+/g, '_') || `image_${ts}.${ext}`;
      const storagePath = `legacyVault/${artistId}/${ts}_${safeName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      results.push({
        url,
        path: storagePath,
        isHero: !!entry.isHero,
        _localId: `${ts}-${storagePath}`,
      });
    }
    return results;
  };

  // ----- Save -----
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      setError('');

      // 1) Upload pending files (respect MAX_IMAGES)
      const slotsLeft = MAX_IMAGES - gallery.length;
      const pending = filesToUpload.slice(0, Math.max(0, slotsLeft));
      const uploaded = pending.length ? await uploadBatch(pending) : [];

      // Merge gallery with newly uploaded
      const merged = [...gallery, ...uploaded];

      // 2) Ensure exactly one hero if any images exist:
      let ensured = merged;
      const hasHero = ensured.some((g) => g.isHero);
      if (!hasHero && ensured.length > 0) {
        // If no hero is explicitly set, keep previous stored hero IF it still exists in gallery
        // Otherwise, default to the first image as hero to avoid fallback unless user intends otherwise
        ensured = ensured.map((g, i) => ({ ...g, isHero: i === 0 }));
      }

      // 3) Compute hero for Firestore (or null if none)
      const hero = ensured.find((g) => g.isHero) || null;
      const heroUrl = hero?.url || null;
      const heroPath = hero?.path || null;

      // 4) Prepare gallery payload (strip local fields)
      const payloadGallery = ensured.map(({ url, path }) => ({ url, path }));

      // 5) Write to Firestore (merge so we never blow away unrelated fields)
      const vaultRef = doc(db, 'legacyVault', artistId);
      const baseDoc = {
        gallery: payloadGallery,
        heroUrl,
        heroPath,
        updatedAt: serverTimestamp(),
      };

      // If doc might not exist yet, setDoc with merge: true is safe
      await setDoc(vaultRef, baseDoc, { merge: true });

      // 6) Delete any removed images from storage (best-effort)
      if (pathsToDelete.size) {
        await Promise.all(
          Array.from(pathsToDelete).map(async (p) => {
            try {
              await deleteObject(ref(storage, p));
            } catch (e) {
              // ignore missing objects; log and continue
              console.warn('Delete skipped:', p, e?.message);
            }
          })
        );
      }

      // 7) Clear local pending + delete queue, and refresh state to ensured
      setFilesToUpload([]);
      setPathsToDelete(new Set());
      setGallery(ensured);

      // callback
      if (onSaved) {
        const docSnap = await getDoc(vaultRef);
        if (docSnap.exists()) onSaved(docSnap.data());
      }
    } catch (e) {
      console.error(e);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [artistId, filesToUpload, gallery, onSaved, pathsToDelete]);

  // ----- Render -----
  if (loading) return <div className="legacyvault-card">Loading…</div>;

  const totalCount = gallery.length + filesToUpload.length;
  const slotsRemaining = Math.max(0, MAX_IMAGES - totalCount);

  return (
    <div className="legacyvault-card">
      <div className="legacyvault-header">
        <div className="legacyvault-hero">
          {heroForPreview ? (
            <img src={heroForPreview} alt="Hero preview" />
          ) : (
            <div className="legacyvault-hero-fallback">No image</div>
          )}
          <div className="legacyvault-hero-note">
            {gallery.some((g) => g.isHero)
              ? 'Current Hero (click “Set as Hero” on any gallery image to change)'
              : 'No hero selected — fallback will be used until you set one.'}
          </div>
        </div>
        <div className="legacyvault-upload">
          <label className="legacyvault-file-label">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleChooseFiles}
              disabled={slotsRemaining === 0}
            />
            Choose Files
          </label>
          <div className="legacyvault-upload-help">
            {slotsRemaining} slot{slotsRemaining === 1 ? '' : 's'} remaining (max {MAX_IMAGES})
          </div>
        </div>
      </div>

      {!!filesToUpload.length && (
        <section className="legacyvault-section">
          <h3>Pending Uploads</h3>
          <div className="legacyvault-grid">
            {filesToUpload.map((f, i) => {
              const entry = f.file || f; // support {file, isHero} shape
              const isHeroPending = !!f.isHero;
              const url = URL.createObjectURL(entry);
              return (
                <div key={`pending-${i}`} className="legacyvault-thumb">
                  <img src={url} alt={entry.name || `pending-${i}`} />
                  <div className="legacyvault-thumb-actions">
                    <button
                      type="button"
                      onClick={() => handleSetHero(i, true)}
                      className={isHeroPending ? 'primary' : ''}
                    >
                      {isHeroPending ? 'Hero ✓' : 'Set as Hero'}
                    </button>
                    <button type="button" onClick={() => handleRemovePending(i)}>
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="legacyvault-section">
        <div className="legacyvault-section-header">
          <h3>Gallery</h3>
          <div className="legacyvault-section-sub">
            Up to {MAX_IMAGES}. Click “Set as Hero” to choose the hero image. (Existing hero is preserved unless you change it.)
          </div>
        </div>

        {gallery.length === 0 ? (
          <div className="legacyvault-empty">No images yet. Add some above.</div>
        ) : (
          <div className="legacyvault-grid">
            {gallery.map((g, i) => (
              <div key={g._localId || `${g.path}-${i}`} className="legacyvault-thumb">
                <img src={g.url} alt={`gallery-${i}`} />
                <div className="legacyvault-thumb-actions">
                  <button
                    type="button"
                    onClick={() => handleSetHero(i, false)}
                    className={g.isHero ? 'primary' : ''}
                  >
                    {g.isHero ? 'Hero ✓' : 'Set as Hero'}
                  </button>
                  <button type="button" onClick={() => handleRemoveExisting(i)}>
                    Remove
                  </button>
                </div>
                <div className="legacyvault-reorder">
                  <button type="button" onClick={() => moveExisting(i, i - 1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveExisting(i, i + 1)}
                    disabled={i === gallery.length - 1}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <div className="legacyvault-error">{error}</div>}

      <div className="legacyvault-actions">
        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}