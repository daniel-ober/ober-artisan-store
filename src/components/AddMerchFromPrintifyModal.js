import React, { useEffect, useMemo, useState } from 'react';
import './AddProductModal.css';
import { fetchPrintifyCatalog, ingestPrintifyProduct } from '../services/productService';

const FALLBACK_IMAGE_URL = 'https://i.imgur.com/eoKsILV.png';

export default function AddMerchFromPrintifyModal({ onClose, onAdded }) {
  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // pricing/flags
  const [active, setActive] = useState(true);
  const [titleOverride, setTitleOverride] = useState('');

  // new: filtering/selection
  const [showEnabledOnly, setShowEnabledOnly] = useState(true);
  const [pickedIds, setPickedIds] = useState(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { products } = await fetchPrintifyCatalog();
        setCatalog(products || []);
      } catch (e) {
        console.error(e);
        setError('Failed to load Printify catalog.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((p) => (p.title || '').toLowerCase().includes(q));
  }, [catalog, query]);

  const selected = useMemo(
    () => catalog.find((p) => p.id === selectedId) || null,
    [catalog, selectedId]
  );

  // when selected product changes, pre-select enabled variants
  useEffect(() => {
    if (!selected) {
      setPickedIds(new Set());
      return;
    }
    const enabled = (selected.variants || [])
      .filter((v) => v?.is_enabled !== false) // treat undefined as enabled
      .map((v) => String(v.id));
    setPickedIds(new Set(enabled));
  }, [selected]);

  const previewVariants = useMemo(() => {
    const list = selected?.variants || [];
    return list.filter((v) => {
      const enabled = v?.is_enabled !== false; // undefined => true
      return showEnabledOnly ? enabled : true;
    });
  }, [selected, showEnabledOnly]);

  const togglePicked = (id) => {
    const key = String(id);
    setPickedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  async function handleIngest() {
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const includeVariantIds = Array.from(pickedIds); // strings

      const { merchProduct } = await ingestPrintifyProduct({
        printifyProductId: selected.id,
        titleOverride: titleOverride || undefined,
        // margins now come from Printify; we’re not applying an extra % here
        marginPercent: 0,
        active,
        includeVariantIds,
      });

      onAdded?.(merchProduct);
      onClose?.();
      alert('✅ Added to Stripe + Firestore');
    } catch (e) {
      console.error(e);
      setError('Failed to ingest product.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-product-modal">
      <div className="modal-content">
        <h2>Add Merch from Printify</h2>
        <button className="close-btn" onClick={onClose} aria-label="Close">×</button>

        {loading ? (
          <p>Loading Printify products…</p>
        ) : (
          <>
            <input
              type="text"
              placeholder="Search by title…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: '100%', marginBottom: 12 }}
            />

            <div style={{ display: 'flex', gap: 16 }}>
              {/* left list */}
              <div style={{ flex: 1, maxHeight: 320, overflow: 'auto', border: '1px solid #ddd', borderRadius: 6 }}>
                {filtered.map((p) => {
                  const img = (p.images || []).find((i) => i.is_default) || p.images?.[0];
                  const src = img?.src || FALLBACK_IMAGE_URL;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: 10,
                        cursor: 'pointer',
                        background: selectedId === p.id ? '#eef5ff' : 'transparent',
                      }}
                    >
                      <img src={src} alt={p.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 4 }} />
                      <div style={{ fontSize: 14 }}>
                        <div style={{ fontWeight: 600 }}>{p.title}</div>
                        <div style={{ color: '#666' }}>{p.variants?.length || 0} variants</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* right details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {!selected ? (
                  <p>Select a product to review variants and set pricing.</p>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Title override (optional)"
                      value={titleOverride}
                      onChange={(e) => setTitleOverride(e.target.value)}
                      style={{ width: '100%', marginBottom: 8 }}
                    />

                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                      &nbsp;Mark active in Stripe
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={showEnabledOnly}
                          onChange={(e) => setShowEnabledOnly(e.target.checked)}
                        />
                        &nbsp;Only show enabled variants
                      </label>
                      <span style={{ color: '#666' }}>
                        {pickedIds.size} selected
                      </span>
                    </div>

                    <div style={{ marginTop: 10, borderTop: '1px solid #ddd', paddingTop: 10 }}>
                      <div style={{ fontWeight: 600, marginBottom: 6 }}>Variants preview</div>
                      <div style={{ maxHeight: 260, overflow: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
                        {previewVariants.map((v) => {
                          const baseCents =
                            typeof v.price === 'number' ? v.price :
                            typeof v.printifyPriceCents === 'number' ? v.printifyPriceCents :
                            0;
                          // we are not applying margin because you said margins are set in Printify
                          const finalCents = Math.max(50, Math.round(baseCents));

                          const checked = pickedIds.has(String(v.id));

                          return (
                            <div
                              key={v.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'auto 1fr auto',
                                alignItems: 'center',
                                gap: 8,
                                padding: 8,
                                borderBottom: '1px solid #f0f0f0',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePicked(v.id)}
                                aria-label={`Include ${v.title}`}
                              />
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {v.title}
                                {v.is_enabled === false && <span style={{ color: '#999' }}> (disabled)</span>}
                              </div>
                              <div style={{ textAlign: 'right', fontWeight: 600 }}>${(finalCents / 100).toFixed(2)}</div>
                            </div>
                          );
                        })}
                        {previewVariants.length === 0 && (
                          <div style={{ padding: 12, color: '#666' }}>No variants to show.</div>
                        )}
                      </div>
                    </div>

                    <button
                      className="add-product-btn"
                      disabled={submitting || pickedIds.size === 0}
                      onClick={handleIngest}
                      style={{ marginTop: 12 }}
                    >
                      {submitting ? 'Adding…' : 'Add to Stripe + Firestore'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {error && <div className="error-message" style={{ marginTop: 10 }}>{error}</div>}
      </div>
    </div>
  );
}