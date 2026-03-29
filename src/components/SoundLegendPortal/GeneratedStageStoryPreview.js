// src/components/SoundLegendPortal/GeneratedStageStoryPreview.js

import React, { useMemo, useState } from 'react';
import { generateStageStorypoints } from '../../utils/generateStageStorypoints';
import { STAGES } from '../../utils/workflowDefinitions';
import './GeneratedStageStoryPreview.css';

function getStageOptions() {
  return (Array.isArray(STAGES) ? STAGES : []).map((stage, index) => ({
    value: stage.stageKey,
    label: stage.adminMainTitle || `${index + 1}. ${stage.stageKey}`,
  }));
}

function renderSectionBlock(section, index) {
  if (!section) return null;

  return (
    <div
      key={`${section.label || 'section'}-${index}`}
      className="gssp-section-card"
    >
      <div className="gssp-section-label">{section.label}</div>

      {section.body ? (
        <div className="gssp-section-body">{section.body}</div>
      ) : null}

      {Array.isArray(section.items) && section.items.length ? (
        <div className="gssp-tag-list">
          {section.items.map((item, itemIndex) => (
            <span
              key={`${section.label || 'item'}-${itemIndex}`}
              className="gssp-tag"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function StorypointCard({ title, data }) {
  if (!data) return null;

  return (
    <div className="gssp-storypoint-card">
      <div className="gssp-storypoint-header">
        <div className="gssp-storypoint-title">{title}</div>
      </div>

      {data.intro ? (
        <div className="gssp-storypoint-intro">{data.intro}</div>
      ) : null}

      {data.chapterStory ? (
        <div className="gssp-callout">
          <div className="gssp-callout-label">Chapter Story</div>
          <div className="gssp-callout-body">{data.chapterStory}</div>
        </div>
      ) : null}

      {data.oberVision ? (
        <div className="gssp-callout">
          <div className="gssp-callout-label">The Ober Vision</div>
          <div className="gssp-callout-body">{data.oberVision}</div>
        </div>
      ) : null}

      {data.tailoredVision ? (
        <div className="gssp-callout">
          <div className="gssp-callout-label">Tailored to This Build</div>
          <div className="gssp-callout-body">{data.tailoredVision}</div>
        </div>
      ) : null}

      {Array.isArray(data.sections) && data.sections.length ? (
        <div className="gssp-sections-grid">
          {data.sections.map((section, index) =>
            renderSectionBlock(section, index)
          )}
        </div>
      ) : null}
    </div>
  );
}

const GeneratedStageStoryPreview = ({ project }) => {
  const stageOptions = useMemo(() => getStageOptions(), []);
  const [selectedStageKey, setSelectedStageKey] = useState(
    stageOptions[0]?.value || 'discoveryDesign'
  );

  const generated = useMemo(() => {
    return generateStageStorypoints({
      stageKey: selectedStageKey,
      project: project || {},
      consultationIntake: project?.consultationIntake || {},
    });
  }, [selectedStageKey, project]);

  const storypoints = generated?.storypoints || {};
  const framework = generated?.framework || null;
  const projectContext = generated?.projectContext || {};
  const signals = generated?.signals || {};

  return (
    <div className="gssp-shell">
      <div className="gssp-header">
        <div className="gssp-header-copy">
          <div className="gssp-kicker">Admin Preview</div>
          <h3 className="gssp-title">Generated Stage Story Preview</h3>
          <p className="gssp-subtitle">
            Preview the intake-powered story output for each SoundLegend chapter
            before integrating it into the live portal.
          </p>
        </div>

        <div className="gssp-header-controls">
          <label className="gssp-select-label">Stage</label>
          <select
            className="gssp-select"
            value={selectedStageKey}
            onChange={(e) => setSelectedStageKey(e.target.value)}
          >
            {stageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {framework ? (
        <div className="gssp-framework-bar">
          <div className="gssp-framework-pill">
            <span className="gssp-framework-pill-label">Chapter</span>
            <span className="gssp-framework-pill-value">
              {framework.chapterLabel} • {framework.chapterTitle}
            </span>
          </div>

          <div className="gssp-framework-pill">
            <span className="gssp-framework-pill-label">Theme</span>
            <span className="gssp-framework-pill-value">
              {framework.chapterTheme}
            </span>
          </div>

          <div className="gssp-framework-pill">
            <span className="gssp-framework-pill-label">Project Context</span>
            <span className="gssp-framework-pill-value">
              {[
                projectContext.artistName,
                projectContext.shellSize,
                projectContext.shellConstruction,
                projectContext.shellRecipe,
              ]
                .filter(Boolean)
                .join(' • ') || 'No project context yet'}
            </span>
          </div>
        </div>
      ) : null}

      <div className="gssp-storypoints-stack">
        <StorypointCard title="Overview" data={storypoints.overview} />
        <StorypointCard
          title="Artist Direction"
          data={storypoints.artistDirection}
        />
        <StorypointCard
          title="Craftsman Direction"
          data={storypoints.craftsmanDirection}
        />
        <StorypointCard title="Build" data={storypoints.build} />
        <StorypointCard title="Voice" data={storypoints.voice} />
        <StorypointCard title="Archive" data={storypoints.archive} />
      </div>

      <div className="gssp-debug-shell">
        <div className="gssp-debug-title">Generation Signals Snapshot</div>

        <div className="gssp-debug-grid">
          <div className="gssp-debug-card">
            <div className="gssp-debug-label">Genre</div>
            <div className="gssp-debug-value">
              {signals.primaryGenre || '—'}
            </div>
          </div>

          <div className="gssp-debug-card">
            <div className="gssp-debug-label">Hardware</div>
            <div className="gssp-debug-value">
              {signals.hardwareFinish || '—'}
            </div>
          </div>

          <div className="gssp-debug-card">
            <div className="gssp-debug-label">Shell recipe</div>
            <div className="gssp-debug-value">
              {projectContext.shellRecipe || '—'}
            </div>
          </div>

          <div className="gssp-debug-card">
            <div className="gssp-debug-label">Response priorities</div>
            <div className="gssp-debug-value">
              {Array.isArray(signals.responsePriorities) &&
              signals.responsePriorities.length
                ? signals.responsePriorities.join(', ')
                : '—'}
            </div>
          </div>

          <div className="gssp-debug-card">
            <div className="gssp-debug-label">Initial shell concept</div>
            <div className="gssp-debug-value">
              {signals.initialShellConcept || '—'}
            </div>
          </div>

          <div className="gssp-debug-card">
            <div className="gssp-debug-label">Likely final direction</div>
            <div className="gssp-debug-value">
              {signals.likelyFinalDirection || '—'}
            </div>
          </div>

          <div className="gssp-debug-card">
            <div className="gssp-debug-label">What the drum wants to become</div>
            <div className="gssp-debug-value">
              {signals.whatTheDrumWantsToBecome || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedStageStoryPreview;