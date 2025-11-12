// src/components/SoundLegendPortal/ScopeOfWork.js
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import './ScopeOfWork.css';

/* ---------- helpers ---------- */
const val = (...candidates) => {
  for (const c of candidates) {
    if (Array.isArray(c) && c.length) return c;
    if (c !== undefined && c !== null && c !== '') return c;
  }
  return undefined;
};

const toText = (v, fallback = 'N/A') => {
  if (Array.isArray(v)) return v.filter(Boolean).join(' / ') || fallback;
  if (typeof v === 'number') return String(v);
  return v || fallback;
};

const isHybridOrStave = (name = '') =>
  /stave|hybrid/i.test(String(name || ''));

const getIdentifier = (p = {}) => {
  const serial =
    val(p.serial, p.serialNumber, p.projectSerial, p.snareSerial, p.serialId) || '';
  const line =
    val(p.series, p.artisanLine, p.productLine, p.seriesLine, p.line) || '';
  const diameter = val(p.diameter, p.width);
  const depth = val(p.depth, p.shellDepth);
  const size = diameter && depth ? ` · ${diameter}×${depth}"` : '';

  if (serial && line) return `${serial} · ${line}${size}`;
  if (serial) return `${serial}${size}`;
  if (line) return `${line}${size}`;
  return size ? size.slice(3) : '—';
};

const speciesText = (p = {}) => {
  // Try the most structured first, then fall back
  const inner = val(p.innerSpecies, p.woodInner);
  const outer = val(p.outerSpecies, p.woodOuter);
  const secondary = val(p.secondarySpecies, p.woodSecondary);
  const primary = val(p.woodPrimary, p.woodSpecies, p.species);

  // Arrays -> join; strings -> pass-through
  const parts = [];

  if (inner || outer) {
    const innerTxt = toText(inner, null);
    const outerTxt = toText(outer, null);
    if (innerTxt && outerTxt) parts.push(`${outerTxt} (outer) / ${innerTxt} (inner)`);
    else if (outerTxt) parts.push(`${outerTxt} (outer)`);
    else if (innerTxt) parts.push(`${innerTxt} (inner)`);
  }

  if (secondary) {
    parts.push(`${toText(secondary)} (secondary)`);
  }

  if (primary && parts.length === 0) {
    parts.push(toText(primary));
  }

  return parts.length ? parts.join(' · ') : 'N/A';
};

const ScopeOfWork = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const ref = doc(db, 'projects', projectId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          navigate('/not-found');
          return;
        }
        setProject({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId, navigate]);

  const derived = useMemo(() => {
    if (!project) return {};
    const diameter = val(project.diameter, project.width);
    const depth = val(project.depth, project.shellDepth);
    const line = val(project.series, project.artisanLine, project.productLine, project.seriesLine, project.line);
    const construction = val(project.shellConstructionName, project.shellConstruction);
    const staveCount = val(project.staveCount, project.staves);
    const hardwareColor = val(project.hardwareColor, project.hardwareFinish);
    const hoops = val(project.hoops, project.hoopType);
    const throwOff = val(project.snareThrowOff, project.throwOff);
    const snareWires = val(project.snareWires, project.wires);
    const bearingEdge = val(project.bearingEdge, project.bearingEdges);
    const rerings = val(project.reinforcementRings, project.reRings, project.rerings);
    const reringSpecies = val(project.reringsSpecies, project.reRingsSpecies);
    const targetThickness = val(project.targetShellThickness, project.shellThicknessTarget);

    return {
      identifier: getIdentifier(project),
      line,
      construction,
      staveCount,
      diameter,
      depth,
      species: speciesText(project),
      targetThickness,
      bearingEdge,
      hardwareColor,
      hoops,
      rerings,
      reringSpecies,
      throwOff,
      snareWires,
      finishDetails: val(project.finishDetails, project.finish, project.veneer),
      additionalNotes: val(project.additionalNotes, project.notes),
    };
  }, [project]);

  if (loading) return <div className="scope-section">Loading...</div>;
  if (!project) return <div className="scope-section">Project not found.</div>;

  const d = derived;

  return (
    <div className="scope-section">
      {/* Header chips */}
      <div className="sow-header">
        <span className="chip id-chip">🆔 {d.identifier}</span>
        {d.line && <span className="chip line-chip">✨ {d.line}</span>}
        {(d.diameter && d.depth) && (
          <span className="chip size-chip">📐 {d.diameter}×{d.depth}"</span>
        )}
      </div>

      <h2>Scope of Work</h2>

      <p><strong>Artisan Line:</strong> {toText(d.line)}</p>
      <p><strong>Shell Construction:</strong> {toText(d.construction)}</p>

      {isHybridOrStave(d.construction) && (
        <p><strong>Stave Quantity:</strong> {toText(d.staveCount)}</p>
      )}

      <p><strong>Diameter:</strong> {toText(d.diameter)}</p>
      <p><strong>Depth:</strong> {toText(d.depth)}</p>

      <p><strong>Wood Species:</strong> {toText(d.species)}</p>
      <p><strong>Target Shell Thickness:</strong> {d.targetThickness ? `${d.targetThickness} mm` : 'N/A'}</p>

      <p><strong>Bearing Edge:</strong> {toText(d.bearingEdge)}</p>
      <p><strong>Quantity Lugs:</strong> {toText(project.lugCount)}</p>
      <p><strong>Lug Type:</strong> {toText(project.lugType)}</p>
      <p><strong>Hardware Color:</strong> {toText(d.hardwareColor)}</p>
      <p><strong>Hoops:</strong> {toText(d.hoops)}</p>

      <p><strong>Reinforcement Rings:</strong> {toText(d.rerings, 'None')}</p>
      {d.rerings && String(d.rerings).toLowerCase() !== 'none' && (
        <p><strong>Re-Rings Wood Species:</strong> {toText(d.reringSpecies)}</p>
      )}

      <p><strong>Throw-off:</strong> {toText(d.throwOff)}</p>
      <p><strong>Snare Wires:</strong> {toText(d.snareWires)}</p>

      <p><strong>Snare Bed Depth:</strong> {toText(val(project.snareBedDepth, project.snareBed), 'N/A')}</p>
      <p><strong>Finish Details:</strong> {toText(d.finishDetails)}</p>
      <p><strong>Additional Notes:</strong> {toText(d.additionalNotes)}</p>
    </div>
  );
};

export default ScopeOfWork;