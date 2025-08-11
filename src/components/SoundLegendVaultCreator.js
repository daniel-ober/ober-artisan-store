import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { db, storage } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import "./SoundLegendVaultCreator.css";

const FALLBACK_HERO = "/fallback-images/images-coming-soon-regular.png";
const DOC_ID_REGEX = /^SL-\d{3}$/; // e.g., SL-000

const emptyLinks = { facebook: "", instagram: "", youtube: "", spotify: "", itunes: "" };
const emptySpecs = {
  bearingEdges: "",
  finish: "",
  hardware: "",
  shell: "",
  size: "",
  snareWires: "",
};

export default function SoundLegendVaultCreator({ prefillId = "" }) {
  // DIGITS ONLY (we display SL- prefix fixed)
  const [serial3, setSerial3] = useState("");
  const docId = useMemo(() => `SL-${String(serial3 || "").padStart(3, "0")}`, [serial3]);

  const [name, setName] = useState("");
  const [links, setLinks] = useState({ ...emptyLinks });
  const [specs, setSpecs] = useState({ ...emptySpecs });
  const [story, setStory] = useState("");

  const [heroFile, setHeroFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState("");
  const [gallery, setGallery] = useState([]); // [{id, file?, url}]

  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const fileInputRef = useRef(null);

  const remainingSlots = useMemo(() => Math.max(0, 8 - gallery.length), [gallery.length]);

  // digits only, max 3
  const onChangeDigits = (val) => {
    const digits = String(val).replace(/\D/g, "").slice(0, 3);
    setSerial3(digits);
  };

  const onPickHero = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setHeroFile(f);
    setHeroPreview(URL.createObjectURL(f));
  };

  const addGalleryFiles = (files) => {
    const incoming = Array.from(files || []);
    const toAdd = incoming.slice(0, 8 - gallery.length).map((file, i) => ({
      id: `${Date.now()}-${i}-${file.name}`,
      file,
      url: URL.createObjectURL(file),
    }));
    setGallery((g) => [...g, ...toAdd]);
  };

  const onPickGallery = (e) => addGalleryFiles(e.target.files);

  // drag sort
  const dragItemIndex = useRef(null);
  const onDragStart = (idx) => (e) => {
    dragItemIndex.current = idx;
    e.dataTransfer.effectAllowed = "move";
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

  const removeGalleryItem = (idx) => setGallery((g) => g.filter((_, i) => i !== idx));
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

  const updateLink = (key, val) => setLinks((l) => ({ ...l, [key]: val }));
  const updateSpec = (key, val) => setSpecs((s) => ({ ...s, [key]: val }));

  const validate = () => {
    const errors = [];
    if (!DOC_ID_REGEX.test(docId)) errors.push("ID must match format SL-000 (e.g., SL-007).");
    if (!serial3 || serial3.length !== 3) errors.push("Enter the 3 digits for the ID.");
    if (!name.trim()) errors.push("Legacy artist name is required.");
    if (gallery.length > 8) errors.push("Gallery can contain up to 8 images.");
    return errors;
  };

  const uploadToStorage = async (path, file) => {
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return await getDownloadURL(r);
  };

  const save = async () => {
    const errors = validate();
    if (errors.length) {
      alert("Please fix the following:\n\n" + errors.join("\n"));
      return;
    }

    setSaving(true);
    try {
      // quick sanity write
      try {
        await setDoc(doc(db, "__sanity_checks", "can_write"), { t: Date.now() });
      } catch (e) {
        alert("Firestore write blocked (rules/auth). Are you signed in as admin?");
        return;
      }

      // hero
      let heroUrl = FALLBACK_HERO;
      if (heroFile) {
        heroUrl = await uploadToStorage(
          `soundlegend_showroom/${docId}/hero/${heroFile.name}`,
          heroFile
        );
      }

      // gallery
      const galleryUrls = [];
      for (let i = 0; i < gallery.length; i++) {
        const item = gallery[i];
        if (item.file) {
          const url = await uploadToStorage(
            `soundlegend_showroom/${docId}/gallery/${i}-${item.file.name}`,
            item.file
          );
          galleryUrls.push(url);
        } else if (item.url?.startsWith("http")) {
          galleryUrls.push(item.url);
        }
      }

      // payload
      const payload = {
        heroImage: heroUrl || FALLBACK_HERO,
        gallery: galleryUrls,
        links: {
          facebook: links.facebook?.trim() || "",
          instagram: links.instagram?.trim() || "",
          youtube: links.youtube?.trim() || "",
          spotify: links.spotify?.trim() || "",
          itunes: links.itunes?.trim() || "",
        },
        name: name.trim(),
        specs: {
          bearingEdges: specs.bearingEdges?.trim() || "",
          finish: specs.finish?.trim() || "",
          hardware: specs.hardware?.trim() || "",
          shell: specs.shell?.trim() || "",
          size: specs.size?.trim() || "",
          snareWires: specs.snareWires?.trim() || "",
        },
        story: story || "",
      };

      await setDoc(doc(db, "soundlegend_showroom", docId), payload, { merge: true });
      alert(`Saved ✅  Document ID: ${docId}`);
    } catch (err) {
      console.error(err);
      alert(`Save failed: ${err?.message || "Unknown error"}. See console.`);
    } finally {
      setSaving(false);
    }
  };

  const fetchAndPopulate = useCallback(async (id) => {
    if (!/^(SL-\d{3})$/i.test(id)) {
      alert("Enter a valid ID (e.g., SL-003) to load.");
      return;
    }
    setLoadingExisting(true);
    try {
      const snap = await getDoc(doc(db, "soundlegend_showroom", id));
      if (!snap.exists()) {
        alert(`No existing document found. You can create it with Save. (${id})`);
        return;
      }
      const data = snap.data();
      setName(data.name || "");
      setLinks({ ...emptyLinks, ...(data.links || {}) });
      setSpecs({ ...emptySpecs, ...(data.specs || {}) });
      setStory(data.story || "");
      setHeroFile(null);
      setHeroPreview(data.heroImage || "");
      const gal = Array.isArray(data.gallery)
        ? data.gallery.map((url, i) => ({ id: `${Date.now()}-${i}`, url }))
        : [];
      setGallery(gal);

      const m = id.match(/^SL-(\d{3})$/i);
      if (m) setSerial3(m[1]);
    } catch (e) {
      console.error(e);
      alert("Failed to load existing doc.");
    } finally {
      setLoadingExisting(false);
    }
  }, []);

  const loadExisting = useCallback(async () => {
    await fetchAndPopulate(docId);
  }, [docId, fetchAndPopulate]);

  useEffect(() => {
    if (!prefillId) return;
    const m = String(prefillId).toUpperCase().match(/^SL-(\d{3})$/);
    if (m) {
      setSerial3(m[1]);
      Promise.resolve().then(() => fetchAndPopulate(`SL-${m[1]}`));
    }
  }, [prefillId, fetchAndPopulate]);

  const clearForm = () => {
    setName("");
    setLinks({ ...emptyLinks });
    setSpecs({ ...emptySpecs });
    setStory("");
    setHeroFile(null);
    setHeroPreview("");
    setGallery([]);
    setSerial3("");
  };

  return (
    <div className="slvc">
      <h1>SoundLegend Vault — Create/Update Showroom</h1>

      {/* ID + actions */}
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
              {loadingExisting ? "Loading…" : "Load Existing"}
            </button>
            <button className="slvc-btnGhost" onClick={clearForm}>Clear Form</button>
          </div>
        </div>

        <div className="slvc-hint">
          Tip: enter only the 3 digits. Full ID will be <code>{docId || "SL-000"}</code>.
        </div>
      </div>

      {/* Hero */}
      <div className="slvc-card">
        <h2>Hero Image</h2>
        <div className="slvc-hero">
          <div className="slvc-heroPreview">
            {heroPreview ? (
              <img src={heroPreview} alt="hero preview" className="slvc-heroImg" />
            ) : (
              <div className="slvc-heroFallback">
                <div>Using fallback:</div>
                <code>{FALLBACK_HERO}</code>
              </div>
            )}
          </div>

          <div>
            <input type="file" accept="image/*" onChange={onPickHero} />
            <div className="slvc-hint">If you don’t upload, we’ll store the fallback URL.</div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="slvc-card">
        <h2>
          Gallery <span className="slvc-label-muted">(up to 8, drag to sort)</span>
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
            {remainingSlots > 0 ? `${remainingSlots} slots remaining` : "Max 8 images reached"}
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
                  e.currentTarget.classList.add("drag-over");
                }}
                onDragLeave={(e) => e.currentTarget.classList.remove("drag-over")}
                onDrop={(e) => {
                  e.currentTarget.classList.remove("drag-over");
                  onDrop(idx)(e);
                }}
                title="Drag to reorder"
              >
                <img src={item.url} alt={`gallery ${idx + 1}`} className="slvc-galleryImg" />
                <div className="slvc-galleryControls">
                  <button className="slvc-btnSm" onClick={() => moveUp(idx)}>↑</button>
                  <div className="slvc-index">{idx + 1}</div>
                  <button className="slvc-btnSm" onClick={() => moveDown(idx)}>↓</button>
                </div>
                <button className="slvc-removeBtn" onClick={() => removeGalleryItem(idx)}>
                  Remove
                </button>
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
          <LabeledInput label="Facebook"  value={links.facebook}  onChange={(v) => updateLink("facebook", v)} />
          <LabeledInput label="Instagram" value={links.instagram} onChange={(v) => updateLink("instagram", v)} />
          <LabeledInput label="YouTube"   value={links.youtube}   onChange={(v) => updateLink("youtube", v)} />
          <LabeledInput label="Spotify"   value={links.spotify}   onChange={(v) => updateLink("spotify", v)} />
          <LabeledInput label="iTunes"    value={links.itunes}    onChange={(v) => updateLink("itunes", v)} />
        </div>
      </div>

      {/* Specs */}
      <div className="slvc-card">
        <h2>Specs</h2>
        <div className="slvc-grid2">
          <LabeledInput
            label="Bearing Edges"
            value={specs.bearingEdges}
            onChange={(v) => updateSpec("bearingEdges", v)}
            placeholder="e.g., 45° Inner / Rounded Outer"
          />
          <LabeledInput
            label="Finish"
            value={specs.finish}
            onChange={(v) => updateSpec("finish", v)}
            placeholder="e.g., Mappa Burl Poly Gloss"
          />
          <LabeledInput
            label="Hardware"
            value={specs.hardware}
            onChange={(v) => updateSpec("hardware", v)}
            placeholder="e.g., Brass/Gold Diecast Hoops, Vintage Tube Lugs"
          />
          <LabeledInput
            label="Shell"
            value={specs.shell}
            onChange={(v) => updateSpec("shell", v)}
            placeholder="e.g., Birch + Cherry Stave"
          />
          <LabeledInput
            label="Size"
            value={specs.size}
            onChange={(v) => updateSpec("size", v)}
            placeholder="e.g., 14x5"
          />
          <LabeledInput
            label="Snare Wires"
            value={specs.snareWires}
            onChange={(v) => updateSpec("snareWires", v)}
            placeholder="e.g., Puresound Custom 20-strand"
          />
        </div>
      </div>

      {/* Story */}
      <div className="slvc-card">
        <h2>
          Story <span className="slvc-label-muted">(HTML allowed)</span>
        </h2>
        <textarea
          className="slvc-textarea"
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder="<p>Your story...</p>"
          rows={12}
        />
        <div className="slvc-hint">
          Paste HTML (e.g., paragraphs, lists). It will be stored as-is in <code>story</code>.
        </div>
      </div>

      {/* Actions */}
      <div className="slvc-actions">
        <button
          className="slvc-btnPrimary"
          onClick={save}
          disabled={saving || !DOC_ID_REGEX.test(docId)}
        >
          {saving ? "Saving…" : "Save to Firestore"}
        </button>
      </div>
    </div>
  );
}

/* small helper control */
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