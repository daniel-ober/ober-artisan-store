// src/components/ManageProjects.js
import React, { useState, useEffect } from "react";
import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import ManageProjectModal from "./ManageProjectModal";
import { calculateProjectProgress } from "../utils/calculateProjectProgress";
import "./ManageProjects.css";

/**
 * Canonical build phases for the NEW 10-step workflow.
 * These should match project.currentPhase values from ManageProjectModal.
 */
const buildPhases = [
  "1. Discovery & Design",
  "2. Commitment & Portal Setup",
  "3. Wood & Vision Lock-In",
  "4. Raw Shell Creation",
  "5. Shell Trueing & Torch Tune",
  "6. Exterior Art & Finish",
  "7. Edges & Snare Beds",
  "8. Hardware & Assembly",
  "9. Legacy Tuning & Media",
  "10. Final QA, Packaging & Delivery",
];

/**
 * For time aggregation only.
 * We just care about the keys; value is unused but kept for clarity.
 * Includes BOTH old and new step keys for backwards compatibility.
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

  // legacy / portal schema (older projects)
  woodPreparation: 1,
  shellConstruction: 1,
  fineTuning: 1,
  shellExteriorFinish: 1,
  bearingEdges: 1,
  snareBedCutting: 1,
  hardwareDrilling: 1,
  tuningDetailing: 1,        // older misspelling used in some docs
  tuningAndDetailing: 1,     // portal key
  qualityCheck: 1,
};

/**
 * Step-key alias groups.
 * We normalize project docs by mirroring the "real" step objects onto
 * canonical keys so calculateProjectProgress can find checklist items
 * regardless of schema version.
 */
const STEP_ALIASES = {
  woodPreparation: ["woodPreparation", "discoveryDesign"],
  shellConstruction: ["shellConstruction", "commitmentPortal"],
  fineTuning: ["fineTuning", "woodVision", "woodVisionLockIn"],
  shellExteriorFinish: ["shellExteriorFinish", "rawShellCreation"],
  bearingEdges: ["bearingEdges", "shellTrueingTorchTune"],
  snareBedCutting: ["snareBedCutting", "exteriorArtFinish"],
  hardwareDrilling: ["hardwareDrilling", "edgesSnareBeds"],
  hardwareAssembly: ["hardwareAssembly"],
  tuningAndDetailing: ["tuningAndDetailing", "tuningDetailing", "legacyTuningMedia"],
  qualityCheck: ["qualityCheck", "finalQAPackagingDelivery"],
};

function isPlainObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Normalize a project doc so progress calculation can reliably find checklist items.
 * - Does NOT overwrite existing keys with undefined.
 * - Mirrors discovered step objects onto canonical keys.
 */
const normalizeProjectForProgress = (data) => {
  if (!data) return data;

  const out = { ...data };

  const pickFirstStepObject = (keys) => {
    for (const k of keys) {
      const v = out[k];
      if (isPlainObject(v)) return v;
    }
    return null;
  };

  Object.entries(STEP_ALIASES).forEach(([canonicalKey, keys]) => {
    const stepObj = pickFirstStepObject(keys);
    if (!stepObj) return;

    // Ensure the canonical key exists
    if (!isPlainObject(out[canonicalKey])) out[canonicalKey] = stepObj;

    // Also mirror onto any alias key that is missing (helps other readers)
    keys.forEach((k) => {
      if (!isPlainObject(out[k])) out[k] = stepObj;
    });
  });

  return out;
};

/**
 * Wrapper so ALL callers use the same normalization.
 * Returns an integer 0–100.
 */
const getWeightedProgressPct = (data) => {
  if (!data) return 0;

  const normalized = normalizeProjectForProgress(data);

  const raw = calculateProjectProgress(normalized);

  let n = 0;
  if (typeof raw === "number") n = raw;
  else if (typeof raw === "string") n = Number(raw);
  else n = 0;

  // If util ever returns 0–1, convert to 0–100 (safeguard)
  if (Number.isFinite(n) && n > 0 && n <= 1) n = n * 100;

  if (!Number.isFinite(n)) return 0;

  n = Math.max(0, Math.min(100, n));
  return Math.round(n);
};

const normalize = (str) =>
  str
    ?.toLowerCase()
    .replace(/[^a-z0-9 ]/gi, "")
    .trim()
    .replace(/\s+/g, "-") || "";

/* ---------- tiny helpers shared with Overview ---------- */
const val = (...c) =>
  c.find((v) => v !== undefined && v !== null && v !== "") ?? undefined;

