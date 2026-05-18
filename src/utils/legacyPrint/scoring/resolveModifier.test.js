
import { resolveModifier } from './resolveModifier.js';

import { computeStockConfigProfile } from './computeStockConfigProfile.js';

describe('resolveModifier', () => {

  test('resolves known hoop modifier', () => {

    const result = resolveModifier('hoops', 'die-cast');

    expect(result.matched).toBe(true);

    expect(result.category).toBe('hoopType');

    expect(result.nodeDeltas.control).toBeGreaterThan(0);

  });

  test('resolves known batter head modifier', () => {

    const result = resolveModifier('batterHeads', 'coated');

    expect(result.matched).toBe(true);

    expect(result.category).toBe('batterHead');

    expect(result.nodeDeltas).toBeDefined();

  });

  test('resolves shorthand snare wire alias', () => {

    const result = resolveModifier('snareWires', '24');

    expect(result.matched).toBe(true);

    expect(result.category).toBe('snareWires');

    expect(result.nodeDeltas.sensitivity).toBeGreaterThan(0);

  });

  test('resolves reso head alias', () => {

    const result = resolveModifier('resoHeads', 'clear snare side');

    expect(result.matched).toBe(true);

    expect(result.category).toBe('resoHead');

    expect(result.nodeDeltas).toBeDefined();

  });

  test('returns unknown fallback for unmapped value', () => {

    const result = resolveModifier('hoops', 'mystery moon hoop');

    expect(result.matched).toBe(false);

    expect(result.rawValue).toBe('mystery moon hoop');

  });

});

describe('computeStockConfigProfile registry smoke test', () => {

  test('applies registry-backed stock drivers', () => {

    const bareShell = {

      scores: {

        attack: 5,

        brightness: 5,

        projection: 5,

        sustain: 5,

        warmth: 5,

        sensitivity: 5,

        control: 5,

      },

    };

    const record = {

      hoopType: 'die-cast',

      stockBatterHead: 'coated',

      stockResoHead: 'clear snare side',

      stockSnareWires: '24',

      lugCount: 10,

    };

    const result = computeStockConfigProfile(record, bareShell);

    expect(result.appliedDrivers.length).toBeGreaterThan(0);

    expect(result.unknownComponents).toEqual([]);

    expect(result.scores.control).toBeGreaterThan(5);

  });

});

