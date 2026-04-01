import React, { useState, useEffect, useMemo } from 'react';
import { collection, updateDoc, doc, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ManageProjectModal from './ManageProjectModal';
import { calculateProjectProgress } from '../utils/calculateProjectProgress';
import './ManageProjects.css';

/**
 * Canonical build phases for the NEW 10-step workflow.
 * These should match project.currentPhase values from ManageProjectModal.
 */
const buildPhases = [
  '1. Discovery & Design',
  '2. Commitment & Portal Setup',
  '3. Wood & Vision Lock-In',
  '4. Raw Shell Creation',
  '5. Shell Trueing & Torch Tune',
  '6. Exterior Art & Finish',
  '7. Edges & Snare Beds',
  '8. Hardware & Assembly',
  '9. Legacy Tuning & Media',
  '10. Final QA, Packaging & Delivery',
];

/**
 * Time aggregation keys.
 * Includes both old and new schema step keys.
 */
const stepWeights = {
  // new schema
  discoveryDesign: 1,
  commitmentPortal: 1,
  woodVisionLockIn: 1,
  rawShellCreation: 1,
  shellTrueingTorchTune: 1,
  exteriorArtFinish: 1,
  edgesSnareBeds: 1,
  hardwareAssembly: 1,
  legacyTuningMedia: 1,
  finalQAPackagingDelivery: 1,

  // legacy schema
  woodPreparation: 1,
  shellConstruction: 1,
  fineTuning: 1,
  shellExteriorFinish: 1,
  bearingEdges: 1,
  snareBedCutting: 1,
  hardwareDrilling: 1,
  tuningDetailing: 1,
  qualityCheck: 1,
};

const normalize = (str) =>
  str
    ?.toLowerCase()
    .replace(/[^a-z0-9 ]/gi, '')
    .trim()
    .replace(/\s+/g, '-') || '';

const val = (...candidates) =>
  candidates.find((v) => v !== undefined && v !== null && v !== '') ?? undefined;

const getMillis = (v) => {
  if (!v) return 0;
  try {
    if (v?.toDate) return v.toDate()?.getTime?.() || 0;
    if (typeof v?.seconds === 'number') return v.seconds * 1000;
    if (typeof v === 'number') return v;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  } catch {
    return 0;
  }
};

const formatDate = (value) => {
  const ms = getMillis(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString();
};

const formatDateTime = (value) => {
  const ms = getMillis(value);
  if (!ms) return '—';
  return new Date(ms).toLocaleString();
};

const formatHours = (seconds = 0) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const getCustomerName = (p = {}) =>
  val(
    p.customerName,
    p.customer?.name,
    p.customer?.displayName,
    p.publicPrefs?.displayName,
    p.fullName,
    p.name
  ) || 'Unknown Customer';

const getCustomerEmail = (p = {}) =>
  val(
    p.customerEmail,
    p.customer?.email,
    p.email,
    p.customer?.customerEmail
  ) || '';

const getCustomerPhone = (p = {}) =>
  val(
    p.customer?.phone,
    p.phone
  ) || '';

const getProjectIdLabel = (p = {}) => p.id || '—';

const getOrderIdLabel = (p = {}) =>
  val(p.orderId, p.parentOrderId, p.order?.id) || '—';

const getLine = (p = {}) =>
  val(p.artisanLine, p.series, p.productLine, p.line, p.seriesLine) || '—';

const getSerial = (p = {}) =>
  val(
    p.lineSerial,
    p.serial,
    p.serialNumber,
    p.projectSerial,
    p.snareSerial,
    p.serialId,
    p.globalSerial
  ) || '';

const getDiameter = (p = {}) => val(p.width, p.diameter) || '';
const getDepth = (p = {}) => val(p.shellDepth, p.depth) || '';

const getDimensions = (p = {}) => {
  const dia = getDiameter(p);
  const dep = getDepth(p);
  return dia && dep ? `${dia}×${dep}"` : '—';
};

const getStaveCount = (p = {}) =>
  val(p.staveCount, p.staveQuantity) || '—';

const getIdentifier = (p = {}) => {
  const serial = getSerial(p);
  const line = getLine(p);
  const dimensions = getDimensions(p);

  if (serial && line && dimensions !== '—') return `${serial} · ${line} · ${dimensions}`;
  if (serial && line) return `${serial} · ${line}`;
  if (serial) return serial;
  if (line && dimensions !== '—') return `${line} · ${dimensions}`;
  if (line) return line;
  return dimensions !== '—' ? dimensions : '—';
};

const getCreatedAtMillis = (p = {}) =>
  getMillis(p.startDate) || getMillis(p.createdAt) || getMillis(p.updatedAt) || 0;

const getTargetMillis = (p = {}) => {
  const explicit =
    getMillis(p.targetCompletion) ||
    getMillis(p.targetCompletionWithBuffer) ||
    getMillis(p.targetDate);

  if (explicit) return explicit;

  const createdMs = getCreatedAtMillis(p);
  return createdMs ? createdMs + 35 * 24 * 60 * 60 * 1000 : 0;
};

const getWeightedProgressPct = (data) => {
  if (!data) return 0;

  const patched = {
    ...data,
    woodPreparation: data.discoveryDesign || data.woodPreparation,
    shellConstruction: data.commitmentPortal || data.shellConstruction,
    fineTuning: data.woodVisionLockIn || data.fineTuning,
    shellExteriorFinish: data.rawShellCreation || data.shellExteriorFinish,
    bearingEdges: data.shellTrueingTorchTune || data.bearingEdges,
    snareBedCutting: data.exteriorArtFinish || data.snareBedCutting,
    hardwareDrilling: data.edgesSnareBeds || data.hardwareDrilling,
    hardwareAssembly: data.hardwareAssembly,
    tuningAndDetailing:
      data.legacyTuningMedia || data.tuningAndDetailing || data.tuningDetailing,
    qualityCheck: data.finalQAPackagingDelivery || data.qualityCheck,
  };

  const pct = calculateProjectProgress(patched);
  return Number.isFinite(Number(pct)) ? Math.round(Number(pct)) : 0;
};

const totalSecondsFromProject = (project) => {
  let total = 0;

  Object.keys(stepWeights).forEach((key) => {
    const step = project?.[key];
    if (step?.checklist?.length) {
      step.checklist.forEach((item) => {
        const v = item?.totalSeconds;
        if (typeof v === 'number') total += v;
        else if (typeof v?.seconds === 'number') total += v.seconds;
      });
    }
  });

  return total;
};

const isCompleted = (p) => {
  const pct = getWeightedProgressPct(p);
  const statusValue = String(p?.status || '').toLowerCase();
  const phaseValue = String(p?.currentPhase || '').toLowerCase();
  const stepValue = String(p?.currentStep || '').toLowerCase();

  const finishedFlag =
    statusValue === 'finished' ||
    statusValue === 'completed' ||
    p?.allStepsComplete === true ||
    stepValue === 'all steps complete' ||
    phaseValue === 'all steps complete';

  return pct >= 100 || finishedFlag;
};

const getExpectedPhase = (project) => {
  if (isCompleted(project)) return 'Completed';

  const createdAtMs = getCreatedAtMillis(project);
  if (!createdAtMs) return 'Unknown';

  const targetMs = getTargetMillis(project);
  if (!targetMs) return 'Unknown';

  const createdAt = new Date(createdAtMs);
  const target = new Date(targetMs);
  const now = new Date();

  const elapsedDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  const totalDays = (target - createdAt) / (1000 * 60 * 60 * 24);

  if (totalDays <= 0 || elapsedDays < 0) return 'Unknown';

  const progressPercent = elapsedDays / totalDays;
  const index = Math.min(
    buildPhases.length - 1,
    Math.floor(progressPercent * buildPhases.length)
  );

  return buildPhases[index] || 'Unknown';
};

const determineStatus = (project) => {
  if (isCompleted(project)) return 'Completed';

  const expectedPhase = getExpectedPhase(project);
  const expectedIndex = buildPhases.findIndex(
    (p) => normalize(p) === normalize(expectedPhase)
  );

  let actualPhaseLabel = project?.currentPhase || '';

  if (/all steps complete/i.test(actualPhaseLabel)) {
    actualPhaseLabel = buildPhases[buildPhases.length - 1];
  }

  const actualIndex = buildPhases.findIndex(
    (p) => normalize(p) === normalize(actualPhaseLabel)
  );

  if (expectedIndex === -1 || actualIndex === -1) return 'Unknown';

  const delta = actualIndex - expectedIndex;

  if (delta >= 2) return 'Ahead of Schedule';
  if (delta === 1 || delta === 0) return 'On Pace';
  if (delta === -1) return 'Slightly Behind';
  return 'Behind Schedule';
};

const isOverdue = (project) => {
  const targetMs =
    getMillis(project?.targetCompletion) ||
    getMillis(project?.targetCompletionWithBuffer);

  if (!targetMs) return false;
  if (isCompleted(project)) return false;

  return Date.now() > targetMs;
};

const statusToneClass = (statusLabel) => {
  const n = normalize(statusLabel);
  if (n === 'completed') return 'completed';
  if (n === 'ahead-of-schedule') return 'ahead-of-schedule';
  if (n === 'on-pace') return 'on-pace';
  if (n === 'slightly-behind') return 'slightly-behind';
  if (n === 'behind-schedule') return 'behind-schedule';
  return 'unknown';
};

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filterPhase, setFilterPhase] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });

  useEffect(() => {
    const q = query(collection(db, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveProjects = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setProjects(liveProjects);
    });
    return () => unsubscribe();
  }, []);

  const projectValue = (p, key) => {
    switch (key) {
      case 'customerName':
        return getCustomerName(p).toLowerCase();
      case 'identifier':
        return getIdentifier(p).toLowerCase();
      case 'projectId':
        return String(getProjectIdLabel(p)).toLowerCase();
      case 'orderId':
        return String(getOrderIdLabel(p)).toLowerCase();
      case 'createdAt':
        return getCreatedAtMillis(p);
      case 'targetCompletion':
        return getTargetMillis(p);
      case 'timeSpent':
        return totalSecondsFromProject(p);
      case 'progress':
        return getWeightedProgressPct(p);
      case 'currentPhase':
        return String(p?.currentPhase || '');
      case 'expectedPhase':
        return getExpectedPhase(p);
      case 'status':
        return determineStatus(p);
      default:
        return '';
    }
  };

  const sortProjects = (list) => {
    const { key, dir } = sort;
    const mul = dir === 'asc' ? 1 : -1;

    return [...list].sort((a, b) => {
      const va = projectValue(a, key);
      const vb = projectValue(b, key);

      if (typeof va === 'number' && typeof vb === 'number') {
        return (va - vb) * mul;
      }

      return (
        String(va).localeCompare(String(vb), undefined, {
          numeric: true,
          sensitivity: 'base',
        }) * mul
      );
    });
  };

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'createdAt' ? 'desc' : 'asc' }
    );
  };

  const renderSort = (key) => {
    if (sort.key !== key) return '↕';
    return sort.dir === 'asc' ? '▲' : '▼';
  };

  const filteredProjects = useMemo(() => {
    let out = [...projects];

    if (!showCompleted) {
      out = out.filter((p) => !isCompleted(p));
    }

    if (filterPhase) {
      out = out.filter((p) => normalize(p?.currentPhase) === filterPhase);
    }

    if (filterStatus) {
      out = out.filter((p) => normalize(determineStatus(p)) === filterStatus);
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();

      out = out.filter((p) => {
        const haystack = [
          getCustomerName(p),
          getCustomerEmail(p),
          getCustomerPhone(p),
          getIdentifier(p),
          getProjectIdLabel(p),
          getOrderIdLabel(p),
          getSerial(p),
          getLine(p),
          getDimensions(p),
          p?.currentPhase,
          determineStatus(p),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(term);
      });
    }

    return sortProjects(out);
  }, [projects, showCompleted, filterPhase, filterStatus, search, sort]);

  const handleSave = async (updatedData) => {
    if (!selectedProject) return;

    const patched = { ...updatedData };
    const nameFromNested = updatedData?.customer?.name;

    if (!patched.customerName && nameFromNested) {
      patched.customerName = nameFromNested;
    }

    const projectRef = doc(db, 'projects', selectedProject.id);
    await updateDoc(projectRef, patched);

    const updated = {
      ...selectedProject,
      ...patched,
      id: selectedProject.id,
    };

    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelectedProject(updated);
    setIsModalOpen(false);
  };

  const handleLiveUpdate = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProject((prev) =>
      prev?.id === updatedProject.id ? updatedProject : prev
    );
  };

  const openModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  const totalProjects = projects.length;
  const completedProjects = projects.filter(isCompleted).length;
  const activeProjects = projects.filter((p) => !isCompleted(p));
  const overdueCount = activeProjects.filter(isOverdue).length;
  const aheadCount = activeProjects.filter((p) => determineStatus(p) === 'Ahead of Schedule').length;
  const onPaceCount = activeProjects.filter((p) => determineStatus(p) === 'On Pace').length;
  const slightlyBehindCount = activeProjects.filter(
    (p) => determineStatus(p) === 'Slightly Behind'
  ).length;
  const behindCount = activeProjects.filter(
    (p) => determineStatus(p) === 'Behind Schedule'
  ).length;

  return (
    <div className="manage-projects-v2">
      <div className="mpv2-header">
        <div className="mpv2-header-copy">
          <div className="mpv2-eyebrow">Admin Workspace</div>
          <h2>Manage Projects</h2>
          <p>
            Track build health, completion status, timeline risk, and core customer
            details across all projects.
          </p>
        </div>

        <div className="mpv2-summary">
          <div className="mpv2-summary-pill neutral">Total: {totalProjects}</div>
          <div className="mpv2-summary-pill primary">Active: {activeProjects.length}</div>
          <div className="mpv2-summary-pill completed">Completed: {completedProjects}</div>
          <div className="mpv2-summary-pill ahead">Ahead: {aheadCount}</div>
          <div className="mpv2-summary-pill on">On Pace: {onPaceCount}</div>
          <div className="mpv2-summary-pill slight">Slightly Behind: {slightlyBehindCount}</div>
          <div className="mpv2-summary-pill behind">Behind: {behindCount}</div>
          <div className="mpv2-summary-pill overdue">Overdue: {overdueCount}</div>
        </div>
      </div>

      <div className="mpv2-toolbar">
        <div className="mpv2-toolbar-group mpv2-toolbar-search">
          <label htmlFor="project-search">Search</label>
          <input
            id="project-search"
            type="text"
            placeholder="Search customer, email, project ID, order ID, serial, line..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mpv2-toolbar-group">
          <label htmlFor="phase-filter">Current Phase</label>
          <select
            id="phase-filter"
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
          >
            <option value="">All phases</option>
            {buildPhases.map((phase) => (
              <option key={phase} value={normalize(phase)}>
                {phase}
              </option>
            ))}
          </select>
        </div>

        <div className="mpv2-toolbar-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="completed">Completed</option>
            <option value="ahead-of-schedule">Ahead of Schedule</option>
            <option value="on-pace">On Pace</option>
            <option value="slightly-behind">Slightly Behind</option>
            <option value="behind-schedule">Behind Schedule</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        <label className="mpv2-checkbox">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          <span>Show completed</span>
        </label>
      </div>

      <div className="mpv2-table-shell">
        <div className="mpv2-table-scroll">
          <table className="mpv2-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => toggleSort('customerName')}>
                  Customer <span className="sort-indicator">{renderSort('customerName')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('identifier')}>
                  Build Identifier <span className="sort-indicator">{renderSort('identifier')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('projectId')}>
                  Project ID <span className="sort-indicator">{renderSort('projectId')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('orderId')}>
                  Order ID <span className="sort-indicator">{renderSort('orderId')}</span>
                </th>
                <th>Line</th>
                <th>Dims</th>
                <th>Staves</th>
                <th className="sortable" onClick={() => toggleSort('createdAt')}>
                  Created <span className="sort-indicator">{renderSort('createdAt')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('targetCompletion')}>
                  Target <span className="sort-indicator">{renderSort('targetCompletion')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('timeSpent')}>
                  Time <span className="sort-indicator">{renderSort('timeSpent')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('currentPhase')}>
                  Current Phase <span className="sort-indicator">{renderSort('currentPhase')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('expectedPhase')}>
                  Expected Pace <span className="sort-indicator">{renderSort('expectedPhase')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('progress')}>
                  Progress <span className="sort-indicator">{renderSort('progress')}</span>
                </th>
                <th className="sortable" onClick={() => toggleSort('status')}>
                  Status <span className="sort-indicator">{renderSort('status')}</span>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan="14" className="mpv2-empty">
                    No projects matched your current filters.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => {
                  const progressPct = getWeightedProgressPct(project);
                  const statusLabel = determineStatus(project);
                  const statusClass = statusToneClass(statusLabel);
                  const customerEmail = getCustomerEmail(project);
                  const customerPhone = getCustomerPhone(project);

                  return (
                    <tr
                      key={project.id}
                      className={`mpv2-row status-row ${statusClass}`}
                      onClick={() => openModal(project)}
                    >
                      <td>
                        <div className="mpv2-primary-cell">
                          <div className="mpv2-primary-title">{getCustomerName(project)}</div>
                          <div className="mpv2-primary-meta">
                            {customerEmail || 'No email'}
                            {/* {customerPhone ? ` · ${customerPhone}` : ''} */}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="mpv2-identifier">{getIdentifier(project)}</div>
                      </td>

                      <td>
                        <code className="mpv2-code">{getProjectIdLabel(project)}</code>
                      </td>

                      <td>
                        <code className="mpv2-code">{getOrderIdLabel(project)}</code>
                      </td>

                      <td>{getLine(project)}</td>
                      <td>{getDimensions(project)}</td>
                      <td>{getStaveCount(project)}</td>
                      <td>{formatDate(project.startDate || project.createdAt || project.updatedAt)}</td>
                      <td>{formatDate(getTargetMillis(project))}</td>
                      <td>{formatHours(totalSecondsFromProject(project))}</td>
                      <td>{project.currentPhase || '—'}</td>
                      <td>{getExpectedPhase(project)}</td>

                      <td>
                        <div className="mpv2-progress">
                          <div className="mpv2-progress-track">
                            <div
                              className="mpv2-progress-fill"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="mpv2-progress-label">{progressPct}%</span>
                        </div>
                      </td>

                      <td>
                        <span className={`mpv2-status-pill status-pill-${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ManageProjectModal
          isOpen={isModalOpen}
          onClose={closeModal}
          projectData={selectedProject}
          onSave={handleSave}
          onProjectUpdate={handleLiveUpdate}
        />
      )}
    </div>
  );
};

export default ManageProjects;