/** Build a display identifier like:
 *   "SL-004 · SoundLegend · 14×6.5"
 * falling back gracefully if some fields are missing.
 */
const getIdentifier = (p = {}) => {
  const serial =
    val(
      p.lineSerial, // canonical
      p.serial,
      p.serialNumber,
      p.projectSerial,
      p.snareSerial,
      p.serialId
    ) || "";

  const line =
    val(
      p.artisanLine, // canonical
      p.series,
      p.productLine,
      p.seriesLine,
      p.line
    ) || "";

  const dia = val(p.width, p.diameter); // canonical width = diameter
  const dep = val(p.shellDepth, p.depth); // canonical shellDepth = depth
  const size = dia && dep ? ` · ${dia}×${dep}"` : "";

  if (serial && line) return `${serial} · ${line}${size}`;
  if (serial) return `${serial}${size}`;
  if (line) return `${line}${size}`;
  return size ? size.slice(3) : "—"; // strip leading " · "
};

const ManageProjects = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [filter, setFilter] = useState("");
  const [showCompleted, setShowCompleted] = useState(false); // default hidden
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // sorting
  const [sort, setSort] = useState({ key: "startDate", dir: "desc" });

  const getMillis = (v) => {
    if (!v) return 0;
    try {
      if (v.toDate) {
        const d = v.toDate();
        return d?.getTime?.() || 0;
      }
      if (typeof v.seconds === "number") return v.seconds * 1000;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? 0 : d.getTime();
    } catch {
      return 0;
    }
  };

