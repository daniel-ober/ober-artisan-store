import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  getDocs,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ManageElixirBatches.css';

const emptyBatchForm = {
  batchNumber: '',
  beeswaxOz: '',
  coconutOilOz: '',
  linseedOilOz: '',
};

const emptyEOForm = {
  scent: '',
  drops: '',
};

const formatDate = (value) => {
  if (!value) return '—';

  try {
    if (value?.toDate) return value.toDate().toLocaleString();
    if (typeof value?.seconds === 'number') {
      return new Date(value.seconds * 1000).toLocaleString();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString();
  } catch {
    return '—';
  }
};

const formatShortDate = (value) => {
  if (!value) return '—';

  try {
    if (value?.toDate) return value.toDate().toLocaleDateString();
    if (typeof value?.seconds === 'number') {
      return new Date(value.seconds * 1000).toLocaleDateString();
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleDateString();
  } catch {
    return '—';
  }
};

const toNumber = (value) => {
  const num = parseFloat(value);
  return Number.isFinite(num) ? num : 0;
};

const sortEssentialOils = (items = []) =>
  [...items].sort((a, b) => toNumber(b?.drops) - toNumber(a?.drops));

const getCreatedAtMs = (value) => {
  if (!value) return 0;
  try {
    if (value?.toDate) return value.toDate().getTime();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  } catch {
    return 0;
  }
};

const ManageElixirBatches = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingNewBatch, setSavingNewBatch] = useState(false);
  const [error, setError] = useState('');

  const [newBatch, setNewBatch] = useState(emptyBatchForm);
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [editingBatchId, setEditingBatchId] = useState(null);

  const [eoDrafts, setEoDrafts] = useState({});
  const [noteDrafts, setNoteDrafts] = useState({});
  const [showEOInputFor, setShowEOInputFor] = useState(null);
  const [showNoteInputFor, setShowNoteInputFor] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    setError('');

    try {
      const snapshot = await getDocs(collection(db, 'elixirBatches'));

      const data = snapshot.docs
        .map((docRef) => ({
          id: docRef.id,
          ...docRef.data(),
        }))
        .sort((a, b) => getCreatedAtMs(b.createdAt) - getCreatedAtMs(a.createdAt));

      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch elixir batches:', err);
      setError('Failed to load elixir batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const totals = useMemo(() => {
    const totalBatches = batches.length;

    const totalEOs = batches.reduce(
      (sum, batch) => sum + (Array.isArray(batch.essentialOils) ? batch.essentialOils.length : 0),
      0
    );

    const totalNotes = batches.reduce(
      (sum, batch) => sum + (Array.isArray(batch.notes) ? batch.notes.length : 0),
      0
    );

    return { totalBatches, totalEOs, totalNotes };
  }, [batches]);

  const handleNewBatchFieldChange = (field, value) => {
    setNewBatch((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddBatch = async () => {
    if (
      !newBatch.batchNumber.trim() ||
      newBatch.beeswaxOz === '' ||
      newBatch.coconutOilOz === '' ||
      newBatch.linseedOilOz === ''
    ) {
      alert('Please fill out all batch fields before adding.');
      return;
    }

    setSavingNewBatch(true);

    const batch = {
      batchNumber: newBatch.batchNumber.trim(),
      beeswaxOz: String(newBatch.beeswaxOz),
      coconutOilOz: String(newBatch.coconutOilOz),
      linseedOilOz: String(newBatch.linseedOilOz),
      dateCaptured: new Date().toLocaleDateString(),
      essentialOils: [],
      notes: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'elixirBatches'), batch);
      const created = { id: docRef.id, ...batch };

      setBatches((prev) => [created, ...prev]);
      setNewBatch(emptyBatchForm);
      setExpandedBatchId(docRef.id);
      alert('✅ Elixir batch added.');
    } catch (err) {
      console.error('Error adding batch:', err);
      alert('Error saving batch to Firestore.');
    } finally {
      setSavingNewBatch(false);
    }
  };

  const toggleExpand = (batchId) => {
    setExpandedBatchId((prev) => (prev === batchId ? null : batchId));
  };

  const handleEditClick = (batchId) => {
    setEditingBatchId(batchId);
    setExpandedBatchId(batchId);
  };

  const handleBatchFieldChange = (batchId, field, value) => {
    setBatches((prev) =>
      prev.map((batch) =>
        batch.id === batchId ? { ...batch, [field]: value } : batch
      )
    );
  };

  const handleSaveBatch = async (batchId) => {
    const batch = batches.find((item) => item.id === batchId);
    if (!batch) return;

    try {
      await updateDoc(doc(db, 'elixirBatches', batchId), {
        beeswaxOz: String(batch.beeswaxOz),
        coconutOilOz: String(batch.coconutOilOz),
        linseedOilOz: String(batch.linseedOilOz),
        updatedAt: Timestamp.now(),
      });

      setEditingBatchId(null);
    } catch (err) {
      console.error('Failed to save batch:', err);
      alert('Failed to save batch changes.');
    }
  };

  const handleCancelBatchEdit = async () => {
    setEditingBatchId(null);
    await fetchBatches();
  };

  const handleEODraftChange = (batchId, field, value) => {
    setEoDrafts((prev) => ({
      ...prev,
      [batchId]: {
        ...(prev[batchId] || emptyEOForm),
        [field]: value,
      },
    }));
  };

  const handleAddEO = async (batchId) => {
    const batch = batches.find((item) => item.id === batchId);
    const draft = eoDrafts[batchId] || emptyEOForm;

    if (!batch) return;
    if (!draft.scent.trim() || draft.drops === '') return;

    const nextEOs = sortEssentialOils([
      ...(Array.isArray(batch.essentialOils) ? batch.essentialOils : []),
      {
        scent: draft.scent.trim(),
        drops: String(draft.drops),
      },
    ]);

    try {
      await updateDoc(doc(db, 'elixirBatches', batchId), {
        essentialOils: nextEOs,
        updatedAt: Timestamp.now(),
      });

      setBatches((prev) =>
        prev.map((item) =>
          item.id === batchId ? { ...item, essentialOils: nextEOs } : item
        )
      );

      setEoDrafts((prev) => ({
        ...prev,
        [batchId]: emptyEOForm,
      }));
      setShowEOInputFor(null);
    } catch (err) {
      console.error('Failed to add essential oil:', err);
      alert('Failed to add essential oil.');
    }
  };

  const handleDeleteEO = async (batchId, eoIndex) => {
    if (!window.confirm('Delete this essential oil entry?')) return;

    const batch = batches.find((item) => item.id === batchId);
    if (!batch) return;

    const nextEOs = [...(batch.essentialOils || [])];
    nextEOs.splice(eoIndex, 1);

    try {
      await updateDoc(doc(db, 'elixirBatches', batchId), {
        essentialOils: nextEOs,
        updatedAt: Timestamp.now(),
      });

      setBatches((prev) =>
        prev.map((item) =>
          item.id === batchId ? { ...item, essentialOils: nextEOs } : item
        )
      );
    } catch (err) {
      console.error('Failed to delete essential oil:', err);
      alert('Failed to delete essential oil.');
    }
  };

  const handleNoteDraftChange = (batchId, value) => {
    setNoteDrafts((prev) => ({
      ...prev,
      [batchId]: value,
    }));
  };

  const handleAddNote = async (batchId) => {
    const batch = batches.find((item) => item.id === batchId);
    const draft = (noteDrafts[batchId] || '').trim();

    if (!batch || !draft) return;

    const nextNotes = [
      ...(Array.isArray(batch.notes) ? batch.notes : []),
      {
        text: draft,
        date: new Date().toLocaleString(),
      },
    ];

    try {
      await updateDoc(doc(db, 'elixirBatches', batchId), {
        notes: nextNotes,
        updatedAt: Timestamp.now(),
      });

      setBatches((prev) =>
        prev.map((item) =>
          item.id === batchId ? { ...item, notes: nextNotes } : item
        )
      );

      setNoteDrafts((prev) => ({
        ...prev,
        [batchId]: '',
      }));
      setShowNoteInputFor(null);
    } catch (err) {
      console.error('Failed to add note:', err);
      alert('Failed to add note.');
    }
  };

  const handleDeleteNote = async (batchId, noteIndex) => {
    if (!window.confirm('Delete this note?')) return;

    const batch = batches.find((item) => item.id === batchId);
    if (!batch) return;

    const nextNotes = [...(batch.notes || [])];
    nextNotes.splice(noteIndex, 1);

    try {
      await updateDoc(doc(db, 'elixirBatches', batchId), {
        notes: nextNotes,
        updatedAt: Timestamp.now(),
      });

      setBatches((prev) =>
        prev.map((item) =>
          item.id === batchId ? { ...item, notes: nextNotes } : item
        )
      );
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note.');
    }
  };

  return (
    <div className="elixir-admin-page">
      <div className="elixir-admin-hero">
        <div className="elixir-admin-hero__copy">
          <div className="elixir-admin-eyebrow">Admin Workspace</div>
          <h2>Manage Elixir Batches</h2>
          <p>
            Track each conditioning batch, preserve scent formulas, and keep a
            clean internal record of ingredient ratios and founder notes.
          </p>
        </div>

        <div className="elixir-admin-summary">
          <div className="elixir-admin-pill elixir-admin-pill--neutral">
            Batches: {totals.totalBatches}
          </div>
          <div className="elixir-admin-pill elixir-admin-pill--accent">
            EO Entries: {totals.totalEOs}
          </div>
          <div className="elixir-admin-pill elixir-admin-pill--soft">
            Notes: {totals.totalNotes}
          </div>
        </div>
      </div>

      <div className="elixir-admin-create-card">
        <div className="elixir-admin-create-card__header">
          <div>
            <h3>Create New Batch</h3>
            <p>Capture the base oil and wax ratios for a fresh elixir run.</p>
          </div>
        </div>

        <div className="elixir-admin-form-grid">
          <div className="elixir-admin-field">
            <label>Batch Number</label>
            <input
              type="text"
              placeholder="ex. 007"
              value={newBatch.batchNumber}
              onChange={(e) =>
                handleNewBatchFieldChange('batchNumber', e.target.value)
              }
            />
          </div>

          <div className="elixir-admin-field">
            <label>Beeswax (oz)</label>
            <input
              type="number"
              placeholder="0"
              value={newBatch.beeswaxOz}
              onChange={(e) =>
                handleNewBatchFieldChange('beeswaxOz', e.target.value)
              }
            />
          </div>

          <div className="elixir-admin-field">
            <label>Coconut Oil (oz)</label>
            <input
              type="number"
              placeholder="0"
              value={newBatch.coconutOilOz}
              onChange={(e) =>
                handleNewBatchFieldChange('coconutOilOz', e.target.value)
              }
            />
          </div>

          <div className="elixir-admin-field">
            <label>Linseed Oil (oz)</label>
            <input
              type="number"
              placeholder="0"
              value={newBatch.linseedOilOz}
              onChange={(e) =>
                handleNewBatchFieldChange('linseedOilOz', e.target.value)
              }
            />
          </div>
        </div>

        <div className="elixir-admin-create-card__actions">
          <button
            className="elixir-admin-btn elixir-admin-btn--primary"
            onClick={handleAddBatch}
            disabled={savingNewBatch}
          >
            {savingNewBatch ? 'Saving Batch…' : 'Add Batch'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="elixir-admin-state elixir-admin-state--loading">
          Loading elixir batches…
        </div>
      )}

      {!loading && error && (
        <div className="elixir-admin-state elixir-admin-state--error">{error}</div>
      )}

      {!loading && !error && batches.length === 0 && (
        <div className="elixir-admin-state elixir-admin-state--empty">
          No elixir batches yet.
        </div>
      )}

      {!loading &&
        !error &&
        batches.map((batch) => {
          const isExpanded = expandedBatchId === batch.id;
          const isEditing = editingBatchId === batch.id;
          const eoDraft = eoDrafts[batch.id] || emptyEOForm;
          const noteDraft = noteDrafts[batch.id] || '';

          return (
            <div className="elixir-batch-card" key={batch.id}>
              <div className="elixir-batch-card__top">
                <div className="elixir-batch-card__identity">
                  <div className="elixir-batch-card__title-row">
                    <h3>Batch #{batch.batchNumber || '—'}</h3>
                    <span className="elixir-batch-chip">
                      Captured {batch.dateCaptured || formatShortDate(batch.createdAt)}
                    </span>
                  </div>

                  <div className="elixir-batch-card__meta">
                    <span>
                      Created: {formatDate(batch.createdAt)}
                    </span>
                    <span>
                      Updated: {formatDate(batch.updatedAt || batch.createdAt)}
                    </span>
                    <span>
                      ID: <code>{batch.id}</code>
                    </span>
                  </div>
                </div>

                <div className="elixir-batch-card__actions">
                  <button
                    className="elixir-admin-btn elixir-admin-btn--secondary"
                    onClick={() => toggleExpand(batch.id)}
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="elixir-batch-card__body">
                  <div className="elixir-detail-grid">
                    <section className="elixir-detail-panel">
                      <div className="elixir-detail-panel__header">
                        <div>
                          <h4>Main Ingredients</h4>
                          <p>Base ratio for this conditioning batch.</p>
                        </div>

                        {!isEditing ? (
                          <button
                            className="elixir-admin-btn elixir-admin-btn--dark"
                            onClick={() => handleEditClick(batch.id)}
                          >
                            Edit Batch
                          </button>
                        ) : (
                          <div className="elixir-inline-actions">
                            <button
                              className="elixir-admin-btn elixir-admin-btn--primary"
                              onClick={() => handleSaveBatch(batch.id)}
                            >
                              Save
                            </button>
                            <button
                              className="elixir-admin-btn elixir-admin-btn--secondary"
                              onClick={handleCancelBatchEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="elixir-edit-grid">
                          <div className="elixir-admin-field">
                            <label>Beeswax (oz)</label>
                            <input
                              type="number"
                              value={batch.beeswaxOz}
                              onChange={(e) =>
                                handleBatchFieldChange(
                                  batch.id,
                                  'beeswaxOz',
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="elixir-admin-field">
                            <label>Coconut Oil (oz)</label>
                            <input
                              type="number"
                              value={batch.coconutOilOz}
                              onChange={(e) =>
                                handleBatchFieldChange(
                                  batch.id,
                                  'coconutOilOz',
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div className="elixir-admin-field">
                            <label>Linseed Oil (oz)</label>
                            <input
                              type="number"
                              value={batch.linseedOilOz}
                              onChange={(e) =>
                                handleBatchFieldChange(
                                  batch.id,
                                  'linseedOilOz',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="elixir-ingredient-stats">
                          <div className="elixir-stat-box">
                            <span>Beeswax</span>
                            <strong>{batch.beeswaxOz || 0} oz</strong>
                          </div>
                          <div className="elixir-stat-box">
                            <span>Coconut Oil</span>
                            <strong>{batch.coconutOilOz || 0} oz</strong>
                          </div>
                          <div className="elixir-stat-box">
                            <span>Linseed Oil</span>
                            <strong>{batch.linseedOilOz || 0} oz</strong>
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="elixir-detail-panel">
                      <div className="elixir-detail-panel__header">
                        <div>
                          <h4>Essential Oils</h4>
                          <p>Tracked by scent and total drops.</p>
                        </div>

                        <button
                          className="elixir-admin-btn elixir-admin-btn--dark"
                          onClick={() =>
                            setShowEOInputFor((prev) =>
                              prev === batch.id ? null : batch.id
                            )
                          }
                        >
                          {showEOInputFor === batch.id ? 'Close' : 'Add EO'}
                        </button>
                      </div>

                      {showEOInputFor === batch.id && (
                        <div className="elixir-inline-form">
                          <div className="elixir-admin-field">
                            <label>Scent</label>
                            <input
                              type="text"
                              placeholder="Lavender"
                              value={eoDraft.scent}
                              onChange={(e) =>
                                handleEODraftChange(batch.id, 'scent', e.target.value)
                              }
                            />
                          </div>

                          <div className="elixir-admin-field">
                            <label>Drops</label>
                            <input
                              type="number"
                              placeholder="0"
                              value={eoDraft.drops}
                              onChange={(e) =>
                                handleEODraftChange(batch.id, 'drops', e.target.value)
                              }
                            />
                          </div>

                          <div className="elixir-inline-form__actions">
                            <button
                              className="elixir-admin-btn elixir-admin-btn--primary"
                              onClick={() => handleAddEO(batch.id)}
                            >
                              Save EO
                            </button>
                          </div>
                        </div>
                      )}

                      {(batch.essentialOils || []).length === 0 ? (
                        <div className="elixir-empty-text">
                          No essential oils recorded for this batch yet.
                        </div>
                      ) : (
                        <ul className="elixir-item-list">
                          {sortEssentialOils(batch.essentialOils).map((eo, i) => (
                            <li key={`${eo.scent}-${i}`} className="elixir-item-row">
                              <div className="elixir-item-row__main">
                                <span className="elixir-item-row__title">
                                  {eo.scent || 'Unnamed Scent'}
                                </span>
                                <span className="elixir-item-row__meta">
                                  {eo.drops || 0} drops
                                </span>
                              </div>

                              <button
                                className="elixir-delete-link"
                                onClick={() => handleDeleteEO(batch.id, i)}
                              >
                                Delete
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>

                    <section className="elixir-detail-panel elixir-detail-panel--full">
                      <div className="elixir-detail-panel__header">
                        <div>
                          <h4>Founder&apos;s Notes</h4>
                          <p>Internal observations, scent impressions, or future tweaks.</p>
                        </div>

                        <button
                          className="elixir-admin-btn elixir-admin-btn--dark"
                          onClick={() =>
                            setShowNoteInputFor((prev) =>
                              prev === batch.id ? null : batch.id
                            )
                          }
                        >
                          {showNoteInputFor === batch.id ? 'Close' : 'Add Note'}
                        </button>
                      </div>

                      {showNoteInputFor === batch.id && (
                        <div className="elixir-note-compose">
                          <div className="elixir-admin-field">
                            <label>Internal Note</label>
                            <textarea
                              rows="3"
                              placeholder="Add a founder note..."
                              value={noteDraft}
                              onChange={(e) =>
                                handleNoteDraftChange(batch.id, e.target.value)
                              }
                            />
                          </div>

                          <div className="elixir-note-compose__actions">
                            <button
                              className="elixir-admin-btn elixir-admin-btn--primary"
                              onClick={() => handleAddNote(batch.id)}
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      )}

                      {(batch.notes || []).length === 0 ? (
                        <div className="elixir-empty-text">
                          No notes recorded for this batch yet.
                        </div>
                      ) : (
                        <ul className="elixir-note-list">
                          {[...(batch.notes || [])]
                            .slice()
                            .reverse()
                            .map((note, i) => (
                              <li key={`${note.date}-${i}`} className="elixir-note-item">
                                <div className="elixir-note-item__top">
                                  <span className="elixir-note-date">
                                    {note.date || '—'}
                                  </span>
                                  <button
                                    className="elixir-delete-link"
                                    onClick={() =>
                                      handleDeleteNote(
                                        batch.id,
                                        batch.notes.length - 1 - i
                                      )
                                    }
                                  >
                                    Delete
                                  </button>
                                </div>
                                <div className="elixir-note-text">
                                  {note.text || '—'}
                                </div>
                              </li>
                            ))}
                        </ul>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default ManageElixirBatches;