
import { resolveModifier } from './resolveModifier.js';

import { computeStockConfigProfile } from './computeStockConfigProfile.js';

import { computeModifiedConfigProfile } from './computeModifiedConfigProfile.js';

describe('resolveModifier batter head families', () => {

  test.each([

    ['batterHeads', 'clear', 'head_batter_clear_single_ply_medium'],

    ['batterHeads', 'g2 clear', 'head_batter_clear_two_ply_open'],

    ['batterHeads', 'black dot', 'head_batter_center_dot_controlled'],

    ['batterHeads', 'hydraulic', 'head_batter_hydraulic_dead_control'],

    ['batterHeads', 'hd dry', 'head_batter_dry_vented_controlled'],

    ['batterHeads', 'coated', 'head_batter_coated_single_ply_medium'],

    ['batterHeads', 'controlled', 'head_batter_coated_two_ply_controlled'],

  ])('resolves %s alias "%s"', (category, value, expectedId) => {

    const result = resolveModifier(category, value);

    expect(result.matched).toBe(true);

    expect(result.id).toBe(expectedId);

    expect(result.nodeDeltas).toBeDefined();

  });

});

describe('resolveModifier reso head families', () => {

  test.each([

    ['resoHeads', 'clear snare side', 'head_reso_clear_snare_side_standard'],

    ['resoHeads', 'hazy 300', 'head_reso_clear_snare_side_standard'],

    ['resoHeads', 'hazy 500', 'head_reso_heavy_snare_side_controlled'],

    ['resoHeads', 'hazy 200', 'head_reso_thin_snare_side_sensitive'],

  ])('resolves %s alias "%s"', (category, value, expectedId) => {

    const result = resolveModifier(category, value);

    expect(result.matched).toBe(true);

    expect(result.id).toBe(expectedId);

    expect(result.nodeDeltas).toBeDefined();

  });

});

describe('resolveModifier snare wire families', () => {

  test.each([

    ['snareWires', '20', 'wires_20_strand_standard_steel'],

    ['snareWires', '24', 'wires_24_strand_wide_response'],

    ['snareWires', '30', 'wires_30_plus_wide_high_contact'],

    ['snareWires', '42-strand', 'wires_30_plus_wide_high_contact'],

    ['snareWires', 'brass wires', 'wires_brass_dark_response'],

    ['snareWires', '16', 'wires_16_strand_open_response'],

  ])('resolves %s alias "%s"', (category, value, expectedId) => {

    const result = resolveModifier(category, value);

    expect(result.matched).toBe(true);

    expect(result.id).toBe(expectedId);

    expect(result.nodeDeltas).toBeDefined();

  });

});

describe('resolveModifier hoop families', () => {

  test.each([

    ['hoops', 'triple-flanged', 'hoop_triple_flanged_steel'],

    ['hoops', 'diecast', 'hoop_die_cast'],

    ['hoops', 'single flange', 'hoop_single_flanged_clip'],

    ['hoops', 's-hoop', 'hoop_inward_flange_controlled'],

    ['hoops', 'wood hoops', 'hoop_wood'],

  ])('resolves %s alias "%s"', (category, value, expectedId) => {

    const result = resolveModifier(category, value);

    expect(result.matched).toBe(true);

    expect(result.id).toBe(expectedId);

    expect(result.nodeDeltas).toBeDefined();

  });

});

describe('resolveModifier unknown fallback', () => {

  test('returns unknown fallback for unmapped value', () => {

    const result = resolveModifier('hoops', 'mystery moon hoop');

    expect(result.matched).toBe(false);

    expect(result.rawValue).toBe('mystery moon hoop');

  });

});

describe('stock and modified registry integration smoke tests', () => {

  const stockScores = {

    attack: 5,

    brightness: 5,

    projection: 5,

    sustain: 5,

    warmth: 5,

    sensitivity: 5,

    control: 5,

  };

  test('stock config applies registry-backed drivers with no unknowns', () => {

    const result = computeStockConfigProfile(

      {

        hoopType: 'diecast',

        stockBatterHead: 'hd dry',

        stockResoHead: 'hazy 300',

        stockSnareWires: '24',

        lugCount: 10,

      },

      { scores: stockScores }

    );

    expect(result.unknownComponents).toEqual([]);

    expect(result.appliedDrivers.length).toBeGreaterThanOrEqual(5);

    expect(result.scores.control).toBeGreaterThan(5);

  });

  test('modified config applies registry-backed drivers with no unknowns', () => {

    const result = computeModifiedConfigProfile(

      {},

      { scores: stockScores },

      {

        hoopType: 's-hoop',

        batterHead: 'controlled',

        resoHead: 'hazy 200',

        snareWires: '42',

      }

    );

    expect(result.unknownComponents).toEqual([]);

    expect(result.appliedDrivers.length).toBe(4);

    expect(result.scores.sensitivity).toBeGreaterThan(5);

  });

});



it('resolves Sound Arc hoop alias', () => {

  const resolved = resolveModifier(

    "hoops",

    "Sound Arc"

  );

  expect(resolved?.id).toBe("sound-arc-hoops");

});

it('resolves Tama Sound Arc hoop alias', () => {

  const resolved = resolveModifier(

    "hoops",

    "Tama Sound Arc Hoops"

  );

  expect(resolved?.id).toBe("sound-arc-hoops");

});

