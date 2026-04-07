// src/utils/spider/explainSpiderProfile.js

import { INTERNAL_SPIDER_AXES, SPIDER_AXIS_LABELS } from './axes';

const round2 = (n) => Math.round(n * 100) / 100;

function toPercent(value01) {
  const num = Number(value01);
  if (!Number.isFinite(num)) return 0;
  return Math.round(Math.max(0, Math.min(1, num)) * 100);
}

function humanizeContributorKey(key = '') {
  const map = {
    headTension: 'head tension',
    headType: 'head type',
    bearingEdge: 'bearing edge',
    shellConstruction: 'shell construction',
    woodSpecies: 'wood species',
    depth: 'shell depth',
    diameter: 'shell diameter',
    shellThickness: 'shell thickness',
    hoopType: 'hoop type',
    hardwareType: 'hardware type',
    finish: 'finish',
    finishType: 'finish type',
    environmental: 'environment',
  };

  return (
    map[key] ||
    String(key || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/[-_]/g, ' ')
      .toLowerCase()
  );
}

function bucketScore(score) {
  const n = Number(score);

  if (!Number.isFinite(n)) return 'balanced';
  if (n >= 8.25) return 'very high';
  if (n >= 7.0) return 'high';
  if (n >= 5.75) return 'moderately high';
  if (n >= 4.25) return 'balanced';
  if (n >= 3.0) return 'moderately low';
  return 'low';
}

function axisInterpretation(axis, score) {
  const bucket = bucketScore(score);

  const copy = {
    attack: {
      'very high': 'very immediate and assertive at the front of the note',
      high: 'quick and defined on the front end',
      'moderately high': 'fairly articulate without becoming overly sharp',
      balanced: 'balanced between snap and softness',
      'moderately low': 'a little softer and broader on the initial strike',
      low: 'rounder and less immediate on the front edge',
    },
    sustain: {
      'very high': 'long-ringing and extended in decay',
      high: 'fairly long in decay',
      'moderately high': 'moderately open after the strike',
      balanced: 'balanced in decay length',
      'moderately low': 'somewhat contained after the strike',
      low: 'short and quick to get out of the way',
    },
    warmth: {
      'very high': 'very body-forward and warm',
      high: 'rich and warm-leaning',
      'moderately high': 'slightly fuller than neutral',
      balanced: 'balanced between body and clarity',
      'moderately low': 'a little leaner and more direct',
      low: 'more lean/clean than warm',
    },
    projection: {
      'very high': 'built to throw strongly into the room',
      high: 'strong and present outwardly',
      'moderately high': 'fairly good at carrying',
      balanced: 'balanced in outward presence',
      'moderately low': 'a bit more contained in the room',
      low: 'less about throw and more about contained tone',
    },
    brightness: {
      'very high': 'very clear and top-end forward',
      high: 'bright and articulate',
      'moderately high': 'clear without getting too sharp',
      balanced: 'balanced between brightness and softness',
      'moderately low': 'slightly darker than neutral',
      low: 'darker and less top-end forward',
    },
    sensitivity: {
      'very high': 'extremely willing to respond to lighter touch',
      high: 'very responsive under the hands',
      'moderately high': 'fairly receptive to lighter playing',
      balanced: 'balanced in touch response',
      'moderately low': 'a little less eager at very low dynamics',
      low: 'more demanding before it fully speaks',
    },
    control: {
      'very high': 'very contained and managed in overtone spread',
      high: 'focused and controlled',
      'moderately high': 'fairly tidy and contained',
      balanced: 'balanced between openness and control',
      'moderately low': 'a little more open and less contained',
      low: 'open and less damped/contained',
    },
  };

  return copy?.[axis]?.[bucket] || 'balanced in character';
}

function topContributorsForAxis(axisEntry, limit = 3) {
  return (axisEntry?.contributors || [])
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

export function explainSpiderAxis(spiderResult, axis) {
  const axisEntry = spiderResult?.axisBreakdown?.[axis];
  const axisLabel = SPIDER_AXIS_LABELS?.[axis] || axis;

  if (!axisEntry) {
    return null;
  }

  const top = topContributorsForAxis(axisEntry, 3);
  const contributorLabels = top.map((item) =>
    humanizeContributorKey(item.contributorKey)
  );

  let summary = `${axisLabel} lands at ${round2(axisEntry.score)}/10, which suggests the drum will feel ${axisInterpretation(axis, axisEntry.score)}.`;

  if (contributorLabels.length === 1) {
    summary += ` The main driver here is ${contributorLabels[0]}.`;
  } else if (contributorLabels.length === 2) {
    summary += ` The strongest drivers here are ${contributorLabels[0]} and ${contributorLabels[1]}.`;
  } else if (contributorLabels.length >= 3) {
    summary += ` The strongest drivers here are ${contributorLabels[0]}, ${contributorLabels[1]}, and ${contributorLabels[2]}.`;
  }

  return {
    axis,
    label: axisLabel,
    score: round2(axisEntry.score),
    confidence01: axisEntry.confidence01,
    confidencePercent: toPercent(axisEntry.confidence01),
    interpretation: axisInterpretation(axis, axisEntry.score),
    summary,
    contributors: top.map((item) => ({
      contributorKey: item.contributorKey,
      contributorLabel: humanizeContributorKey(item.contributorKey),
      sourceValue: round2(item.sourceValue),
      weight: round2(item.weight),
      weightedValue: round2(item.weightedValue),
      confidence: item.confidence,
      rationale: item.rationale,
      sourceType: item.sourceType,
    })),
  };
}

export function explainSpiderProfile(spiderResult) {
  if (!spiderResult?.profile) {
    return {
      summary: '',
      overallConfidence01: 0,
      overallConfidencePercent: 0,
      axes: [],
    };
  }

  const axes = INTERNAL_SPIDER_AXES.map((axis) =>
    explainSpiderAxis(spiderResult, axis)
  ).filter(Boolean);

  const profile = spiderResult.profile;

  const strongest = axes
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => item.label.toLowerCase());

  const weakest = axes
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 1)
    .map((item) => item.label.toLowerCase())[0];

  let summary = `This Ober character estimate leans toward ${axisInterpretation(
    'attack',
    profile.attack
  )}, ${axisInterpretation('warmth', profile.warmth)}, and ${axisInterpretation(
    'projection',
    profile.projection
  )}.`;

  if (strongest.length === 2) {
    summary += ` The most pronounced traits are ${strongest[0]} and ${strongest[1]}.`;
  }

  if (weakest) {
    summary += ` The least emphasized trait is ${weakest}.`;
  }

  return {
    summary,
    overallConfidence01: spiderResult.confidence01 ?? 0,
    overallConfidencePercent: toPercent(spiderResult.confidence01),
    axes,
  };
}

export default explainSpiderProfile;