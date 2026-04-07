// src/utils/spider/axes.js

export const INTERNAL_SPIDER_AXES = Object.freeze([
  'attack',
  'sustain',
  'warmth',
  'projection',
  'brightness',
  'sensitivity',
  'control',
]);

export const PUBLIC_SPIDER_AXES = Object.freeze([
  'attack',
  'sustain',
  'warmth',
  'projection',
  'brightness',
]);

export const SPIDER_AXIS_LABELS = Object.freeze({
  attack: 'Attack',
  sustain: 'Sustain',
  warmth: 'Warmth',
  projection: 'Projection',
  brightness: 'Brightness',
  sensitivity: 'Sensitivity',
  control: 'Control',
});

export const SPIDER_AXIS_DESCRIPTIONS = Object.freeze({
  attack: 'How immediate and defined the initial strike feels.',
  sustain: 'How long the drum continues to ring after the strike.',
  warmth: 'How much the tone leans toward fuller, rounder low-mid character.',
  projection: 'How strongly the drum carries outward into the room or mix.',
  brightness: 'How much upper-frequency clarity and bite are emphasized.',
  sensitivity: 'How easily the drum responds to lighter touch and dynamic detail.',
  control: 'How contained, dry, or overtone-managed the drum feels.',
});

export const DEFAULT_SPIDER_PROFILE = Object.freeze({
  attack: 5,
  sustain: 5,
  warmth: 5,
  projection: 5,
  brightness: 5,
  sensitivity: 5,
  control: 5,
});

export const SPIDER_VALUE_RANGE = Object.freeze({
  min: 1,
  max: 10,
});

export function isValidSpiderAxis(axis) {
  return INTERNAL_SPIDER_AXES.includes(axis);
}

export function clampSpiderValue(value, min = SPIDER_VALUE_RANGE.min, max = SPIDER_VALUE_RANGE.max) {
  const num = Number(value);

  if (!Number.isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function normalizeSpiderProfile(profile = {}, axes = INTERNAL_SPIDER_AXES) {
  return axes.reduce((acc, axis) => {
    acc[axis] = clampSpiderValue(
      profile?.[axis] ?? DEFAULT_SPIDER_PROFILE[axis] ?? SPIDER_VALUE_RANGE.min
    );
    return acc;
  }, {});
}

export function toPublicSpiderDataset(profile = {}) {
  const normalized = normalizeSpiderProfile(profile, INTERNAL_SPIDER_AXES);
  return PUBLIC_SPIDER_AXES.map((axis) => normalized[axis]);
}

export function getSpiderAxisLabel(axis) {
  return SPIDER_AXIS_LABELS[axis] || axis;
}