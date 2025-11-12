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

const stepWeights = {
  woodPreparation: 0.05,
  shellConstruction: 0.2,
  fineTuning: 0.1,
  shellExteriorFinish: 0.2,
  bearingEdges: 0.1,
  snareBedCutting: 0.1,
  hardwareDrilling: 0.1,
  hardwareAssembly: 0.05,
  tuningAndDetailing: 0.05,
  qualityCheck: 0.05,
};

const normalize = (str) =>
  str?.toLowerCase().replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '-') || '';

/** Build a display identifier like "SL-004 · SoundLegend".
 *  Looks across common field names and de-dupes/cleans output. */
const getIdentifier = (p) => {
  const serial =
    p.serial ??
    p.serialNumber ??
    p.projectSerial ??
    p.snareSerial ??
    p.serialId ??
    '';

  const lineRaw =
    p.series ??
    p.line ??
    p.artisanLine ??
    p.productLine ??
    p.seriesLine ??
    '';

  const line = typeof lineRaw === 'string' ? lineRaw : '';

  if (serial && line) return `${serial} · ${line}`;
  if (serial) return serial;
  if (line) return line;
  return '—';
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

  const getMillis = (ts) => {
    if (!ts) return 0;
    if (typeof ts?.seconds === 'number') return ts.seconds * 1000;
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 0 : d.getTime();
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
        // prefer explicit target; otherwise created + 35 days (fallback like UI)
        const base = p.targetCompletion || p.startDate;
        const ms = getMillis(base);
        return p.targetCompletion ? ms : (ms ? ms + 35 * 24 * 60 * 60 * 1000 : 0);
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
      return String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' }) * mul;
    });
  };

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  };
  const renderSort = (key) => (sort.key === key ? (sort.dir === 'asc' ? '▲' : '▼') : '↕');

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid';
    } else {
      return 'Invalid';
    }
    return date.toLocaleDateString();
  };

  const getExpectedPhase = (project) => {
    let createdAt = null;
    if (project.startDate?.seconds) {
      createdAt = new Date(project.startDate.seconds * 1000);
    } else if (typeof project.startDate === 'string') {
      const parsed = new Date(project.startDate);
      if (!isNaN(parsed)) createdAt = parsed;
    }
    if (!createdAt) return 'Unknown';

    let target = null;
    if (project.targetCompletion?.seconds) {
      target = new Date(project.targetCompletion.seconds * 1000);
    } else {
      target = new Date(createdAt);
      target.setDate(target.getDate() + 35);
    }

    const now = new Date();
    const elapsedDays = (now - createdAt) / (1000 * 60 * 60 * 24);
    const totalDays = (target - createdAt) / (1000 * 60 * 60 * 24);
    if (totalDays <= 0 || elapsedDays < 0) return 'Unknown';

    const progressPercent = elapsedDays / totalDays;
    const index = Math.min(buildPhases.length - 1, Math.floor(progressPercent * buildPhases.length));
    return buildPhases[index] || 'Unknown';
  };

  const determineStatus = (project) => {
    const expectedPhase = getExpectedPhase(project);
    const expectedIndex = buildPhases.findIndex((p) => normalize(p) === normalize(expectedPhase));
    const actualIndex = buildPhases.findIndex((p) => normalize(p) === normalize(project.currentPhase));
    if (expectedIndex === -1 || actualIndex === -1) return 'Unknown';

    const delta = actualIndex - expectedIndex;
    if (delta >= 2) return 'Ahead of Schedule';
    if (delta === 1 || delta === 0) return 'On Pace';
    if (delta === -1) return 'Slightly Behind';
    return 'Behind Schedule';
  };

  const formatTargetCompletion = (timestamp) => {
    if (!timestamp) return 'N/A';
    let date;
    if (timestamp?.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
      if (isNaN(date)) return 'Invalid';
    } else {
      return 'Invalid';
    }
    date.setDate(date.getDate() + 35); // fallback for display
    return date.toLocaleDateString();
  };

  const isOverdue = (project) => {
    const phaseIndex = buildPhases.indexOf(project.currentPhase);
    if (!project.startDate?.seconds) return false;
    const phaseStartDate = new Date(project.startDate.seconds * 1000);
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
  }, [projects, filter, showCompleted, sort]); // include sort + showCompleted

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
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    setFilteredProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    setSelectedProject((prev) => (prev?.id === updatedProject.id ? updatedProject : prev));
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
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              Customer Name <span className="sort-indicator">{renderSort('customerName')}</span>
            </th>
            <th className="sortable" onClick={() => toggleSort('identifier')}>
              Identifier <span className="sort-indicator">{renderSort('identifier')}</span>
            </th>
            <th className="sortable" onClick={() => toggleSort('startDate')}>
              Created At <span className="sort-indicator">{renderSort('startDate')}</span>
            </th>
            <th className="sortable" onClick={() => toggleSort('targetCompletion')}>
              Target Completion <span className="sort-indicator">{renderSort('targetCompletion')}</span>
            </th>
            <th className="sortable" onClick={() => toggleSort('timeSpent')}>
              Total Time Spent <span className="sort-indicator">{renderSort('timeSpent')}</span>
            </th>
            <th className="sortable" onClick={() => toggleSort('currentPhase')}>
              Current Phase <span className="sort-indicator">{renderSort('currentPhase')}</span>
            </th>
            <th className="sortable" onClick={() => toggleSort('expectedPhase')}>
              Expected On Pace (EOP) <span className="sort-indicator">{renderSort('expectedPhase')}</span>
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
          {filteredProjects.map((project) => (
            <tr
              key={project.id}
              onClick={() => openModal(project)}
              className={`status-row ${normalize(determineStatus(project))}`}
            >
              <td>{project.customerName || 'N/A'}</td>
              <td>{getIdentifier(project)}</td>
              <td>{formatDate(project.startDate)}</td>
              <td>{formatTargetCompletion(project.startDate)}</td>
              <td>{calculateTotalProjectTime(project)}</td>
              <td>{project.currentPhase}</td>
              <td>{getExpectedPhase(project)}</td>
              <td>
                <div className="project-progress-bar">
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${calculateProjectProgress(project)}%` }}
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