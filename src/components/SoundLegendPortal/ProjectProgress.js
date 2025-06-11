import React from 'react';
import './ProjectProgress.css';

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

const calculateProjectProgress = (project) => {
  if (!project) return 0;

  let total = 0;
  for (const [key, weight] of Object.entries(stepWeights)) {
    const checklist = project[key]?.checklist;
    if (!checklist?.length) continue;
    const completed = checklist.filter((item) => item.completed).length;
    total += (completed / checklist.length) * weight;
  }
  return Math.round(total * 100);
};

const ProjectProgress = ({ project }) => {
  if (!project) return null;

  const progress = calculateProjectProgress(project);

  return (
    <section className="project-section">
      <h3>Progress</h3>
      <p><strong>Project Completion:</strong> {progress}%</p>
      <p><strong>Current Step:</strong> {project.currentPhase || 'N/A'}</p>

      <div className="customer-progress-container">
        <div className="customer-progress-track">
          <div className="customer-progress-fill" style={{ width: `${progress}%` }} />
          <div className="customer-current-indicator" style={{ left: `${progress}%` }} />
        </div>

        <div className="customer-progress-timeline">
          {Object.entries(stepWeights).map(([key, weight], index) => {
            const step = project[key];
            const completed = step?.checklist?.filter((i) => i.completed).length || 0;
            const total = step?.checklist?.length || 0;

            let status = 'Not Started';
            let className = '';
            if (completed === total && total > 0) {
              status = 'Completed';
              className = 'complete';
            } else if (completed > 0) {
              status = 'In Progress';
              className = 'in-progress';
            }

            const left =
              Object.values(stepWeights)
                .slice(0, index)
                .reduce((sum, w) => sum + w, 0) * 100;

            const readable = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (c) => c.toUpperCase());

            return (
              <div
                key={key}
                className={`customer-timeline-step ${className}`}
                style={{ left: `${left}%` }}
                data-tooltip={`${readable} — ${status}`}
              >
                <div className="step-pill">{index + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ProjectProgress;