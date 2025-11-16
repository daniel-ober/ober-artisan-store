// src/components/SoundLegendPortal/ScopeOfWork.js
import React, { useEffect, useRef, useState } from 'react';
import './ScopeOfWork.css';
import { useActorContext } from '../../hooks/useActorContext';
import {
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

/**
 * Safely pull a scalar (string/number) from project/specs by trying
 * a list of candidate paths. If value is an object (like { checklist }),
 * we NEVER render it — we return fallback instead.
 */
const getScalar = (project, paths, fallback = '—') => {
  if (!project) return fallback;

  for (const path of paths) {
    const parts = path.split('.');
    let cur = project;
    let ok = true;

    for (const p of parts) {
      if (!cur || typeof cur !== 'object' || !(p in cur)) {
        ok = false;
        break;
      }
      cur = cur[p];
    }

    if (!ok || cur == null) continue;

    // Ignore non-scalar values (objects/arrays like { checklist: [...] })
    if (typeof cur === 'object') continue;

    const s = String(cur).trim();
    if (!s) continue;
    return s;
  }

  return fallback;
};

/** Build initial editable form state from the project doc. */
const buildInitialForm = (project) => {
  // Identity
  const line = getScalar(project, ['artisanLine', 'specs.artisanLine'], '');
  const serial = getScalar(
    project,
    ['lineSerial', 'globalSerial', 'specs.lineSerial', 'specs.globalSerial'],
    ''
  );

  // Geometry
  const diameterRaw = getScalar(
    project,
    ['width', 'diameter', 'specs.diameter', 'specs.shellDiameter'],
    '—'
  );
  const depthRaw = getScalar(
    project,
    ['shellDepth', 'depth', 'specs.depth', 'specs.shellDepth'],
    '—'
  );

  let defaultDimensions = '';
  if (diameterRaw !== '—' && depthRaw !== '—') {
    defaultDimensions = `${diameterRaw} × ${depthRaw}`;
  }

  const dimensions = getScalar(
    project,
    ['specs.dimensionsLabel'],
    defaultDimensions
  );

  const staveCount = getScalar(
    project,
    ['staveCount', 'specs.staveCount', 'specs.stave_count'],
    ''
  );

  const shellConstruction = getScalar(
    project,
    [
      'shellConstructionName',
      'shellConstruction',
      'specs.shellConstruction',
      'specs.shellType',
    ],
    ''
  );

  const reinforcementRings = getScalar(
    project,
    [
      'reinforcementRings',
      'specs.reinforcementRings',
      'specs.reinforcement_rings',
    ],
    ''
  );

  // Wood / Veneer
  const primarySpecies = getScalar(
    project,
    [
      'woodPrimary',
      'woodSpecies',
      'primarySpecies',
      'specs.woodSpecies',
      'specs.primarySpecies',
    ],
    ''
  );

  const secondarySpeciesBase = getScalar(
    project,
    ['woodSecondary', 'secondarySpecies', 'specs.secondarySpecies'],
    ''
  );
  const secondaryPercent = getScalar(project, ['woodSecondaryPercent'], '—');
  let secondarySpecies = secondarySpeciesBase;
  if (secondarySpeciesBase && secondaryPercent !== '—') {
    secondarySpecies = `${secondarySpeciesBase} (${secondaryPercent}%)`;
  }

  const veneer = getScalar(
    project,
    [
      'veneer',
      'veneerSpecies',
      'finishDetails',
      'specs.veneer',
      'specs.veneerSpecies',
    ],
    ''
  );

  // Edges / beds
  const bearingEdges = getScalar(
    project,
    ['bearingEdge', 'bearingEdges', 'specs.bearingEdges'],
    ''
  );
  const snareBedDepth = getScalar(
    project,
    ['snareBedDepth', 'specs.snareBedDepth'],
    ''
  );

  // Hardware
  const lugType = getScalar(project, ['lugType', 'specs.lugType'], '');
  const hardwareFinish = getScalar(
    project,
    [
      'hardwareColor',
      'hardwareFinish',
      'specs.hardwareFinish',
      'specs.hardwareColor',
    ],
    ''
  );
  const hoops = getScalar(project, ['hoops', 'specs.hoops'], '');
  const throwOff = getScalar(
    project,
    ['snareThrowOff', 'throw', 'throwOff', 'specs.throw', 'specs.throwOff'],
    ''
  );
  const snareWires = getScalar(
    project,
    ['snareWires', 'specs.snareWires', 'specs.wires'],
    ''
  );

  // Finish
  const exteriorFinish = getScalar(
    project,
    [
      'exteriorFinish',
      'finishDetails',
      'finish',
      'specs.finish',
      'specs.exteriorFinish',
    ],
    ''
  );
  const interiorFinish = getScalar(
    project,
    ['interiorFinish', 'specs.interiorFinish'],
    ''
  );
  const resinAccent = getScalar(project, ['resinAccent'], '');

  // Notes (string; allow blank)
  const additionalNotes =
    getScalar(
      project,
      ['additionalNotes', 'notes', 'specs.notes', 'specs.additionalNotes'],
      ''
    ) || '';

  return {
    line,
    serial,
    dimensions,
    staveCount,
    shellConstruction,
    reinforcementRings,
    primarySpecies,
    secondarySpecies,
    veneer,
    bearingEdges,
    snareBedDepth,
    lugType,
    hardwareFinish,
    hoops,
    throwOff,
    snareWires,
    exteriorFinish,
    interiorFinish,
    resinAccent,
    additionalNotes,
  };
};

/* ---------- picklist options ---------- */

const ARTISAN_LINES = ['SoundLegend', 'Heritage', 'Feuzon'];
const STAVE_COUNTS = ['8', '10', '12', '16', '20'];
const SHELL_CONSTRUCTIONS = ['Stave', 'Steambent', 'Hybrid'];
const YES_NO = ['Yes', 'None'];
const SNARE_BED_DEPTHS = ['Low', 'Medium', 'High'];
const HW_FINISHES = ['Chrome', 'Black Nickel', 'Brass/Gold'];
const HOOPS_OPTIONS = ['Die-cast', 'Triple flanged', 'Single flanged'];
const THROW_OFFS = ['Trick', 'DW', 'Dunnett', 'Other'];

// Human-friendly labels for audit details
const FIELD_LABELS = {
  line: 'Artisan Line',
  serial: 'Serial',
  dimensions: 'Dimensions',
  staveCount: 'Stave Count',
  shellConstruction: 'Shell Construction',
  reinforcementRings: 'Reinforcement Rings',
  primarySpecies: 'Primary Species',
  secondarySpecies: 'Secondary / Hybrid',
  veneer: 'Veneer / Top Sheet',
  bearingEdges: 'Bearing Edges',
  snareBedDepth: 'Snare Bed Depth',
  lugType: 'Lug Type',
  hardwareFinish: 'Hardware Finish',
  hoops: 'Hoops',
  throwOff: 'Throw-Off',
  snareWires: 'Snare Wires',
  exteriorFinish: 'Exterior Finish',
  interiorFinish: 'Interior Finish',
  resinAccent: 'Resin / Acrylic Accent',
  additionalNotes: 'Additional Notes',
};

const formatAuditTime = (raw) => {
  if (!raw) return '';
  try {
    // handle Firestore Timestamp, ISO string, or millis
    if (raw.toDate) return raw.toDate().toLocaleString();
    if (typeof raw === 'number') return new Date(raw).toLocaleString();
    return new Date(raw).toLocaleString();
  } catch {
    return String(raw);
  }
};

const formatUploadedDateLabel = (raw) => {
  if (!raw) return null;

  try {
    let d;

    // Firestore Timestamp
    if (raw.toDate) {
      d = raw.toDate();
    } else if (typeof raw === 'number') {
      d = new Date(raw);
    } else {
      d = new Date(raw);
    }

    if (!Number.isFinite(d.getTime())) return null;

    return d.toLocaleDateString();
  } catch {
    return null;
  }
};

const ScopeOfWork = ({ project }) => {
  const { actorIsAdmin, isImpersonating, subjectEmail, actorEmail } =
    useActorContext() || {};

  const [form, setForm] = useState(() => buildInitialForm(project));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [auditTrail, setAuditTrail] = useState(project?.scopeOfWorkAudit || []);
  const [buildProposals, setBuildProposals] = useState(
    project?.attachments?.build_proposal || []
  );

  const baselineRef = useRef(form);
  const fileInputRef = useRef(null);

  const canEdit = !!project?.id && actorIsAdmin && isImpersonating;
  const isAdminViewingOther = canEdit;

  /* ---------- sync when project changes ---------- */
  useEffect(() => {
    const nextForm = buildInitialForm(project);
    if (!isEditing) {
      setForm(nextForm);
      baselineRef.current = nextForm;
    }
    setAuditTrail(project?.scopeOfWorkAudit || []);
    setBuildProposals(project?.attachments?.build_proposal || []);
  }, [project, isEditing]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStartEdit = () => {
    if (!canEdit) return;
    baselineRef.current = buildInitialForm(project);
    setForm(baselineRef.current);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setForm(baselineRef.current || buildInitialForm(project));
  };

  const handleSave = async () => {
    if (!canEdit) return;
    if (!project?.id) {
      alert('Cannot save — missing project ID.');
      return;
    }

    setSaving(true);
    try {
      const before = baselineRef.current || {};
      const after = form || {};
      const changes = {};

      const trackChange = (key, path) => {
        const prevVal = before[key] ?? '';
        const nextVal = after[key] ?? '';
        if (prevVal === nextVal) return;
        changes[key] = { before: prevVal, after: nextVal };
        return { path, value: nextVal };
      };

      const updatePayload = {};
      const fields = [
        ['line', 'artisanLine'],
        ['serial', 'lineSerial'],
        ['nickname', 'nickname'],
        ['dimensions', 'specs.dimensionsLabel'],
        ['staveCount', 'staveCount'],
        ['shellConstruction', 'shellConstructionName'],
        ['reinforcementRings', 'reinforcementRings'],
        ['primarySpecies', 'primarySpecies'],
        ['secondarySpecies', 'secondarySpecies'],
        ['veneer', 'veneer'],
        ['bearingEdges', 'bearingEdge'],
        ['snareBedDepth', 'snareBedDepth'],
        ['lugType', 'lugType'],
        ['hardwareFinish', 'hardwareFinish'],
        ['hoops', 'hoops'],
        ['throwOff', 'snareThrowOff'],
        ['snareWires', 'snareWires'],
        ['exteriorFinish', 'exteriorFinish'],
        ['interiorFinish', 'interiorFinish'],
        ['resinAccent', 'resinAccent'],
        ['additionalNotes', 'additionalNotes'],
      ];

      for (const [key, path] of fields) {
        const tracked = trackChange(key, path);
        if (tracked) {
          updatePayload[tracked.path] = tracked.value || '';
        }
      }

      const hasFieldChanges = Object.keys(updatePayload).length > 0;

      // Build audit entry if there are any field changes
      const auditEntry = hasFieldChanges
        ? {
            ts: new Date().toISOString(),
            actor: actorEmail || 'admin',
            actorEmail: actorEmail || null,
            subjectEmail: subjectEmail || null,
            source: 'ScopeOfWork',
            type: 'fields-update',
            changes,
          }
        : null;

      const docRef = doc(db, 'projects', project.id);
      const payloadToWrite = {
        ...updatePayload,
        updatedAt: serverTimestamp(),
      };

      if (auditEntry) {
        payloadToWrite.scopeOfWorkAudit = arrayUnion(auditEntry);
      }

      if (!hasFieldChanges && !auditEntry) {
        // nothing changed
        setIsEditing(false);
        return;
      }

      await updateDoc(docRef, payloadToWrite);

      if (auditEntry) {
        setAuditTrail((prev) => [auditEntry, ...(prev || [])]);
      }

      baselineRef.current = after;
      setIsEditing(false);
      alert('Scope of Work saved.');
    } catch (err) {
      console.error('ScopeOfWork save error:', err);
      alert(
        `Sorry, there was a problem saving Scope of Work.\n\n${
          err?.message || String(err)
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Signed Build Proposal: upload / delete ---------- */

  const handleFilesSelected = async (fileList) => {
    if (!canEdit || !project?.id) return;
    const files = Array.from(fileList || []).filter(
      (f) => f.type === 'application/pdf'
    );
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadedEntries = [];

      for (const file of files) {
        const path = `projects/${project.id}/build_proposal/${file.name}`;
        const storageRef = ref(storage, path);
        await new Promise((resolve, reject) => {
          const task = uploadBytesResumable(storageRef, file);
          task.on(
            'state_changed',
            () => {},
            (err) => reject(err),
            () => resolve()
          );
        });
        const url = await getDownloadURL(storageRef);
        uploadedEntries.push({
          name: file.name,
          url,
          uploadedAt: new Date().toISOString(),
          uploadedBy: actorEmail || 'admin',
        });
      }

      const newList = [...(buildProposals || []), ...uploadedEntries];

      await updateDoc(doc(db, 'projects', project.id), {
        'attachments.build_proposal': newList,
        updatedAt: serverTimestamp(),
        scopeOfWorkAudit: arrayUnion({
          ts: new Date().toISOString(),
          actor: actorEmail || 'admin',
          actorEmail: actorEmail || null,
          subjectEmail: subjectEmail || null,
          source: 'ScopeOfWork',
          type: 'proposal-upload',
          details: {
            count: uploadedEntries.length,
            names: uploadedEntries.map((f) => f.name),
          },
        }),
      });

      setBuildProposals(newList);
    } catch (err) {
      console.error('Proposal upload error:', err);
      alert(
        `Sorry, there was a problem uploading the proposal.\n\n${
          err?.message || String(err)
        }`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length) {
      handleFilesSelected(files);
    }
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canEdit) return;
    const { files } = e.dataTransfer || {};
    if (files && files.length) {
      handleFilesSelected(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDeleteProposal = async (index) => {
    if (!canEdit || !project?.id) return;
    const item = buildProposals[index];
    if (!item) return;

    const ok = window.confirm(
      `Are you sure you want to delete this proposal?\n\n${item.name || item.url}`
    );
    if (!ok) return;

    try {
      const newList = buildProposals.filter((_, i) => i !== index);
      await updateDoc(doc(db, 'projects', project.id), {
        'attachments.build_proposal': newList,
        updatedAt: serverTimestamp(),
        scopeOfWorkAudit: arrayUnion({
          ts: new Date().toISOString(),
          actor: actorEmail || 'admin',
          actorEmail: actorEmail || null,
          subjectEmail: subjectEmail || null,
          source: 'ScopeOfWork',
          type: 'proposal-delete',
          details: {
            name: item.name || null,
            url: item.url || null,
          },
        }),
      });
      setBuildProposals(newList);
    } catch (err) {
      console.error('Proposal delete error:', err);
      alert(
        `Sorry, there was a problem deleting the proposal.\n\n${
          err?.message || String(err)
        }`
      );
    }
  };

  /* ---------- no project selected ---------- */
  if (!project) {
    return (
      <div className="slp-card" data-component="ScopeOfWork">
        <h3>Scope of Work</h3>
        {isAdminViewingOther ? (
          <p className="slp-admin-note">
            Admin view: no project is currently selected for
            {subjectEmail ? ` ${subjectEmail}` : ' this artist'}.
          </p>
        ) : (
          <p className="slp-muted">No project selected.</p>
        )}
      </div>
    );
  }

  const {
    line,
    serial,
    dimensions,
    staveCount,
    shellConstruction,
    reinforcementRings,
    primarySpecies,
    secondarySpecies,
    veneer,
    bearingEdges,
    snareBedDepth,
    lugType,
    hardwareFinish,
    hoops,
    throwOff,
    snareWires,
    exteriorFinish,
    interiorFinish,
    resinAccent,
    additionalNotes,
  } = form;

  return (
    <div className="slp-card" data-component="ScopeOfWork">
      <h3>Scope of Work</h3>
      <p className="slp-muted">
        A high-level snapshot of how your SoundLegend is built — woods,
        geometry, edges, hardware, and finish — based on the information in your
        project.
      </p>

      {isAdminViewingOther && (
        <p className="slp-admin-note">
          Admin view: you’re viewing the scope of work for
          {subjectEmail ? ` ${subjectEmail}` : ' this artist'}.
        </p>
      )}

      {canEdit && (
        <div className="sow-admin-toolbar">
          {!isEditing ? (
            <button
              type="button"
              className="sow-btn sow-btn-outline"
              onClick={handleStartEdit}
            >
              Edit Scope of Work
            </button>
          ) : (
            <>
              <button
                type="button"
                className="sow-btn sow-btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="sow-btn sow-btn-outline"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      )}

      {/* IDENTITY */}
      <section className="sow-section">
        <h4 className="sow-heading">Identity</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Artisan Line</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={line}
                onChange={(e) => handleChange('line', e.target.value)}
              >
                <option value="">—</option>
                {ARTISAN_LINES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{line || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Serial</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={serial}
                onChange={(e) => handleChange('serial', e.target.value)}
              />
            ) : (
              <span className="sow-value">{serial || '—'}</span>
            )}
          </div>
        </div>
      </section>

      {/* SHELL / GEOMETRY */}
      <section className="sow-section">
        <h4 className="sow-heading">Shell & Geometry</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Dimensions</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={dimensions}
                onChange={(e) => handleChange('dimensions', e.target.value)}
                placeholder={`e.g. 14" × 5.5"`}
              />
            ) : (
              <span className="sow-value">{dimensions || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Stave Count</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={staveCount}
                onChange={(e) => handleChange('staveCount', e.target.value)}
              >
                <option value="">—</option>
                {STAVE_COUNTS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{staveCount || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Shell Construction</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={shellConstruction}
                onChange={(e) =>
                  handleChange('shellConstruction', e.target.value)
                }
              >
                <option value="">—</option>
                {SHELL_CONSTRUCTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{shellConstruction || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Reinforcement Rings</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={reinforcementRings}
                onChange={(e) =>
                  handleChange('reinforcementRings', e.target.value)
                }
              >
                <option value="">—</option>
                {YES_NO.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{reinforcementRings || '—'}</span>
            )}
          </div>
        </div>
      </section>

      {/* WOOD / VENEER */}
      <section className="sow-section">
        <h4 className="sow-heading">Wood & Veneer</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Primary Species</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={primarySpecies}
                onChange={(e) => handleChange('primarySpecies', e.target.value)}
              />
            ) : (
              <span className="sow-value">{primarySpecies || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Secondary / Hybrid</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={secondarySpecies}
                onChange={(e) =>
                  handleChange('secondarySpecies', e.target.value)
                }
                placeholder="e.g. Cherry (25%)"
              />
            ) : (
              <span className="sow-value">{secondarySpecies || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Veneer / Top Sheet</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={veneer}
                onChange={(e) => handleChange('veneer', e.target.value)}
              />
            ) : (
              <span className="sow-value">{veneer || '—'}</span>
            )}
          </div>
        </div>
      </section>

      {/* BEARING EDGES / SNARE BEDS */}
      <section className="sow-section">
        <h4 className="sow-heading">Edges & Snare Beds</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Bearing Edges</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={bearingEdges}
                onChange={(e) => handleChange('bearingEdges', e.target.value)}
              />
            ) : (
              <span className="sow-value">{bearingEdges || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Snare Bed Depth</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={snareBedDepth}
                onChange={(e) => handleChange('snareBedDepth', e.target.value)}
              >
                <option value="">—</option>
                {SNARE_BED_DEPTHS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{snareBedDepth || '—'}</span>
            )}
          </div>
        </div>
      </section>

      {/* HARDWARE */}
      <section className="sow-section">
        <h4 className="sow-heading">Hardware</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Lug Type</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={lugType}
                onChange={(e) => handleChange('lugType', e.target.value)}
              />
            ) : (
              <span className="sow-value">{lugType || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Hardware Finish</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={hardwareFinish}
                onChange={(e) => handleChange('hardwareFinish', e.target.value)}
              >
                <option value="">—</option>
                {HW_FINISHES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{hardwareFinish || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Hoops</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={hoops}
                onChange={(e) => handleChange('hoops', e.target.value)}
              >
                <option value="">—</option>
                {HOOPS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{hoops || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Throw-Off</span>
            {isEditing && canEdit ? (
              <select
                className="sow-input"
                value={throwOff}
                onChange={(e) => handleChange('throwOff', e.target.value)}
              >
                <option value="">—</option>
                {THROW_OFFS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <span className="sow-value">{throwOff || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Snare Wires</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={snareWires}
                onChange={(e) => handleChange('snareWires', e.target.value)}
              />
            ) : (
              <span className="sow-value">{snareWires || '—'}</span>
            )}
          </div>
        </div>
      </section>

      {/* FINISH */}
      <section className="sow-section">
        <h4 className="sow-heading">Finish</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Exterior Finish</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={exteriorFinish}
                onChange={(e) => handleChange('exteriorFinish', e.target.value)}
              />
            ) : (
              <span className="sow-value">{exteriorFinish || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Interior Finish</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={interiorFinish}
                onChange={(e) => handleChange('interiorFinish', e.target.value)}
              />
            ) : (
              <span className="sow-value">{interiorFinish || '—'}</span>
            )}
          </div>
          <div className="sow-row">
            <span className="sow-label">Resin / Acrylic Accent</span>
            {isEditing && canEdit ? (
              <input
                className="sow-input"
                type="text"
                value={resinAccent}
                onChange={(e) => handleChange('resinAccent', e.target.value)}
              />
            ) : (
              <span className="sow-value">{resinAccent || '—'}</span>
            )}
          </div>
        </div>
      </section>

      {/* NOTES */}
      <section className="sow-section">
        <h4 className="sow-heading">Additional Notes</h4>
        <div className="sow-notes">
          {isEditing && canEdit ? (
            <textarea
              className="sow-textarea"
              value={additionalNotes}
              onChange={(e) => handleChange('additionalNotes', e.target.value)}
              placeholder="Any custom tweaks, artist preferences, or build notes…"
            />
          ) : additionalNotes ? (
            additionalNotes
          ) : (
            'No additional build notes recorded.'
          )}
        </div>
      </section>

      <section className="sow-section">
        <h4 className="sow-heading">Signed Build Proposal</h4>

        <div className="sow-proposal-enhanced">
          {/* PROPOSAL LIST */}
{buildProposals?.length > 0 ? (
  <div className="proposal-list">
    {buildProposals.map((file, idx) => {
      const uploadedLabel = formatUploadedDateLabel(file.uploadedAt);

      return (
        <div key={file.url || idx} className="proposal-item">
          <div className="proposal-left">
            <div className="proposal-icon">📄</div>
            <div>
              <div className="proposal-name">
                {file.name || `Proposal ${idx + 1}`}
              </div>
              {uploadedLabel && (
                <div className="proposal-meta">
                  Uploaded {uploadedLabel}
                </div>
              )}
            </div>
          </div>

          <div className="proposal-actions">
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="proposal-btn"
            >
              View / Download
            </a>

            {canEdit && (
              <button
                type="button"
                className="proposal-btn delete-btn"
                onClick={() => handleDeleteProposal(idx)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      );
    })}
  </div>
) : (
  <div className="proposal-empty-msg">
    No signed proposal uploaded.
  </div>
)}

          {/* DRAG + DROP UPLOADER */}
          {canEdit && (
            <>
              <div
                className={`proposal-dropzone ${uploading ? 'is-uploading' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="drop-icon">⬆️</span>
                <p>
                  Drag &amp; drop your PDF here
                  <br />
                  <span className="hint">or click to browse</span>
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            </>
          )}
        </div>
      </section>

      {/* AUDIT HISTORY */}
      <section className="sow-section sow-audit-section">
        <h4 className="sow-heading">Audit History</h4>
        <div className="sow-audit">
          {!auditTrail || auditTrail.length === 0 ? (
            <div className="sow-audit-empty">No admin edits recorded yet.</div>
          ) : (
            <ul className="sow-audit-list">
              {auditTrail.map((entry, idx) => (
                <li key={idx} className="sow-audit-item">
                  <div className="sow-audit-main">
                    <span className="sow-audit-actor">
                      {entry.actor || 'Admin'}
                    </span>
                    <span className="sow-audit-time">
                      {formatAuditTime(entry.ts)}
                    </span>
                  </div>
                  {entry.type === 'fields-update' ? (
                    <>
                      <div className="sow-audit-summary">
                        Updated Scope of Work fields (
                        {Object.keys(entry.changes || {}).length} field
                        {Object.keys(entry.changes || {}).length === 1
                          ? ''
                          : 's'}
                        ).
                      </div>

                      {entry.changes && (
                        <ul className="sow-audit-changes">
                          {Object.entries(entry.changes).map(
                            ([fieldKey, diff]) => (
                              <li
                                key={fieldKey}
                                className="sow-audit-change-row"
                              >
                                <span className="sow-audit-field">
                                  {FIELD_LABELS[fieldKey] || fieldKey}
                                </span>
                                <span className="sow-audit-arrow">:</span>
                                <span className="sow-audit-before">
                                  {diff.before ? `“${diff.before}”` : '—'}
                                </span>
                                <span className="sow-audit-arrow">→</span>
                                <span className="sow-audit-after">
                                  {diff.after ? `“${diff.after}”` : '—'}
                                </span>
                              </li>
                            )
                          )}
                        </ul>
                      )}
                    </>
                  ) : (
                    <div className="sow-audit-summary">
                      {entry.type === 'proposal-upload' &&
                        `Uploaded ${entry.details?.count || 0} proposal file(s).`}
                      {entry.type === 'proposal-delete' &&
                        `Deleted proposal: ${
                          entry.details?.name || 'Unnamed file'
                        }`}
                      {!entry.type &&
                        entry.type !== 'proposal-upload' &&
                        entry.type !== 'proposal-delete' &&
                        'Scope of Work updated.'}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};

export default ScopeOfWork;
