// src/utils/craftsmanEngine/buildCraftsmanDisplayModel.js

import generateCraftsmanSummary from './generateCraftsmanSummary';

const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function pct(confidence01) {
  const n = Number(confidence01);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.max(0, Math.min(1, n)) * 100);
}

function prettifyContributorKey(value = '') {
  const map = {
    headTension: 'Head Tension',
    headType: 'Head Type',
    bearingEdge: 'Bearing Edge',
    shellConstruction: 'Shell Construction',
    shellMaterial: 'Shell Material',
    woodSpecies: 'Wood Species',
    depth: 'Depth',
    diameter: 'Diameter',
    shellThickness: 'Shell Thickness',
    hoopType: 'Hoop Type',
    hardwareType: 'Hardware Type',
    finishType: 'Finish Type',
    snareResponse: 'Snare Response',
    snareBedDepth: 'Snare Bed Depth',
    snareSideHead: 'Snare-Side Head',
    snareWireCount: 'Snare Wire Count',
    snareWireStyle: 'Snare Wire Style',
    snareWireMaterial: 'Snare Wire Material',
    reRings: 'Re-Rings',
  };

  if (map[value]) return map[value];

  return String(value)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function toConfidenceChip(key, label, entry) {
  return {
    key,
    label,
    confidence01: round2(entry?.confidence01 || 0),
    confidencePercent: pct(entry?.confidence01 || 0),
    rationale: entry?.rationale || '',
  };
}

function normalizeLower(value) {
  return String(value || '').trim().toLowerCase();
}

function isMeaningfulRecommendationValue(value) {
  const normalized = normalizeLower(value);
  return Boolean(
    normalized &&
      normalized !== 'n/a' &&
      normalized !== 'na' &&
      normalized !== 'none'
  );
}

function buildTopRecommendations(summary = {}) {
  const shellFamily = normalizeLower(
    summary?.rawSpecs?.shellFamily ||
      summary?.specs?.shellFamily ||
      summary?.inputSpecs?.shellFamily ||
      summary?.recommendedSpecs?.shellFamily ||
      'wood'
  );

  const recommendationMatrix = summary?.recommendationMatrix || {};

  const ordered = [
    ['shellMaterial', 'Shell Material', 100],
    ['shellThickness', 'Shell Thickness', 98],
    ['staveCount', 'Stave Count', 92],
    ['bearingEdge', 'Bearing Edge', 96],
    ['headType', 'Head Type', 88],
    ['headTension', 'Head Tension', 87],
    ['hoopType', 'Hoop Type', 90],
    ['snareBedDepth', 'Snare Bed Depth', 95],
    ['snareSideHead', 'Snare-Side Head', 94],
    ['snareWireCount', 'Snare Wire Count', 89],
    ['snareWireStyle', 'Snare Wire Style', 91],
    ['snareWireMaterial', 'Snare Wire Material', 78],
    ['reRings', 'Re-Rings', 58],
    ['hardwareType', 'Hardware Type', 54],
    ['finishType', 'Finish Type', 48],
    ['stickSuggestion', 'Stick Suggestion', 36],
  ];

  return ordered
    .map(([key, label, priority]) => {
      const item = recommendationMatrix[key];
      if (!item?.value || !isMeaningfulRecommendationValue(item.value)) return null;

      if (shellFamily !== 'wood' && key === 'staveCount') return null;
      if (shellFamily !== 'wood' && key === 'reRings') return null;

      return {
        key,
        label,
        value: item.value,
        priority,
        confidence01: round2(item.confidence01 || 0),
        confidencePercent: pct(item.confidence01 || 0),
        rationale: item.rationale || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.confidence01 - a.confidence01;
    });
}

function buildTuningCards(legacyTuning = {}) {
  return [
    {
      key: 'shellFundamental',
      label: 'Shell Fundamental',
      value: legacyTuning.shellFundamentalHz
        ? `${legacyTuning.shellFundamentalHz} Hz`
        : '—',
      subvalue: legacyTuning.shellFundamentalNote || '',
    },
    {
      key: 'playableRange',
      label: 'Playable Range',
      value:
        legacyTuning.lowestHz && legacyTuning.highestHz
          ? `${legacyTuning.lowestHz}–${legacyTuning.highestHz} Hz`
          : '—',
      subvalue:
        legacyTuning.notes?.lowest && legacyTuning.notes?.highest
          ? `${legacyTuning.notes.lowest} → ${legacyTuning.notes.highest}`
          : '',
    },
    {
      key: 'legacyCenter',
      label: 'LegacyPrint™ Center',
      value: legacyTuning.legacyCenterHz
        ? `${legacyTuning.legacyCenterHz} Hz`
        : '—',
      subvalue: legacyTuning.legacyCenterNote || '',
    },
  ];
}

function buildPrimaryCallouts(summary) {
  const topTraits = (summary?.spiderExplanation?.axes || [])
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((axis) => ({
      key: axis.axis,
      label: axis.label,
      value: `${axis.score}/10`,
      text: axis.interpretation,
    }));

  return topTraits;
}

function buildConfidenceGroups(confidenceByArea = {}) {
  const map = [
    ['shellMaterial', 'Shell Material'],
    ['shellThickness', 'Shell Thickness'],
    ['staveCount', 'Stave Count'],
    ['bearingEdge', 'Bearing Edge'],
    ['headType', 'Head Type'],
    ['headTension', 'Head Tension'],
    ['hoopType', 'Hoop Type'],
    ['snareBedDepth', 'Snare Bed Depth'],
    ['snareSideHead', 'Snare-Side Head'],
    ['snareWireCount', 'Snare Wire Count'],
    ['snareWireStyle', 'Snare Wire Style'],
    ['snareWireMaterial', 'Snare Wire Material'],
    ['reRings', 'Re-Rings'],
    ['hardwareType', 'Hardware Type'],
    ['finishType', 'Finish Type'],
    ['stickSuggestion', 'Stick Suggestion'],
  ];

  return map
    .map(([key, label]) => {
      const entry = confidenceByArea[key];
      if (!entry) return null;
      return toConfidenceChip(key, label, entry);
    })
    .filter(Boolean);
}

function buildContributorSections(summary = {}) {
  const highlights = summary?.contributorHighlights || {};

  return Object.entries(highlights)
    .map(([key, entry]) => {
      const topContributors = Array.isArray(entry?.topContributors)
        ? entry.topContributors
            .map((contributor) => ({
              ...contributor,
              label: prettifyContributorKey(contributor?.contributorKey),
            }))
            .filter(Boolean)
        : [];

      if (!topContributors.length) return null;

      return {
        key,
        label: entry?.label || prettifyContributorKey(key),
        score: round2(entry?.score || 0),
        confidence01: round2(entry?.confidence01 || 0),
        confidencePercent: pct(entry?.confidence01 || 0),
        topContributors,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

export function buildCraftsmanDisplayModel(input = {}) {
  const summary =
    input?.overview && input?.recommendedSpecs
      ? input
      : generateCraftsmanSummary(input);

  return {
    overview: {
      headline: 'Ober AI Craftsman Summary',
      summary: summary.overview || '',
      confidence01: round2(summary.confidence01 || 0),
      confidencePercent: pct(summary.confidence01 || 0),
      tonalSummary: summary?.rationale?.tonalSummary || '',
    },

    recommendations: buildTopRecommendations(summary),

    tuning: {
      cards: buildTuningCards(summary.legacyTuning),
      why: Array.isArray(summary?.rationale?.legacyWhy)
        ? summary.rationale.legacyWhy
        : [],
      sweetSpots: summary?.legacyTuning?.sweetSpots || [],
      axis: summary?.legacyTuning?.axis || null,
      legacyCenterHz: summary?.legacyTuning?.legacyCenterHz || null,
      lowestHz: summary?.legacyTuning?.lowestHz || null,
      highestHz: summary?.legacyTuning?.highestHz || null,
    },

    callouts: buildPrimaryCallouts(summary),

    contributors: buildContributorSections(summary),

    confidence: {
      overallConfidence01: round2(summary.confidence01 || 0),
      overallConfidencePercent: pct(summary.confidence01 || 0),
      byArea: buildConfidenceGroups(summary.confidenceByArea),
    },

    notes: {
      shortSummary: summary?.drafts?.shortSummary || '',
      builderNotes: Array.isArray(summary?.drafts?.builderNotes)
        ? summary.drafts.builderNotes
        : [],
    },

    raw: summary,
  };
}

export default buildCraftsmanDisplayModel;