const totalSecondsFromProject = (project) => {
  if (!project) return 0;

  // normalize so step lookups are consistent
  const p = normalizeProjectForProgress(project);

  // ✅ prevent double-counting: the normalizer mirrors the same step object
  // onto multiple keys, so we only sum each unique step object once.
  const seen = new Set();

  let total = 0;

  Object.keys(stepWeights).forEach((key) => {
    const step = p[key];
    if (!step || !Array.isArray(step.checklist) || step.checklist.length === 0) return;

    // Use a stable identity. If your step has an id, use it; otherwise use object ref.
    const stepId = step.stepId || step.id || step.phaseKey || step.key || null;
    const identity = stepId ? `id:${stepId}` : step; // object ref fallback

    if (seen.has(identity)) return;
    seen.add(identity);

    step.checklist.forEach((item) => {
      const v = item?.totalSeconds;
      if (typeof v === "number" && Number.isFinite(v)) total += v;
      else if (v?.seconds && typeof v.seconds === "number") total += v.seconds;
    });
  });

  return total;
};

  const projectValue = (p, key) => {
    switch (key) {
      case "customerName":
        return (p.customerName || "").toLowerCase();
      case "identifier":
        return getIdentifier(p).toLowerCase();
      case "startDate":
        return getMillis(p.startDate);
      case "targetCompletion": {
        // sort by explicit target if present; otherwise created + 35 days fallback
        if (p.targetCompletion) return getMillis(p.targetCompletion);
        const baseMs = getMillis(p.startDate);
        return baseMs ? baseMs + 35 * 24 * 60 * 60 * 1000 : 0;
      }
      case "timeSpent":
        return totalSecondsFromProject(p);
      case "currentPhase":
        return p.currentPhase || "";
      case "expectedPhase":
        return getExpectedPhase(p) || "";
      case "progress":
        return Number(getWeightedProgressPct(p)) || 0;
      case "status":
        return determineStatus(p) || "";
      default:
        return "";
    }
  };

  const sortProjects = (list) => {
    const { key, dir } = sort;
    const mul = dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = projectValue(a, key);
      const vb = projectValue(b, key);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * mul;
      return (
        String(va).localeCompare(String(vb), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * mul
      );
    });
  };

  const toggleSort = (key) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };
  const renderSort = (key) =>
    sort.key === key ? (sort.dir === "asc" ? "▲" : "▼") : "↕";

  const formatDate = (value) => {
    if (!value) return "N/A";
    let date;
    try {
      if (value.toDate) {
        date = value.toDate();
      } else if (typeof value.seconds === "number") {
        date = new Date(value.seconds * 1000);
      } else if (typeof value === "string") {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return "N/A";
        date = parsed;
      } else if (value instanceof Date) {
        date = value;
      } else {
        return "N/A";
      }
      return date.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  /**
   * Expected phase based on elapsed time between start and target date.
   * Uses the NEW 10-step buildPhases timeline.
   */
  const getExpectedPhase = (project) => {
    let createdAt = null;

    // createdAt / startDate
    if (project.startDate?.toDate) {
      createdAt = project.startDate.toDate();
    } else if (typeof project.startDate?.seconds === "number") {
      createdAt = new Date(project.startDate.seconds * 1000);
    } else if (typeof project.startDate === "string") {
      const parsed = new Date(project.startDate);
      if (!Number.isNaN(parsed.getTime())) createdAt = parsed;
    }

    if (!createdAt) return "Unknown";

    // explicit target if present, else fallback 35-day window
    let target = null;
    const tc = project.targetCompletion;
    if (tc) {
      if (tc.toDate) target = tc.toDate();
      else if (typeof tc.seconds === "number") target = new Date(tc.seconds * 1000);
      else if (typeof tc === "string") {
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
    if (totalDays <= 0 || elapsedDays < 0) return "Unknown";

    const progressPercent = elapsedDays / totalDays;
    const index = Math.min(
      buildPhases.length - 1,
      Math.floor(progressPercent * buildPhases.length)
    );
    return buildPhases[index] || "Unknown";
  };

  /**
   * Status bucket based on how far actual phase is from expected phase.
   */
  const determineStatus = (project) => {
    const expectedPhase = getExpectedPhase(project);
    const expectedIndex = buildPhases.findIndex(
      (p) => normalize(p) === normalize(expectedPhase)
    );

    let actualPhaseLabel = project.currentPhase || "";

    // treat "All Steps Complete" as final step
    if (/all steps complete/i.test(actualPhaseLabel)) {
      actualPhaseLabel = buildPhases[buildPhases.length - 1];
    }

    const actualIndex = buildPhases.findIndex(
      (p) => normalize(p) === normalize(actualPhaseLabel)
    );

    if (expectedIndex === -1 || actualIndex === -1) return "Unknown";

    const delta = actualIndex - expectedIndex;

    if (delta >= 2) return "Ahead of Schedule";
    if (delta === 1 || delta === 0) return "On Pace";
    if (delta === -1) return "Slightly Behind";
    return "Behind Schedule";
  };

  /** Show targetCompletion if set; otherwise show startDate + 35 days. */
  const formatTargetCompletion = (project) => {
    if (!project) return "N/A";
    let date = null;

    const tc = project.targetCompletion;
    if (tc) {
      if (tc.toDate) {
        date = tc.toDate();
      } else if (typeof tc.seconds === "number") {
        date = new Date(tc.seconds * 1000);
      } else if (typeof tc === "string") {
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
      else if (typeof sd?.seconds === "number") base = new Date(sd.seconds * 1000);
      else if (typeof sd === "string") {
        const parsed = new Date(sd);
        if (!Number.isNaN(parsed.getTime())) base = parsed;
      }

      if (!base) return "N/A";
      date = new Date(base);
      date.setDate(date.getDate() + 35);
    }

    return date.toLocaleDateString();
  };

  const isOverdue = (project) => {
    // simple heuristic: if today is past target date and progress < 100
    let target = null;
    const tc = project.targetCompletion;
    if (tc) {
      if (tc.toDate) target = tc.toDate();
      else if (typeof tc.seconds === "number") target = new Date(tc.seconds * 1000);
      else if (typeof tc === "string") {
        const parsed = new Date(tc);
        if (!Number.isNaN(parsed.getTime())) target = parsed;
      } else if (tc instanceof Date) {
        target = tc;
      }
    }
    if (!target) return false;
    if (getWeightedProgressPct(project) >= 100) return false;
    return new Date() > target;
  };

  // completed logic + filters
  const isCompleted = (p) => {
    const pct = getWeightedProgressPct(p);
    const finishedFlag =
      p?.status?.toLowerCase?.() === "finished" ||
      p?.allStepsComplete === true ||
      p?.currentStep === "All Steps Complete" ||
      p?.currentPhase === "All Steps Complete";
    return pct === 100 || finishedFlag;
  };

  const applyFilters = (list) => {
    let out = list;
    if (!showCompleted) out = out.filter((p) => !isCompleted(p));
    if (filter) {
      out = out.filter(
        (p) =>
          normalize(p.currentPhase) === filter ||
          (normalize(filter) === "overdue" && isOverdue(p))
      );
    }
    return out;
  };

  // subscribe
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("startDate", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveProjects = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
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
    const projectRef = doc(db, "projects", selectedProject.id);
    await updateDoc(projectRef, updatedData);
    const updated = {
      ...selectedProject,
      ...updatedData,
      id: selectedProject.id,
    };
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
    const total = totalSecondsFromProject(project);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /* ---------- summary metrics for the header ---------- */
  const activeProjects = projects.filter((p) => !isCompleted(p));
  const aheadCount = activeProjects.filter(
    (p) => determineStatus(p) === "Ahead of Schedule"
  ).length;
  const onPaceCount = activeProjects.filter(
    (p) => determineStatus(p) === "On Pace"
  ).length;
  const slightlyBehindCount = activeProjects.filter(
    (p) => determineStatus(p) === "Slightly Behind"
  ).length;
  const behindCount = activeProjects.filter(
    (p) => determineStatus(p) === "Behind Schedule"
  ).length;

  return (
    <div className="manage-projects">
      <div className="manage-projects-header">
        <h2>Manage Projects</h2>
        <div className="projects-summary">
          <div className="summary-pill summary-pill-primary">
            Active: {activeProjects.length}
          </div>
          <div className="summary-pill summary-pill-ahead">Ahead: {aheadCount}</div>
          <div className="summary-pill summary-pill-on">On Pace: {onPaceCount}</div>
          <div className="summary-pill summary-pill-slight">
            Slightly Behind: {slightlyBehindCount}
          </div>
          <div className="summary-pill summary-pill-behind">
            Behind: {behindCount}
          </div>
        </div>
      </div>

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
            <option value="overdue">Overdue (past target date)</option>
          </select>
        </label>

        <label className="show-completed-label">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show completed
        </label>
      </div>
      {/* Table */}
      <div className="projects-table-wrapper">
        <table className="projects-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort("customerName")}>
                Customer Name <span className="sort-indicator">{renderSort("customerName")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("identifier")}>
                Identifier <span className="sort-indicator">{renderSort("identifier")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("startDate")}>
                Created At <span className="sort-indicator">{renderSort("startDate")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("targetCompletion")}>
                Target Completion <span className="sort-indicator">{renderSort("targetCompletion")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("timeSpent")}>
                Total Time Spent <span className="sort-indicator">{renderSort("timeSpent")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("currentPhase")}>
                Current Phase <span className="sort-indicator">{renderSort("currentPhase")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("expectedPhase")}>
                Expected On Pace (EOP) <span className="sort-indicator">{renderSort("expectedPhase")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("progress")}>
                Progress <span className="sort-indicator">{renderSort("progress")}</span>
              </th>
              <th className="sortable" onClick={() => toggleSort("status")}>
                Status <span className="sort-indicator">{renderSort("status")}</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredProjects.map((project) => {
              const statusLabel = determineStatus(project);
              const statusClass = normalize(statusLabel); // e.g., "on-pace"

              // -----------------------------
              // ✅ Progress (fix 0% issue)
              // - weighted can be 0 when weight-map keys don't match task labels
              // - fallback to checklist completion if checklist has real progress
              // -----------------------------
              const normalized = normalizeProjectForProgress(project);

              const countChecklistPct = (p) => {
                if (!p) return 0;

                // scan every step key we know about; any step with a checklist contributes
                const stepKeys = Object.keys(stepWeights);

                let total = 0;
                let done = 0;

                stepKeys.forEach((k) => {
                  const step = p[k];
                  const list = step?.checklist;
                  if (!Array.isArray(list) || list.length === 0) return;

                  list.forEach((item) => {
                    total += 1;
                    if (item?.completed === true) done += 1;
                  });
                });

                if (!total) return 0;
                return Math.round((done / total) * 100);
              };

              const weightedPct = getWeightedProgressPct(normalized);
              const checklistPct = countChecklistPct(normalized);

              // If weighted says 0 but checklist says otherwise, trust checklist.
              const progressPct = weightedPct === 0 && checklistPct > 0 ? checklistPct : weightedPct;

              return (
                <tr
                  key={project.id}
                  onClick={() => openModal(project)}
                  className={`status-row ${statusClass}`}
                >
                  <td>{project.customerName || "N/A"}</td>
                  <td>{getIdentifier(project)}</td>
                  <td>{formatDate(project.startDate)}</td>
                  <td>{formatTargetCompletion(project)}</td>
                  <td>{calculateTotalProjectTime(project)}</td>
                  <td>{project.currentPhase || "—"}</td>
                  <td>{getExpectedPhase(project)}</td>
                  <td>
                    <div className="project-progress-bar">
                      <div className="progress-bar-wrapper">
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                      </div>
                      <span className="progress-percent">{progressPct}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill status-pill-${statusClass}`}>{statusLabel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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