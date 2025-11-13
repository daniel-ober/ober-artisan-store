import React from 'react';
import './ScopeOfWork.css';

/**
 * Safely pull a scalar (string/number) from project/specs by trying
 * a list of candidate paths. If value is an object (like { checklist }),
 * we NEVER render it — we return "—" instead.
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

const ScopeOfWork = ({ project }) => {
  if (!project) {
    return (
      <div className="slp-card">
        <h3>Scope of Work</h3>
        <p className="slp-muted">No project selected.</p>
      </div>
    );
  }

  // -------- Identity / line info --------
  const line = getScalar(project, ['artisanLine', 'specs.artisanLine']);

  // For drums like SL-003, lineSerial is the main serial.
  const serial = getScalar(project, [
    'lineSerial',
    'globalSerial',
    'specs.lineSerial',
    'specs.globalSerial',
  ]);

  const nickname = getScalar(project, ['nickname', 'specs.nickname']);

  // -------- Shell / geometry --------
  const diameter = getScalar(project, [
    'width', // e.g. "14\""
    'diameter',
    'specs.diameter',
    'specs.shellDiameter',
  ]);

  const depth = getScalar(project, [
    'shellDepth', // e.g. "5\""
    'depth',
    'specs.depth',
    'specs.shellDepth',
  ]);

  const staveCount = getScalar(project, [
    'staveCount', // "16"
    'specs.staveCount',
    'specs.stave_count',
  ]);

  // shellConstructionName is the clean string ("Stave")
  const shellConstruction = getScalar(project, [
    'shellConstructionName',
    'shellConstruction',
    'specs.shellConstruction',
    'specs.shellType',
  ]);

  const reinforcementRings = getScalar(project, [
    'reinforcementRings', // "None"
    'specs.reinforcementRings',
    'specs.reinforcement_rings',
  ]);

  // -------- Wood / veneer --------
  const primarySpecies = getScalar(project, [
    'woodPrimary', // "Birch"
    'woodSpecies',
    'primarySpecies',
    'specs.woodSpecies',
    'specs.primarySpecies',
  ]);

  const secondarySpeciesBase = getScalar(project, [
    'woodSecondary', // "Cherry"
    'secondarySpecies',
    'specs.secondarySpecies',
  ]);

  const secondaryPercent = getScalar(
    project,
    ['woodSecondaryPercent'], // "25"
    '—'
  );

  let secondarySpecies = '—';
  if (secondarySpeciesBase !== '—') {
    secondarySpecies =
      secondaryPercent !== '—'
        ? `${secondarySpeciesBase} (${secondaryPercent}%)`
        : secondarySpeciesBase;
  }

  const veneer = getScalar(project, [
    // You can later swap to a dedicated veneer field if you add one.
    'veneer',
    'veneerSpecies',
    'finishDetails', // "Veneer (Exotic)"
    'specs.veneer',
    'specs.veneerSpecies',
  ]);

  // -------- Bearing edges / beds --------
  const bearingEdges = getScalar(project, [
    'bearingEdge', // "45 Inner + Rounded Outer"
    'bearingEdges', // (map, safely skipped if object)
    'specs.bearingEdges',
  ]);

  const snareBedDepth = getScalar(project, [
    'snareBedDepth', // "Medium"
    'specs.snareBedDepth',
  ]);

  // -------- Hardware --------
  const lugType = getScalar(project, [
    'lugType', // "Double-end tube"
    'specs.lugType',
  ]);

  const hardwareFinish = getScalar(project, [
    'hardwareColor', // "Brass/Gold"
    'hardwareFinish',
    'specs.hardwareFinish',
    'specs.hardwareColor',
  ]);

  const hoops = getScalar(project, [
    'hoops', // "Die-Cast"
    'specs.hoops',
  ]);

  const throwOff = getScalar(project, [
    'snareThrowOff', // "Trick Percussion GS007AM (Multi-Step)"
    'throw',
    'throwOff',
    'specs.throw',
    'specs.throwOff',
  ]);

  const snareWires = getScalar(project, [
    'snareWires', // "Puresound Custom Pro (Steel)"
    'specs.snareWires',
    'specs.wires',
  ]);

  // -------- Finish --------
  const exteriorFinish = getScalar(project, [
    'exteriorFinish',
    'finishDetails', // "Veneer (Exotic)" – better than nothing
    'finish',
    'specs.finish',
    'specs.exteriorFinish',
  ]);

  const interiorFinish = getScalar(project, [
    'interiorFinish',
    'specs.interiorFinish',
  ]);

  const resinAccent = getScalar(project, [
    'resinAccent'
  ]);

  // -------- Notes --------
  const additionalNotes = getScalar(
    project,
    [
      'additionalNotes', // "mappa burl veneer, dark blue (some green)..."
      'notes',
      'specs.notes',
      'specs.additionalNotes',
    ],
    ''
  );

  // -------- Download handler for signed proposal (no fetch, no CORS issues) --------
  const handleDownloadProposal = () => {
    try {
      const arr =
        project.attachments &&
        project.attachments.build_proposal &&
        project.attachments.build_proposal.length > 0
          ? project.attachments.build_proposal
          : null;

      if (!arr) return;

      const fileUrl = arr[0].url;
      if (!fileUrl) return;

      const link = document.createElement('a');
      link.href = fileUrl;
      // Let browser decide filename; you can set a default if you want:
      // link.download = 'Signed_Build_Proposal.pdf';
      link.setAttribute('download', '');
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error triggering proposal download:', err);
    }
  };

  return (
    <div className="slp-card" data-component="ScopeOfWork">
      <h3>Scope of Work</h3>
      <p className="slp-muted">
        A high-level snapshot of how your SoundLegend is built — woods,
        geometry, edges, hardware, and finish — based on the information in your
        project.
      </p>

      {/* IDENTITY */}
      <section className="sow-section">
        <h4 className="sow-heading">Identity</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Artisan Line</span>
            <span className="sow-value">{line}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Serial</span>
            <span className="sow-value">{serial}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Nickname / Title</span>
            <span className="sow-value">{nickname || '—'}</span>
          </div>
        </div>
      </section>

      {/* SHELL / GEOMETRY */}
      <section className="sow-section">
        <h4 className="sow-heading">Shell & Geometry</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Dimensions</span>
            <span className="sow-value">
              {diameter !== '—' && depth !== '—'
                ? `${diameter} × ${depth}`
                : '—'}
            </span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Stave Count</span>
            <span className="sow-value">{staveCount}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Shell Construction</span>
            <span className="sow-value">{shellConstruction}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Reinforcement Rings</span>
            <span className="sow-value">{reinforcementRings}</span>
          </div>
        </div>
      </section>

      {/* WOOD / VENEER */}
      <section className="sow-section">
        <h4 className="sow-heading">Wood & Veneer</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Primary Species</span>
            <span className="sow-value">{primarySpecies}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Secondary / Hybrid</span>
            <span className="sow-value">{secondarySpecies}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Veneer / Top Sheet</span>
            <span className="sow-value">{veneer}</span>
          </div>
        </div>
      </section>

      {/* BEARING EDGES / SNARE BEDS */}
      <section className="sow-section">
        <h4 className="sow-heading">Edges & Snare Beds</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Bearing Edges</span>
            <span className="sow-value">{bearingEdges}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Snare Bed Depth</span>
            <span className="sow-value">{snareBedDepth}</span>
          </div>
        </div>
      </section>

      {/* HARDWARE */}
      <section className="sow-section">
        <h4 className="sow-heading">Hardware</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Lug Type</span>
            <span className="sow-value">{lugType}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Hardware Finish</span>
            <span className="sow-value">{hardwareFinish}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Hoops</span>
            <span className="sow-value">{hoops}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Throw-Off</span>
            <span className="sow-value">{throwOff}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Snare Wires</span>
            <span className="sow-value">{snareWires}</span>
          </div>
        </div>
      </section>

      {/* FINISH */}
      <section className="sow-section">
        <h4 className="sow-heading">Finish</h4>
        <div className="sow-grid">
          <div className="sow-row">
            <span className="sow-label">Exterior Finish</span>
            <span className="sow-value">{exteriorFinish}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Interior Finish</span>
            <span className="sow-value">{interiorFinish}</span>
          </div>
          <div className="sow-row">
            <span className="sow-label">Resin / Acrylic Accent</span>
            <span className="sow-value">{resinAccent}</span>
          </div>
        </div>
      </section>

      {/* NOTES */}
      <section className="sow-section">
        <h4 className="sow-heading">Additional Notes</h4>
        <div className="sow-notes">
          {additionalNotes
            ? additionalNotes
            : 'No additional build notes recorded.'}
        </div>
      </section>

      {/* SIGNED BUILD PROPOSAL */}
      <section className="sow-section">
        <h4 className="sow-heading">Signed Build Proposal</h4>

        <div className="sow-proposal">
          {project.attachments &&
          project.attachments.build_proposal &&
          project.attachments.build_proposal.length > 0 ? (
            <div className="sow-proposal-actions">
              <a
                href={project.attachments.build_proposal[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="sow-btn"
              >
                View/Download Document
              </a>
            </div>
          ) : (
            <div className="sow-proposal-empty">
              No signed proposal uploaded.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ScopeOfWork;