import React from 'react';
import { val } from '../shared/stepHelpers';

const BuildScopeSection = ({
  storyEngineData,
  editableData,
  projectData,
}) => {
  const buildSpec = storyEngineData?.engineRecord?.buildSpec || {};

  const formatBuildScopeValue = (fieldKey, value) => {
    const text = String(value || '').trim();
    if (!text) return '—';

    const normalized = text.toLowerCase();

    if (fieldKey === 'lugCount') {
      if (normalized.includes('10')) return '10 lug';
      if (normalized.includes('8')) return '8 lug';
      if (normalized.includes('6')) return '6 lug';
    }

    if (fieldKey === 'hardwareFinish') {
      if (normalized.includes('brass') || normalized.includes('gold')) {
        return 'Brass / Gold';
      }
      if (normalized.includes('black nickel')) return 'Black Nickel';
      if (normalized.includes('chrome')) return 'Chrome';
    }

    if (fieldKey === 'bearingEdge') {
      if (
        normalized.includes('sensitive') ||
        normalized.includes('balanced edge')
      ) {
        return 'Sensitive / Balanced';
      }
    }

    if (fieldKey === 'tuningApproach') {
      if (
        normalized.includes('studio-friendly flexibility') ||
        normalized.includes('broad studio')
      ) {
        return 'Studio-Friendly Flexibility';
      }
    }

    if (fieldKey === 'finishSystem') {
      if (
        normalized.includes('custom visual direction') ||
        normalized.includes('after consultation')
      ) {
        return 'Custom Visual Direction';
      }
    }

    if (fieldKey === 'hoopType') {
      if (normalized.includes('triple-flanged')) {
        return 'Triple-Flanged Hoops';
      }
      if (normalized.includes('die-cast')) return 'Die-Cast Hoops';
    }

    return text;
  };

  const getBuildValue = (key, ...fallbacks) => {
    const rawValue = val(buildSpec?.[key]?.value, ...fallbacks);
    return formatBuildScopeValue(key, rawValue);
  };

  const sizeDiameter = val(
    buildSpec?.diameter?.value,
    editableData?.width,
    projectData?.width,
    editableData?.diameter,
    projectData?.diameter
  );

  const sizeDepth = val(
    buildSpec?.depth?.value,
    editableData?.shellDepth,
    projectData?.shellDepth,
    editableData?.depth,
    projectData?.depth
  );

  const coreBuildItems = [
    {
      label: 'Artisan Line',
      value:
        val(
          editableData?.artisanLine,
          projectData?.artisanLine,
          editableData?.series,
          projectData?.series,
          editableData?.line,
          projectData?.line
        ) || '—',
    },
    {
      label: 'Serial',
      value:
        val(
          editableData?.lineSerial,
          projectData?.lineSerial,
          editableData?.serial,
          projectData?.serial,
          editableData?.serialNumber,
          projectData?.serialNumber
        ) || '—',
    },
    {
      label: 'Size',
      value:
        sizeDiameter && sizeDepth ? `${sizeDiameter}" × ${sizeDepth}"` : '—',
    },
  ];

  const shellItems = [
    {
      label: 'Shell Construction',
      value: getBuildValue(
        'shellConstruction',
        editableData?.shellConstruction,
        projectData?.shellConstruction
      ),
    },
    {
      label: 'Primary Wood',
      value: getBuildValue(
        'primaryWood',
        editableData?.primaryWood,
        projectData?.primaryWood
      ),
    },
    {
      label: 'Secondary Wood',
      value: getBuildValue(
        'secondaryWood',
        editableData?.secondaryWood,
        projectData?.secondaryWood
      ),
    },
    {
      label: 'Stave Count',
      value: getBuildValue(
        'staveCount',
        editableData?.staveCount,
        projectData?.staveCount
      ),
    },
    {
      label: 'Bearing Edge',
      value: getBuildValue(
        'bearingEdge',
        editableData?.bearingEdge,
        projectData?.bearingEdge
      ),
    },
    {
      label: 'Snare Bed',
      value: getBuildValue(
        'snareBed',
        editableData?.snareBed,
        projectData?.snareBed
      ),
    },
    {
      label: 'Snare Bed Depth',
      value: getBuildValue(
        'snareBedDepth',
        editableData?.snareBedDepth,
        projectData?.snareBedDepth
      ),
    },
    {
      label: 'Finish System',
      value: getBuildValue(
        'finishSystem',
        editableData?.finishSystem,
        projectData?.finishSystem
      ),
    },
  ];

  const hardwareVoicingItems = [
    {
      label: 'Lug Count',
      value: getBuildValue(
        'lugCount',
        editableData?.lugCount,
        projectData?.lugCount
      ),
    },
    {
      label: 'Hoop Type',
      value: getBuildValue(
        'hoopType',
        editableData?.hoopType,
        projectData?.hoopType,
        editableData?.rimType,
        projectData?.rimType
      ),
    },
    {
      label: 'Hardware Finish',
      value: getBuildValue(
        'hardwareFinish',
        editableData?.hardwareFinish,
        projectData?.hardwareFinish
      ),
    },
    {
      label: 'Head Type',
      value: getBuildValue(
        'headType',
        editableData?.headType,
        projectData?.headType
      ),
    },
    {
      label: 'Tuning Approach',
      value: getBuildValue(
        'tuningApproach',
        editableData?.tuningApproach,
        projectData?.tuningApproach
      ),
    },
  ];

  const renderScopeGroup = (kicker, title, copy, items) => (
    <div className="mpm-buildscope-group">
      <div className="mpm-buildscope-group-head">
        <div className="mpm-buildscope-group-kicker">{kicker}</div>
        <h4 className="mpm-buildscope-group-title">{title}</h4>
        <p className="mpm-buildscope-group-copy">{copy}</p>
      </div>

      <div className="mpm-buildscope-grid">
        {items.map((item) => (
          <div
            key={item.label}
            className={`mpm-buildscope-card ${
              item.wide ? 'mpm-buildscope-card-wide' : ''
            }`}
          >
            <span className="mpm-buildscope-label">{item.label}</span>
            <strong className="mpm-buildscope-value">
              {item.value || '—'}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="mpm-surface mpm-tab-shell mpm-buildscope-shell">
      <div className="mpm-tab-section-header mpm-buildscope-header">
        <div>
          <div className="mpm-tab-kicker">Overview</div>
          <h3 className="mpm-tab-title">Build scope</h3>
          <p className="mpm-tab-subtitle">
            Builder-facing scope of work, progress, and confirmed build
            components for this project.
          </p>
        </div>
      </div>

      <div className="mpm-buildscope-stack">
        {renderScopeGroup(
          'Core Build',
          'Project identity',
          'The high-level build reference points.',
          coreBuildItems
        )}

        {renderScopeGroup(
          'Shell Architecture',
          'Shell and structure',
          'Core shell decisions that shape feel, response, and construction.',
          shellItems
        )}

        {renderScopeGroup(
          'Hardware + Voicing',
          'Performance components',
          'Hardware and tuning-related decisions that affect response and setup.',
          hardwareVoicingItems
        )}
      </div>
    </section>
  );
};

export default BuildScopeSection;