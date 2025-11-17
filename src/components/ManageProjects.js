// src/components/ManageProjects.js
import React, { useState, useEffect } from 'react';
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import ManageProjectModal from './ManageProjectModal';
import { calculateProjectProgress } from '../utils/calculateProjectProgress';
import './ManageProjects.css';

const buildPhases = [
  'Step 1. Wood Preparation',
  'Step 2. Shell Construction',
  'Step 3. Fine-Tuning',
  'Step 4. Shell Exterior Finish',
  'Step 5. Bearing Edges',
  'Step 6. Snare Bed Cutting',
  'Step 7. Hardware Drilling',
  'Step 8. Hardware Assembly',
  'Step 9. Tuning and Detailing',
  'Step 10. Quality Check',
];

/* ---------- checklist weights (for time aggregation only) ---------- */
const stepWeights = {
  woodPreparation: 0.05,
  shellConstruction: 0.2,
  fineTuning: 0.1,
  shellExteriorFinish: 0.2,
  bearingEdges: 0.1,
  snareBedCutting: 0.1,
  hardwareDrilling: 0.1,
  hardwareAssembly: 0.05,
  tuningDetailing: 0.05, // ✅ fix key: matches defaultStepData.tuningDetailing
  qualityCheck: 0.05,
};

const normalize = (str) =>
  str?.toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '-') || '';

/* ---------- tiny helpers shared with Overview ---------- */
const val = (...c) =>
  c.find((v) => v !== undefined && v !== null && v !== '') ?? undefined;

/** Build a display identifier like:
 *   "SL-004 · SoundLegend · 14×6.5"
 * falling back gracefully if some fields are missing.
 */
const getIdentifier = (p = {}) => {
  const serial =
    val(
      p.lineSerial,      // canonical
      p.serial,
      p.serialNumber,
      p.projectSerial,
      p.snareSerial,
      p.serialId
    ) || '';

  const line =
    val(
      p.artisanLine,     // canonical
      p.series,
      p.productLine,
      p.seriesLine,
      p.line
    ) || '';

  const dia = val(p.width, p.diameter);       // canonical width = diameter
  const dep = val(p.shellDepth, p.depth);     // canonical shellDepth = depth
  const size = dia && dep ? ` · ${dia}×${dep}"` : '';

  if (serial && line) return `${serial} · ${line}${size}`;
  if (serial)         return `${serial}${size}`;
  if (line)           return `${line}${size}`;
  return size ? size.slice(3) : '—';          // strip leading " · "
};

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState('');
  const [showCompleted, setShowCompleted] = useState(false); // default hidden
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // sorting
  const [sort, setSort] = useState({ key: 'startDate', dir: 'desc' });

  const getMillis = (v) => {
    if (!v) return 0;
    try {
      if (v.toDate) {
        const d = v.toDate();
        return d?.getTime?.() || 0;
      }
      if (typeof v.seconds === 'number') return v.seconds * 1000;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  };

  // numeric seconds for total time spent (used for sort)
  const totalSecondsFromProject = (project) => {
    let total = 0;
    Object.keys(stepWeights).forEach((key) => {
      const step = project[key];
      if (step?.checklist?.length) {
        step.checklist.forEach((item) => {
          const v = item?.totalSeconds;
          if (typeof v === 'number') total += v;
          else if (v?.seconds && typeof v.seconds === 'number') total += v.seconds;
        });
      }
    });
    return total;
  };

  const projectValue = (p, key) => {
    switch (key) {
      case 'customerName':     return (p.customerName || '').toLowerCase();
      case 'identifier':       return getIdentifier(p).toLowerCase();
      case 'startDate':        return getMillis(p.startDate);
      case 'targetCompletion': {
        // sort by explicit target if present; otherwise created + 35 days fallback
        if (p.targetCompletion) return getMillis(p.targetCompletion);
        const baseMs = getMillis(p.startDate);
        return baseMs ? baseMs + 35 * 24 * 60 * 60 * 1000 : 0;
      }
      case 'timeSpent':        return totalSecondsFromProject(p);
      case 'currentPhase':     return p.currentPhase || '';
      case 'expectedPhase':    return getExpectedPhase(p) || '';
      case 'progress':         return Number(calculateProjectProgress(p)) || 0;
      case 'status':           return determineStatus(p) || '';
      default:                 return '';
    }
  };

  const sortProjects = (list) => {
    const { key, dir } = sort;
    const mul = dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = projectValue(a, key);
      const vb = projectValue(b, key);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * mul;
      return (
        String(va).localeCompare(String(vb), undefined, {
          numeric: true,
          sensitivity: 'base',
        }) * mul
      );
    });
  };

  const toggleSort = (key) => {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
  };
  const renderSort = (key) =>
    sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕';

  const formatDate = (value) => {
    if (!value) return 'N/A';
    let date;
    try {
      if (value.toDate) {
        date = value.toDate();
      } else if (typeof value.seconds === 'number') {
        date = new Date(value.seconds * 1000);
      } else if (typeof value === 'string') {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return 'N/A';
        date = parsed;
      } else if (value instanceof Date) {
        date = value;
      } else {
        return 'N/A';
      }
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getExpectedPhase = (project) => {
    let createdAt = null;

    // createdAt / startDate
    if (project.startDate?.toDate) {
      createdAt = project.startDate.toDate();
    } else if (typeof project.startDate?.seconds === 'number') {
      createdAt = new Date(project.startDate.seconds * 1000);
    } else if (typeof project.startDate === 'string') {
      const parsed = new Date(project.startDate);
      if (!Number.isNaN(parsed.getTime())) createdAt = parsed;
    }

    if (!createdAt) return 'Unknown';

    // explicit target if present, else fallback 35-day window
    let target = null;
    const tc = project.targetCompletion;
    if (tc) {
      if (tc.toDate) target = tc.toDate();
      else if (typeof tc.seconds === 'number') target = new Date(tc.seconds * 1000);
      else if (typeof tc === 'string') {
        const parsed = new Date(tc);
        if (!Number.isNaN(parsed.getTime())) target = parsed;
      } else if (tc instanceof Date) {
        target = tc;
      }
    }
    if (!target) {
      target = new Date(createdAt);
      target.setDate(target.getDate() + 35);
    }

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
    const expectedPhase = getExpectedPhase(project);
    const expectedIndex = buildPhases.findIndex(
      (p) => normalize(p) === normalize(expectedPhase)
    );
    const actualIndex = buildPhases.findIndex(
      (p) => normalize(p) === normalize(project.currentPhase)
    );
    if (expectedIndex === -1 || actualIndex === -1) return 'Unknown';

    const delta = actualIndex - expectedIndex;
    if (delta >= 2) return 'Ahead of Schedule';
    if (delta === 1 || delta === 0) return 'On Pace';
    if (delta === -1) return 'Slightly Behind';
    return 'Behind Schedule';
  };

  /** Show targetCompletion if set; otherwise show startDate + 35 days. */
  const formatTargetCompletion = (project) => {
    if (!project) return 'N/A';
    let date = null;

    const tc = project.targetCompletion;
    if (tc) {
      if (tc.toDate) {
        date = tc.toDate();
      } else if (typeof tc.seconds === 'number') {
        date = new Date(tc.seconds * 1000);
      } else if (typeof tc === 'string') {
        const parsed = new Date(tc);
        if (!Number.isNaN(parsed.getTime())) date = parsed;
      } else if (tc instanceof Date) {
        date = tc;
      }
    }

    // fallback: 35 days after startDate
    if (!date) {
      let base = null;
      const sd = project.startDate;
      if (sd?.toDate) base = sd.toDate();
      else if (typeof sd?.seconds === 'number') base = new Date(sd.seconds * 1000);
      else if (typeof sd === 'string') {
        const parsed = new Date(sd);
        if (!Number.isNaN(parsed.getTime())) base = parsed;
      }

      if (!base) return 'N/A';
      date = new Date(base);
      date.setDate(date.getDate() + 35);
    }

    return date.toLocaleDateString();
  };

  const isOverdue = (project) => {
    const phaseIndex = buildPhases.indexOf(project.currentPhase);
    if (phaseIndex < 0) return false;

    let start = null;
    const sd = project.startDate;
    if (sd?.toDate) start = sd.toDate();
    else if (typeof sd?.seconds === 'number') start = new Date(sd.seconds * 1000);
    else if (typeof sd === 'string') {
      const parsed = new Date(sd);
      if (!Number.isNaN(parsed.getTime())) start = parsed;
    }
    if (!start) return false;

    const phaseStartDate = new Date(start);
    phaseStartDate.setDate(phaseStartDate.getDate() + phaseIndex * 2);
    return new Date() > phaseStartDate;
  };

  // completed logic + filters
  const isCompleted = (p) => {
    const pct = calculateProjectProgress(p);
    const finishedFlag =
      p?.status?.toLowerCase?.() === 'finished' ||
      p?.allStepsComplete === true ||
      p?.currentStep === 'All Steps Complete' ||
      p?.currentPhase === 'All Steps Complete';
    return pct === 100 || finishedFlag;
  };

  const applyFilters = (list) => {
    let out = list;
    if (!showCompleted) out = out.filter((p) => !isCompleted(p));
    if (filter) {
      out = out.filter(
        (p) =>
          normalize(p.currentPhase) === filter ||
          (normalize(filter) === 'overdue' && isOverdue(p))
      );
    }
    return out;
  };

  // subscribe
  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveProjects = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setProjects(liveProjects);
    });
    return () => unsubscribe();
  }, []);

  // recompute filtered + sorted whenever deps change
  useEffect(() => {
    const base = applyFilters(projects);
    setFilteredProjects(sortProjects(base));
  }, [projects, filter, showCompleted, sort]);

  const openModal = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setIsModalOpen(false);
  };

  const handleSave = async (updatedData) => {
    if (!selectedProject) return;
    const projectRef = doc(db, 'projects', selectedProject.id);
    await updateDoc(projectRef, updatedData);
    const updated = { ...selectedProject, ...updatedData };
    handleLiveUpdate(updated);
    closeModal();
  };

  const handleLiveUpdate = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setFilteredProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    setSelectedProject((prev) =>
      prev?.id === updatedProject.id ? updatedProject : prev
    );
  };

  const calculateTotalProjectTime = (project) => {
    let total = 0;
    Object.keys(stepWeights).forEach((key) => {
      const step = project[key];
      if (step?.checklist?.length) {
        step.checklist.forEach((item) => {
          const val = item.totalSeconds;
          if (typeof val === 'number') total += val;
          else if (val?.seconds && typeof val.seconds === 'number') total += val.seconds;
        });
      }
    });
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="manage-projects">
      <h2>Manage Projects</h2>

      <div className="filters">
        <label>
          Filter by Phase:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Phases</option>
            {buildPhases.map((phase) => (
              <option key={phase} value={normalize(phase)}>
                {phase}
              </option>
            ))}
            <option value="overdue">Overdue</option>
          </select>
        </label>

        <label style={{ marginLeft: 12 }}>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />{' '}
          Show completed
        </label>
      </div>

      <table className="projects-table">
        <thead>
          <tr>
            <th className="sortable" onClick={() => toggleSort('customerName')}>
              Customer Name{' '}
              <span className="sort-indicator">
                {renderSort('customerName')}
              </span>
            </th>
            <th className="sortable" onClick={() => toggleSort('identifier')}>
              Identifier{' '}
              <span className="sort-indicator">
                {renderSort('identifier')}
              </span>
            </th>
            <th className="sortable" onClick={() => toggleSort('startDate')}>
              Created At{' '}
              <span className="sort-indicator">
                {renderSort('startDate')}
              </span>
            </th>
            <th
              className="sortable"
              onClick={() => toggleSort('targetCompletion')}
            >
              Target Completion{' '}
              <span className="sort-indicator">
                {renderSort('targetCompletion')}
              </span>
            </th>
            <th className="sortable" onClick={() => toggleSort('timeSpent')}>
              Total Time Spent{' '}
              <span className="sort-indicator">
                {renderSort('timeSpent')}
              </span>
            </th>
            <th className="sortable" onClick={() => toggleSort('currentPhase')}>
              Current Phase{' '}
              <span className="sort-indicator">
                {renderSort('currentPhase')}
              </span>
            </th>
            <th
              className="sortable"
              onClick={() => toggleSort('expectedPhase')}
            >
              Expected On Pace (EOP){' '}
              <span className="sort-indicator">
                {renderSort('expectedPhase')}
              </span>
            </th>
            <th className="sortable" onClick={() => toggleSort('progress')}>
              Progress{' '}
              <span className="sort-indicator">{renderSort('progress')}</span>
            </th>
            <th className="sortable" onClick={() => toggleSort('status')}>
              Status{' '}
              <span className="sort-indicator">{renderSort('status')}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map((project) => (
            <tr
              key={project.id}
              onClick={() => openModal(project)}
              className={`status-row ${normalize(determineStatus(project))}`}
            >
              <td>{project.customerName || 'N/A'}</td>
              <td>{getIdentifier(project)}</td>
              <td>{formatDate(project.startDate)}</td>
              <td>{formatTargetCompletion(project)}</td>
              <td>{calculateTotalProjectTime(project)}</td>
              <td>{project.currentPhase || '—'}</td>
              <td>{getExpectedPhase(project)}</td>
              <td>
                <div className="project-progress-bar">
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${calculateProjectProgress(project)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="progress-percent">
                    {calculateProjectProgress(project)}%
                  </span>
                </div>
              </td>
              <td>{determineStatus(project)}</td>
            </tr>
          ))}
        </tbody>
      </table>

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