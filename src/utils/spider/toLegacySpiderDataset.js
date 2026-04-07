// src/utils/spider/toLegacySpiderDataset.js

import { PUBLIC_SPIDER_AXES } from './axes';

/**
 * Converts a scored spider profile into the legacy dataset array
 * expected by the current SpiderChart component:
 *
 * ['Projection', 'Sustain', 'Brightness', 'Warmth', 'Attack']
 */
export function toLegacySpiderDataset(spiderResult) {
  const profile = spiderResult?.profile || {};

  return [
    Number(profile.projection ?? 5),
    Number(profile.sustain ?? 5),
    Number(profile.brightness ?? 5),
    Number(profile.warmth ?? 5),
    Number(profile.attack ?? 5),
  ];
}

/**
 * Optional helper if you want a label/value structure for future UI work.
 */
export function toLegacySpiderEntries(spiderResult) {
  const profile = spiderResult?.profile || {};

  return [
    { key: 'projection', label: 'Projection', value: Number(profile.projection ?? 5) },
    { key: 'sustain', label: 'Sustain', value: Number(profile.sustain ?? 5) },
    { key: 'brightness', label: 'Brightness', value: Number(profile.brightness ?? 5) },
    { key: 'warmth', label: 'Warmth', value: Number(profile.warmth ?? 5) },
    { key: 'attack', label: 'Attack', value: Number(profile.attack ?? 5) },
  ];
}

/**
 * Future-facing public profile reducer.
 */
export function toPublicSpiderProfile(spiderResult) {
  const profile = spiderResult?.profile || {};

  return PUBLIC_SPIDER_AXES.reduce((acc, axis) => {
    acc[axis] = Number(profile[axis] ?? 5);
    return acc;
  }, {});
}

export default toLegacySpiderDataset;