import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './ManageElixirBatches.css';

const ManageElixirBatches = () => {
  const [batches, setBatches] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    beeswaxOz: '',
    coconutOilOz: '',
    linseedOilOz: '',
  });
  const [newEO, setNewEO] = useState({ scent: '', drops: '' });
  const [newNote, setNewNote] = useState('');
  const [showEOInputIndex, setShowEOInputIndex] = useState(null);
  const [showNoteInputIndex, setShowNoteInputIndex] = useState(null);

  useEffect(() => {
    const fetchBatches = async () => {
      const snapshot = await getDocs(collection(db, 'elixirBatches'));
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
      setBatches(data);
    };
    fetchBatches();
  }, []);

  const handleAddBatch = async () => {
    if (!newBatch.batchNumber || !newBatch.beeswaxOz || !newBatch.coconutOilOz || !newBatch.linseedOilOz) return;

    const batch = {
      ...newBatch,
      dateCaptured: new Date().toLocaleDateString(),
      essentialOils: [],
      notes: [],
      createdAt: Timestamp.now(),
    };

    try {
      const docRef = await addDoc(collection(db, 'elixirBatches'), batch);
      setBatches([...batches, { id: docRef.id, ...batch }]);
      setNewBatch({ batchNumber: '', beeswaxOz: '', coconutOilOz: '', linseedOilOz: '' });
      alert('✅ Batch added to Firestore!');
    } catch (err) {
      console.error('❌ Error adding batch:', err);
      alert('Error saving batch to Firestore.');
    }
  };

  const handleAddEO = async (index) => {
    if (!newEO.scent || !newEO.drops) return;
    const updatedBatches = [...batches];
    updatedBatches[index].essentialOils.push(newEO);
    updatedBatches[index].essentialOils.sort((a, b) => b.drops - a.drops);
    const batchId = updatedBatches[index].id;
    await updateDoc(doc(db, 'elixirBatches', batchId), {
      essentialOils: updatedBatches[index].essentialOils,
    });
    setBatches(updatedBatches);
    setNewEO({ scent: '', drops: '' });
  };

  const handleDeleteEO = async (batchIndex, eoIndex) => {
    if (!window.confirm('Are you sure you want to delete this essential oil?')) return;
    const updatedBatches = [...batches];
    updatedBatches[batchIndex].essentialOils.splice(eoIndex, 1);
    const batchId = updatedBatches[batchIndex].id;
    await updateDoc(doc(db, 'elixirBatches', batchId), {
      essentialOils: updatedBatches[batchIndex].essentialOils,
    });
    setBatches(updatedBatches);
  };

  const handleAddNote = async (index) => {
    if (!newNote) return;
    const updatedBatches = [...batches];
    const newEntry = {
      text: newNote,
      date: new Date().toLocaleString(),
    };
    updatedBatches[index].notes.push(newEntry);
    const batchId = updatedBatches[index].id;
    await updateDoc(doc(db, 'elixirBatches', batchId), {
      notes: updatedBatches[index].notes,
    });
    setBatches(updatedBatches);
    setNewNote('');
  };

  const handleDeleteNote = async (batchIndex, noteIndex) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    const updatedBatches = [...batches];
    updatedBatches[batchIndex].notes.splice(noteIndex, 1);
    const batchId = updatedBatches[batchIndex].id;
    await updateDoc(doc(db, 'elixirBatches', batchId), {
      notes: updatedBatches[batchIndex].notes,
    });
    setBatches(updatedBatches);
  };

  const handleEditClick = (index) => {
    setEditingIndex(index);
  };

  const handleSaveBatch = async (index) => {
    const batch = batches[index];
    const batchId = batch.id;
    await updateDoc(doc(db, 'elixirBatches', batchId), {
      beeswaxOz: batch.beeswaxOz,
      coconutOilOz: batch.coconutOilOz,
      linseedOilOz: batch.linseedOilOz,
    });
    setEditingIndex(null);
  };

  const handleBatchFieldChange = (index, field, value) => {
    const updatedBatches = [...batches];
    updatedBatches[index][field] = value;
    setBatches(updatedBatches);
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="elixir-batches">
      <h2>Manage Elixir Batches</h2>

      <div className="add-batch-form">
        <input type="text" placeholder="Batch Number" value={newBatch.batchNumber} onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })} />
        <input type="number" placeholder="Beeswax (oz)" value={newBatch.beeswaxOz} onChange={(e) => setNewBatch({ ...newBatch, beeswaxOz: e.target.value })} />
        <input type="number" placeholder="Coconut Oil (oz)" value={newBatch.coconutOilOz} onChange={(e) => setNewBatch({ ...newBatch, coconutOilOz: e.target.value })} />
        <input type="number" placeholder="Linseed Oil (oz)" value={newBatch.linseedOilOz} onChange={(e) => setNewBatch({ ...newBatch, linseedOilOz: e.target.value })} />
        <button className="elixir-button" onClick={handleAddBatch}>Add Batch</button>
      </div>

      {batches.map((batch, index) => (
        <div className="batch-card" key={batch.id}>
          <h3>
            Batch #{batch.batchNumber} - {batch.dateCaptured}
            <button className="elixir-button" style={{ marginLeft: '1rem' }} onClick={() => toggleExpand(index)}>
              {expandedIndex === index ? 'Collapse' : 'Expand'}
            </button>
          </h3>

          {expandedIndex === index && (
            <>
              <button className="elixir-button" onClick={() => handleEditClick(index)}>Edit Batch</button>

              <div style={{ marginTop: '1rem' }}>
                <strong>Main Ingredients</strong>
                {editingIndex === index ? (
                  <>
                    <div className="batch-row">
                      <label>Beeswax (oz): <input value={batch.beeswaxOz} onChange={(e) => handleBatchFieldChange(index, 'beeswaxOz', e.target.value)} /></label>
                      <label>Coconut Oil (oz): <input value={batch.coconutOilOz} onChange={(e) => handleBatchFieldChange(index, 'coconutOilOz', e.target.value)} /></label>
                      <label>Linseed Oil (oz): <input value={batch.linseedOilOz} onChange={(e) => handleBatchFieldChange(index, 'linseedOilOz', e.target.value)} /></label>
                    </div>
                    <button className="elixir-button" onClick={() => handleSaveBatch(index)}>Save</button>
                  </>
                ) : (
                  <p>
                    Beeswax: {batch.beeswaxOz} oz &nbsp;&nbsp;&nbsp; Coconut Oil: {batch.coconutOilOz} oz &nbsp;&nbsp;&nbsp; Linseed Oil: {batch.linseedOilOz} oz
                  </p>
                )}
              </div>

              <div className="essential-oils-section">
                <div className="section-header">
                  <strong>Essential Oils</strong>
                  <span className="add-link" onClick={() => setShowEOInputIndex(index)}>＋</span>
                </div>
                <div className="section-body">
                  <ul>
                    {(batch.essentialOils || []).map((eo, i) => (
                      <li key={i} className="eo-item">
                        {eo.scent}: {eo.drops} drops
                        <span className="delete-link" onClick={() => handleDeleteEO(index, i)}>❌</span>
                      </li>
                    ))}
                  </ul>
                  {showEOInputIndex === index && (
                    <>
                      <input type="text" placeholder="Scent" value={newEO.scent} onChange={(e) => setNewEO({ ...newEO, scent: e.target.value })} />
                      <input type="number" placeholder="Drops" value={newEO.drops} onChange={(e) => setNewEO({ ...newEO, drops: e.target.value })} />
                      <button className="elixir-button" onClick={() => handleAddEO(index)}>Add EO</button>
                    </>
                  )}
                </div>
              </div>

              <div className="notes-section">
                <div className="section-header">
                  <strong>Founder's Notes</strong>
                  <span className="add-link" onClick={() => setShowNoteInputIndex(index)}>＋</span>
                </div>
                <div className="section-body">
                  <ul>
                    {[...(batch.notes || [])].map((note, i) => (
                      <li key={i}>
                        <span className="note-date">{note.date}</span> - {note.text}
                        <span className="delete-link" onClick={() => handleDeleteNote(index, i)}>❌</span>
                      </li>
                    ))}
                  </ul>
                  {showNoteInputIndex === index && (
                    <>
                      <textarea rows="2" placeholder="Add a note" value={newNote} onChange={(e) => setNewNote(e.target.value)} />
                      <button className="elixir-button" onClick={() => handleAddNote(index)}>Add Note</button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default ManageElixirBatches;