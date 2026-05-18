// src/utils/legacyPrint/scoring/scoringConstants.js

export const SCORE_MIN = 1;

export const SCORE_MAX = 10;

export const SCORE_NEUTRAL = 5;

export const SHELL_FIELD_WEIGHTS = {

  shellConstruction: 1,

  shellMaterial1: 0.9,

  shellMaterial2: 0.35,

  shellMaterial3: 0.25,

  shellThicknessMm: 0.85,

  plyCount: 0.45,

  reinforcementRings: 0.45,

  bearingEdge: 0.75,

  snareBedType: 0.45,

  diameter: 0.5,

  depth: 0.65,

  finishType: 0.2,

};

export const STOCK_CONFIG_WEIGHTS = {

  hoopType: 0.55,

  stockBatterHead: 0.35,

  stockResoHead: 0.25,

  stockSnareWires: 0.35,

  lugCount: 0.15,

};

export const MODIFIED_CONFIG_WEIGHTS = {

  hoopType: 0.6,

  batterHead: 0.45,

  resoHead: 0.3,

  snareWires: 0.4,

};

export const CONFIDENCE_LEVELS = {

  HIGH: 'high',

  MEDIUM: 'medium',

  LOW: 'low',

};

export function clampScore(value) {

  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Number(value.toFixed(2))));

}