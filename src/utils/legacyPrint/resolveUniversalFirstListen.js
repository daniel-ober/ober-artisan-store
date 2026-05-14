/**

 * resolveUniversalFirstListen.js

 * Ober LegacyPrint™ Voicing Engine — Universal First Listen Resolver

 *

 * Single source of truth for First Listen output.

 *

 * Input:

 *   {

 *     profile: { attack, brightness, projection, sustain, warmth, sensitivity, control },

 *     spec: {},

 *     source: 'heritage' | 'feuzon' | 'soundlegend' | 'benchmark' | 'universal'

 *   }

 *

 * Output:

 *   {

 *     title,

 *     baseTitle,

 *     nodes,

 *     summary,

 *     nodeReads,

 *     visualProfile,

 *     ruleFamily,

 *     resolverMeta

 *   }

 */

const NODES = [

  'attack',

  'brightness',

  'projection',

  'sustain',

  'warmth',

  'sensitivity',

  'control',

];

const NODE_LABELS = {

  attack: 'Attack',

  brightness: 'Brightness',

  projection: 'Projection',

  sustain: 'Sustain',

  warmth: 'Warmth',

  sensitivity: 'Sensitivity',

  control: 'Control',

};

const NODE_DEFINITIONS = {

  attack:

    'How quickly the drum responds when it is hit — from softer and rounder to quicker and more defined.',

  brightness:

    'How much crisp top-end detail you hear — from darker and smoother to clearer and snappier.',

  projection:

    'How forward the drum feels in the room or mix — not just louder, but easier to notice and carry outward.',

  sustain:

    'How long the sound keeps going after the hit — from short and tight to more open and ringing.',

  warmth:

    'How full, woody, and body-rich the center of the sound feels — from lean and clean to deeper and rounder.',

  sensitivity:

    'How easily the drum responds to lighter playing — especially soft notes, ghost notes, and small changes in touch.',

  control:

    'How focused and organized the sound feels — less wide or ringy, more shaped and easy to place.',

};

/**

 * Values inside this distance are treated as practical ties.

 * This prevents tiny numeric differences from creating random-feeling flips.

 */

const DEADBAND = 0.08;

/**

 * Tie priority is intentionally musical, not alphabetical.

 * In close calls, First Listen should favor immediately-heard traits first.

 */

const DEFAULT_TIE_PRIORITY = [

  'attack',

  'control',

  'brightness',

  'projection',

  'sensitivity',

  'sustain',

  'warmth',

];

const DEEP_TIE_PRIORITY = [

  'warmth',

  'projection',

  'sustain',

  'control',

  'attack',

  'sensitivity',

  'brightness',

];

const OPEN_TIE_PRIORITY = [

  'sensitivity',

  'sustain',

  'warmth',

  'projection',

  'attack',

  'brightness',

  'control',

];

const clamp = (value, min = 1, max = 10) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const toLower = (value) => String(value || '').toLowerCase();

const includesAny = (value, needles = []) => {

  const text = toLower(value);

  return needles.some((needle) => text.includes(toLower(needle)));

};

const firstFiniteNumber = (...values) => {

  for (const value of values) {

    const direct = Number(value);

    if (Number.isFinite(direct)) return direct;

    const match = String(value ?? '').match(/(\d+(?:\.\d+)?)/);

    if (match) {

      const parsed = Number(match[1]);

      if (Number.isFinite(parsed)) return parsed;

    }

  }

  return null;

};

function normalizeSpec(spec = {}) {

  const width = firstFiniteNumber(

    spec.width,

    spec.diameter,

    spec.size,

    spec.shellDiameter

  );

  const depth = firstFiniteNumber(spec.depth, spec.shellDepth);

  const lugQuantity = firstFiniteNumber(

    spec.lugQuantity,

    spec.lugCount,

    spec.lugs

  );

  const staveCount = firstFiniteNumber(spec.staveCount, spec.staves);

  const shellThicknessMm = firstFiniteNumber(

    spec.shellThicknessMm,

    spec.thicknessMm,

    spec.shellThickness,

    spec.thickness

  );

  const shellConstruction =

    spec.shellConstruction ||

    spec.constructionKey ||

    spec.construction ||

    spec.shellType ||

    '';

  const shellMaterial =

    spec.shellMaterial ||

    spec.material ||

    spec.primarySpecies ||

    spec.woodSpeciesLabel ||

    spec.woodSpecies ||

    spec.metalMaterial ||

    spec.acrylicType ||

    '';

  const finishTreatment =

    spec.finishTreatment || spec.finish || spec.scorchDepth || spec.torchDepth || '';

  const hoopType = spec.hoopType || spec.hoops || '';

  const bearingEdge = spec.bearingEdge || spec.edge || '';

  const reRings = spec.reRings || spec.reinforcementRings || '';

  const tuning = spec.tuning || spec.tension || spec.tuningPreference || '';

  const batterHead = spec.batterHead || spec.drumhead || spec.head || '';

  const snareSideHead = spec.snareSideHead || spec.resonantHead || '';

  const snareWireCount = firstFiniteNumber(

    spec.snareWireCount,

    spec.wireCount

  );

  return {

    ...spec,

    width: width ?? 14,

    diameter: width ?? 14,

    depth: depth ?? 5.5,

    lugQuantity: lugQuantity ?? 8,

    lugCount: lugQuantity ?? 8,

    staveCount: staveCount ?? null,

    shellThicknessMm: shellThicknessMm ?? null,

    shellThickness: shellThicknessMm ?? null,

    shellConstruction,

    construction: shellConstruction,

    shellMaterial,

    material: shellMaterial,

    finishTreatment,

    finish: finishTreatment,

    hoopType,

    bearingEdge,

    reRings,

    tuning,

    batterHead,

    snareSideHead,

    snareWireCount: snareWireCount ?? null,

  };

}

function classifyDepth(spec = {}) {

  const diameter = Number(spec.width || spec.diameter || 14);

  const depth = Number(spec.depth || 5.5);

  if (!Number.isFinite(diameter) || !Number.isFinite(depth) || diameter <= 0) {

    return 'standard';

  }

  const ratio = depth / diameter;

  if (ratio <= 0.38) return 'veryShallow';

  if (ratio < 0.44) return 'shallow';

  if (ratio >= 0.6) return 'deep';

  if (ratio >= 0.55) return 'mediumDeep';

  return 'standard';

}

function getThicknessClass(spec = {}) {

  const thickness = Number(spec.shellThicknessMm);

  if (!Number.isFinite(thickness)) return 'unknown';

  if (thickness <= 7) return 'thin';

  if (thickness <= 9) return 'mediumThin';

  if (thickness < 12) return 'medium';

  if (thickness <= 15) return 'mediumThick';

  return 'thick';

}

function hasReRings(spec = {}) {

  if (spec.hasReRings === true) return true;

  if (spec.hasReRings === false) return false;

  const value = toLower(spec.reRings || spec.reinforcementRings);

  if (!value || value === 'none' || value === 'no' || value === 'false') {

    return false;

  }

  return true;

}

function isHeritageOakStave(spec = {}) {

  const material = toLower(spec.shellMaterial || spec.material);

  const construction = toLower(spec.shellConstruction || spec.construction);

  return includesAny(material, ['oak']) && includesAny(construction, ['stave']);

}

function normalizeProfile(profile = {}) {

  return NODES.reduce((acc, node) => {

    acc[node] = clamp(profile?.[node] ?? 5, 1, 10);

    return acc;

  }, {});

}

function buildHeritageOakFirstListenModifiers(spec = {}) {

  const modifiers = NODES.reduce((acc, node) => {

    acc[node] = 0;

    return acc;

  }, {});

  const material = toLower(spec.shellMaterial || spec.material);

  const construction = toLower(spec.shellConstruction || spec.construction);

  const finish = toLower(spec.finishTreatment || spec.finish || spec.scorchDepth);

  const hoop = toLower(spec.hoopType);

  const diameter = Number(spec.width || spec.diameter || 14);

  const depth = Number(spec.depth || 5.5);

  const thickness = Number(spec.shellThicknessMm || spec.shellThickness || 10);

  const isOak = includesAny(material, ['oak']);

  const isStave = includesAny(construction, ['stave']);

  if (!isOak || !isStave) {

    return modifiers;

  }

  const depthOffset = Number.isFinite(depth) ? depth - 6 : 0;

  const diameterOffset = Number.isFinite(diameter) ? diameter - 13 : 0;

  const thicknessOffset = Number.isFinite(thickness) ? thickness - 10 : 0;

  /**

   * Heritage Oak trim layer.

   * The universal resolver handles the main geometry curve.

   * This layer keeps oak/stave behavior audible without double-counting.

   */

  if (depthOffset !== 0) {

    const depthAmount = clamp(depthOffset / 2, -1, 1);

    if (depthAmount > 0) {

      modifiers.warmth += depthAmount * 0.07;

      modifiers.sustain += depthAmount * 0.06;

      modifiers.projection += depthAmount * 0.035;

      modifiers.attack -= depthAmount * 0.035;

      modifiers.brightness -= depthAmount * 0.025;

      modifiers.control -= depthAmount * 0.015;

    } else {

      const shallowAmount = Math.abs(depthAmount);

      modifiers.attack += shallowAmount * 0.07;

      modifiers.brightness += shallowAmount * 0.055;

      modifiers.control += shallowAmount * 0.035;

      modifiers.warmth -= shallowAmount * 0.055;

      modifiers.sustain -= shallowAmount * 0.045;

      modifiers.projection -= shallowAmount * 0.015;

    }

  }

  if (diameterOffset !== 0) {

    const diameterAmount = clamp(diameterOffset, -1, 1);

    if (diameterAmount > 0) {

      modifiers.warmth += diameterAmount * 0.09;

      modifiers.projection += diameterAmount * 0.06;

      modifiers.sustain += diameterAmount * 0.035;

      modifiers.attack -= diameterAmount * 0.06;

      modifiers.brightness -= diameterAmount * 0.045;

      modifiers.sensitivity -= diameterAmount * 0.035;

    } else {

      const compactAmount = Math.abs(diameterAmount);

      modifiers.attack += compactAmount * 0.09;

      modifiers.brightness += compactAmount * 0.075;

      modifiers.sensitivity += compactAmount * 0.055;

      modifiers.warmth -= compactAmount * 0.065;

      modifiers.projection -= compactAmount * 0.045;

      modifiers.sustain -= compactAmount * 0.025;

    }

  }

  if (thicknessOffset !== 0) {

    const thicknessAmount = clamp(thicknessOffset / 4, -1, 1);

    if (thicknessAmount > 0) {

      modifiers.attack += thicknessAmount * 0.07;

      modifiers.control += thicknessAmount * 0.09;

      modifiers.projection += thicknessAmount * 0.05;

      modifiers.sustain -= thicknessAmount * 0.06;

      modifiers.sensitivity -= thicknessAmount * 0.05;

      modifiers.warmth -= thicknessAmount * 0.025;

    } else {

      const thinAmount = Math.abs(thicknessAmount);

      modifiers.sensitivity += thinAmount * 0.09;

      modifiers.sustain += thinAmount * 0.075;

      modifiers.warmth += thinAmount * 0.065;

      modifiers.control -= thinAmount * 0.065;

      modifiers.attack -= thinAmount * 0.025;

    }

  }

  if (hasReRings(spec)) {

    modifiers.control += 0.1;

    modifiers.projection += 0.05;

    modifiers.sustain -= 0.05;

    modifiers.sensitivity -= 0.04;

    if (thickness <= 9) {

      modifiers.warmth += 0.08;

      modifiers.sustain += 0.04;

      modifiers.sensitivity += 0.025;

    }

  }

  if (includesAny(finish, ['light'])) {

    modifiers.sensitivity += 0.1;

    modifiers.sustain += 0.08;

    modifiers.warmth += 0.04;

    modifiers.control -= 0.06;

    modifiers.attack += 0.02;

  }

  if (includesAny(finish, ['medium torch', 'medium'])) {

    modifiers.warmth += 0.04;

    modifiers.control += 0.04;

    modifiers.attack += 0.02;

  }

  if (includesAny(finish, ['blackened', 'black stain', 'black stained', 'blacked'])) {

    modifiers.control += 0.12;

    modifiers.attack += 0.04;

    modifiers.sustain -= 0.09;

    modifiers.sensitivity -= 0.08;

    modifiers.brightness -= 0.06;

    modifiers.warmth -= 0.025;

  }

  if (includesAny(hoop, ['die-cast', 'die cast', 'diecast'])) {

    modifiers.control += 0.05;

    modifiers.attack += 0.04;

    modifiers.sustain -= 0.04;

  }

  if (includesAny(hoop, ['triple', 'flange', 'flanged'])) {

    modifiers.sustain += 0.04;

    modifiers.sensitivity += 0.03;

    modifiers.control -= 0.02;

  }

  return modifiers;

}

function mergeModifiers(...modifierSets) {

  return NODES.reduce((acc, node) => {

    acc[node] = modifierSets.reduce((sum, modifiers) => {

      return sum + Number(modifiers?.[node] || 0);

    }, 0);

    return acc;

  }, {});

}

function buildSpecModifiers(spec = {}) {

  const modifiers = NODES.reduce((acc, node) => {

    acc[node] = 0;

    return acc;

  }, {});

  const depthClass = classifyDepth(spec);

  const thicknessClass = getThicknessClass(spec);

  const construction = toLower(spec.shellConstruction || spec.construction);

  const material = toLower(spec.shellMaterial || spec.material);

  const hoop = toLower(spec.hoopType);

  const edge = toLower(spec.bearingEdge);

  const finish = toLower(spec.finishTreatment || spec.finish);

  const tuning = toLower(spec.tuning || spec.tension);

  const lugQuantity = Number(spec.lugQuantity || spec.lugCount || 8);

  const staveCount = Number(spec.staveCount || 0);

  const diameter = Number(spec.width || spec.diameter || 14);

  const depth = Number(spec.depth || 5.5);

  /**

   * Depth guardrails.

   */

  const referenceDepth = 6;

  const depthOffset = Number.isFinite(depth) ? depth - referenceDepth : 0;

  const depthAmount = clamp(depthOffset / 2, -1, 1);

  if (depthAmount < 0) {

    const shallowAmount = Math.abs(depthAmount);

    modifiers.attack += shallowAmount * 0.2;

    modifiers.control += shallowAmount * 0.14;

    modifiers.brightness += shallowAmount * 0.12;

    modifiers.projection -= shallowAmount * 0.04;

    modifiers.sustain -= shallowAmount * 0.12;

    modifiers.warmth -= shallowAmount * 0.16;

  }

  if (depthAmount > 0) {

    modifiers.warmth += depthAmount * 0.22;

    modifiers.sustain += depthAmount * 0.18;

    modifiers.projection += depthAmount * 0.1;

    modifiers.attack -= depthAmount * 0.1;

    modifiers.brightness -= depthAmount * 0.08;

    modifiers.control -= depthAmount * 0.04;

  }

  /**

   * Diameter guardrails.

   */

  if (diameter <= 12) {

    modifiers.attack += 0.18;

    modifiers.brightness += 0.14;

    modifiers.sensitivity += 0.08;

    modifiers.warmth -= 0.12;

    modifiers.projection -= 0.06;

  }

  if (diameter === 13) {

    modifiers.attack += 0.04;

    modifiers.control += 0.02;

  }

  if (diameter >= 14) {

    modifiers.warmth += 0.16;

    modifiers.projection += 0.1;

    modifiers.sustain += 0.04;

    modifiers.attack -= 0.08;

    modifiers.brightness -= 0.04;

  }

  /**

   * Construction guardrails.

   */

  if (includesAny(construction, ['stave'])) {

    modifiers.warmth += 0.12;

    modifiers.sustain += 0.1;

    modifiers.projection += 0.04;

    if (staveCount >= 20) {

      modifiers.control += 0.06;

      modifiers.attack += 0.04;

      modifiers.sustain -= 0.03;

    }

    if (staveCount > 0 && staveCount <= 12) {

      modifiers.warmth += 0.08;

      modifiers.sustain += 0.06;

      modifiers.control -= 0.04;

    }

  }

  if (includesAny(construction, ['ply', 'laminate'])) {

    modifiers.attack += 0.12;

    modifiers.control += 0.1;

    modifiers.sustain -= 0.06;

  }

  if (includesAny(construction, ['solid', 'steam', 'bent', 'single ply'])) {

    modifiers.sensitivity += 0.1;

    modifiers.warmth += 0.08;

    modifiers.sustain += 0.08;

  }

  if (includesAny(construction, ['metal'])) {

    modifiers.attack += 0.16;

    modifiers.brightness += 0.18;

    modifiers.projection += 0.14;

    modifiers.warmth -= 0.16;

  }

  if (includesAny(construction, ['acrylic'])) {

    modifiers.projection += 0.16;

    modifiers.brightness += 0.12;

    modifiers.attack += 0.08;

    modifiers.warmth -= 0.1;

  }

  /**

   * Material guardrails.

   */

  if (includesAny(material, ['oak'])) {

    modifiers.attack += 0.08;

    modifiers.projection += 0.12;

    modifiers.warmth += 0.02;

  }

  if (includesAny(material, ['maple'])) {

    modifiers.attack += 0.06;

    modifiers.brightness += 0.08;

    modifiers.warmth += 0.04;

  }

  if (includesAny(material, ['walnut'])) {

    modifiers.warmth += 0.16;

    modifiers.sustain += 0.08;

    modifiers.brightness -= 0.08;

  }

  if (includesAny(material, ['mahogany', 'sapele'])) {

    modifiers.warmth += 0.14;

    modifiers.sensitivity += 0.08;

    modifiers.brightness -= 0.04;

  }

  if (includesAny(material, ['birch'])) {

    modifiers.attack += 0.12;

    modifiers.brightness += 0.1;

    modifiers.projection += 0.08;

    modifiers.sustain -= 0.06;

  }

  if (includesAny(material, ['brass'])) {

    modifiers.brightness += 0.18;

    modifiers.projection += 0.16;

    modifiers.sustain += 0.08;

    modifiers.warmth += 0.04;

  }

  if (includesAny(material, ['steel'])) {

    modifiers.attack += 0.16;

    modifiers.brightness += 0.2;

    modifiers.projection += 0.14;

    modifiers.warmth -= 0.12;

  }

  if (includesAny(material, ['aluminum'])) {

    modifiers.attack += 0.12;

    modifiers.control += 0.1;

    modifiers.brightness += 0.08;

    modifiers.sustain -= 0.08;

  }

  /**

   * Thickness guardrails.

   * 12mm+ must read as focused/thick enough to affect First Listen.

   */

  if (thicknessClass === 'thin') {

    modifiers.sensitivity += 0.16;

    modifiers.sustain += 0.12;

    modifiers.warmth += 0.1;

    modifiers.control -= 0.1;

    modifiers.attack -= 0.04;

  }

  if (thicknessClass === 'mediumThin') {

    modifiers.sensitivity += 0.08;

    modifiers.sustain += 0.06;

    modifiers.warmth += 0.06;

  }

  if (thicknessClass === 'medium') {

    modifiers.control += 0.04;

    modifiers.attack += 0.03;

  }

  if (thicknessClass === 'mediumThick') {

    modifiers.attack += 0.16;

    modifiers.control += 0.2;

    modifiers.projection += 0.12;

    modifiers.sustain -= 0.14;

    modifiers.sensitivity -= 0.08;

    modifiers.warmth -= 0.04;

  }

  if (thicknessClass === 'thick') {

    modifiers.attack += 0.2;

    modifiers.control += 0.24;

    modifiers.projection += 0.14;

    modifiers.sustain -= 0.16;

    modifiers.sensitivity -= 0.12;

    modifiers.warmth -= 0.06;

  }

  /**

   * Lug count guardrails.

   */

  if (Number.isFinite(lugQuantity)) {

    if (lugQuantity <= 6) {

      modifiers.sustain += 0.08;

      modifiers.sensitivity += 0.08;

      modifiers.warmth += 0.04;

      modifiers.control -= 0.08;

      modifiers.attack -= 0.04;

    }

    if (lugQuantity >= 10) {

      modifiers.control += 0.12;

      modifiers.attack += 0.08;

      modifiers.projection += 0.04;

      modifiers.sustain -= 0.08;

      modifiers.sensitivity -= 0.04;

    }

  }

  /**

   * Hoop guardrails.

   */

  if (includesAny(hoop, ['die-cast', 'die cast', 'diecast'])) {

    modifiers.control += 0.16;

    modifiers.attack += 0.12;

    modifiers.projection += 0.04;

    modifiers.sustain -= 0.12;

    modifiers.sensitivity -= 0.06;

  }

  if (includesAny(hoop, ['triple', 'flange', 'flanged'])) {

    modifiers.sustain += 0.06;

    modifiers.sensitivity += 0.04;

    modifiers.control -= 0.03;

  }

  if (includesAny(hoop, ['wood'])) {

    modifiers.warmth += 0.14;

    modifiers.sustain += 0.08;

    modifiers.attack -= 0.06;

  }

  /**

   * Bearing edge guardrails.

   */

  if (includesAny(edge, ['45', 'sharp'])) {

    modifiers.attack += 0.12;

    modifiers.brightness += 0.08;

    modifiers.sensitivity += 0.04;

  }

  if (includesAny(edge, ['round', 'roundover', 'soft'])) {

    modifiers.warmth += 0.12;

    modifiers.sustain += 0.08;

    modifiers.attack -= 0.04;

    modifiers.brightness -= 0.04;

  }

  /**

   * Finish / treatment guardrails.

   */

  if (includesAny(finish, ['blackened', 'black stain', 'black stained', 'blacked'])) {

    modifiers.control += 0.12;

    modifiers.sustain -= 0.08;

    modifiers.sensitivity -= 0.08;

    modifiers.brightness -= 0.06;

  }

  if (includesAny(finish, ['light'])) {

    modifiers.sensitivity += 0.08;

    modifiers.sustain += 0.06;

    modifiers.control -= 0.04;

  }

  if (includesAny(finish, ['medium torch', 'torch'])) {

    modifiers.warmth += 0.02;

    modifiers.control += 0.02;

  }

  if (includesAny(finish, ['gloss', 'lacquer'])) {

    modifiers.brightness += 0.05;

    modifiers.attack += 0.04;

  }

  if (includesAny(finish, ['oil', 'wax', 'satin'])) {

    modifiers.warmth += 0.06;

    modifiers.sensitivity += 0.04;

  }

  /**

   * Tuning guardrails.

   */

  if (includesAny(tuning, ['high'])) {

    modifiers.attack += 0.1;

    modifiers.brightness += 0.12;

    modifiers.projection += 0.06;

    modifiers.warmth -= 0.08;

    modifiers.sustain -= 0.04;

  }

  if (includesAny(tuning, ['low'])) {

    modifiers.warmth += 0.12;

    modifiers.sustain += 0.1;

    modifiers.attack -= 0.06;

    modifiers.brightness -= 0.08;

  }

  /**

   * Re-ring guardrails.

   */

  if (hasReRings(spec)) {

    modifiers.control += 0.1;

    modifiers.projection += 0.04;

    modifiers.sustain -= 0.04;

    modifiers.sensitivity -= 0.04;

    if (thicknessClass === 'thin' || thicknessClass === 'mediumThin') {

      modifiers.warmth += 0.08;

      modifiers.sustain += 0.04;

      modifiers.sensitivity += 0.02;

    }

  }

  /**

   * Shallow drums should not resolve warmth-forward unless warmth is clearly dominant.

   */

  if (depthClass === 'veryShallow' || depthClass === 'shallow') {

    modifiers.warmth -= 0.1;

    modifiers.sustain -= 0.04;

    modifiers.control += 0.06;

  }

  /**

   * Extra-deep drums should not resolve as quick/bright unless those scores dominate.

   */

  if (depthClass === 'deep' && depth >= 7) {

    modifiers.warmth += 0.08;

    modifiers.sustain += 0.06;

    modifiers.projection += 0.04;

    modifiers.attack -= 0.04;

    modifiers.brightness -= 0.04;

  }

  return Object.fromEntries(

    Object.entries(modifiers).map(([key, value]) => [key, round2(value)])

  );

}

function applyModifiers(profile = {}, modifiers = {}) {

  return NODES.reduce((acc, node) => {

    acc[node] = round2(

      clamp(Number(profile[node] ?? 5) + Number(modifiers[node] ?? 0))

    );

    return acc;

  }, {});

}

function getTiePriority(spec = {}) {

  const depthClass = classifyDepth(spec);

  const thicknessClass = getThicknessClass(spec);

  if (depthClass === 'deep') {

    return DEEP_TIE_PRIORITY;

  }

  if (

    thicknessClass === 'thin' ||

    thicknessClass === 'mediumThin' ||

    hasReRings(spec)

  ) {

    return OPEN_TIE_PRIORITY;

  }

  return DEFAULT_TIE_PRIORITY;

}

function stableSortNodes(scored = {}, spec = {}) {

  const tiePriority = getTiePriority(spec);

  return [...NODES].sort((a, b) => {

    const aValue = Number(scored[a] ?? 5);

    const bValue = Number(scored[b] ?? 5);

    const diff = bValue - aValue;

    if (Math.abs(diff) > DEADBAND) {

      return diff;

    }

    const aPriority = tiePriority.indexOf(a);

    const bPriority = tiePriority.indexOf(b);

    if (aPriority !== bPriority) {

      return aPriority - bPriority;

    }

    return a.localeCompare(b);

  });

}

function enforceFirstListenGuardrails(nodes = [], scored = {}, spec = {}) {

  const depthClass = classifyDepth(spec);

  let resolved = [...nodes];

  const diameter = Number(spec.width || spec.diameter || 14);

  const depth = Number(spec.depth || 5.5);

  const thickness = Number(spec.shellThicknessMm || spec.shellThickness || 10);

  /**

   * Heritage Oak 13x6 focused-shell correction.

   * This belongs here — NOT in buildSpecModifiers — because it depends on scoredProfile.

   */

  if (

    isHeritageOakStave(spec) &&

    diameter >= 12.75 &&

    diameter <= 13.25 &&

    depth >= 5.75 &&

    depth <= 6.25

  ) {

    if (thickness >= 12) {

      const focusedOrder = stableSortNodes(scored, spec).filter((node) =>

        ['control', 'attack', 'projection', 'brightness'].includes(node)

      );

      return focusedOrder.slice(0, 3);

    }

    if (hasReRings(spec)) {

      const reRingOrder = stableSortNodes(scored, spec).filter((node) =>

        ['control', 'projection', 'brightness', 'attack'].includes(node)

      );

      return reRingOrder.slice(0, 3);

    }

  }

  const hasNode = (node) => resolved.includes(node);

  const moveIntoTopThree = (node, preferredIndex = 2) => {

    if (hasNode(node)) return;

    resolved = resolved.filter((item) => item !== node);

    resolved.splice(preferredIndex, 0, node);

    resolved = resolved.slice(0, 3);

  };

  const removeFromTopThree = (node) => {

    if (!hasNode(node)) return;

    resolved = resolved.filter((item) => item !== node);

    const replacement = stableSortNodes(scored, spec).find(

      (candidate) => !resolved.includes(candidate)

    );

    if (replacement) resolved.push(replacement);

    resolved = resolved.slice(0, 3);

  };

  const warmth = Number(scored.warmth ?? 5);

  const attack = Number(scored.attack ?? 5);

  const brightness = Number(scored.brightness ?? 5);

  const control = Number(scored.control ?? 5);

  const sustain = Number(scored.sustain ?? 5);

  const projection = Number(scored.projection ?? 5);

  /**

   * Shallow drum correction.

   */

  if (depthClass === 'veryShallow' || depthClass === 'shallow') {

    if (hasNode('warmth') && warmth < attack + 0.2 && warmth < control + 0.2) {

      removeFromTopThree('warmth');

      moveIntoTopThree('control', 2);

    }

    if (!hasNode('attack')) moveIntoTopThree('attack', 0);

    if (brightness >= control - 0.2 && !hasNode('brightness')) {

      moveIntoTopThree('brightness', 1);

    }

    if (!hasNode('control')) moveIntoTopThree('control', 2);

  }

  /**

   * Deep drum correction.

   */

  if (depthClass === 'deep') {

    if (warmth >= attack - 0.2 && !hasNode('warmth')) {

      moveIntoTopThree('warmth', 0);

    }

    if (projection >= control - 0.2 && !hasNode('projection')) {

      moveIntoTopThree('projection', 1);

    }

    if (sustain >= brightness - 0.15 && !hasNode('sustain')) {

      moveIntoTopThree('sustain', 2);

    }

  }

  return resolved.slice(0, 3);

}

function buildTitle(nodes = [], spec = {}) {

  const [first, second, third] = nodes;

  const signature = nodes.join('|');

  const depthClass = classifyDepth(spec);

  const exactTitles = {

    'attack|brightness|control': 'Quick snap with clean control',

    'attack|control|brightness': 'Quick snap with clean control',

    'attack|brightness|sensitivity': 'Quick touch with clear snap',

    'brightness|sensitivity|attack': 'Clear touch with quick response',

    'brightness|control|attack': 'Clear edge with quick control',

    'brightness|control|sustain': 'Clear edge with controlled bloom',

    'brightness|sustain|sensitivity': 'clear top edge with open bloom and responsive touch',

    'brightness|sensitivity|sustain': 'clear top edge with responsive touch and open bloom',

    'attack|projection|control': 'Punchy projection with clean control',

    'attack|control|projection': 'Punchy projection with clean control',

    'attack|projection|warmth': 'Clear body with forward carry',

    'attack|warmth|projection': 'Clear body with forward carry',

    'attack|warmth|control': 'Fuller center with quick response',

    'projection|control|attack': 'Forward throw with clean shape',

    'projection|attack|control': 'Forward throw with clean shape',

    'projection|warmth|sustain': 'Deep body with open carry',

    'projection|sustain|warmth': 'Deep body with open carry',

    'warmth|projection|sustain': 'Full body with extended bloom',

    'warmth|sustain|projection': 'Full body with extended bloom',

    'warmth|projection|control': 'Fuller body with focused room push',

    'warmth|control|projection': 'Fuller body with focused room push',

    'warmth|sustain|control': 'Warm bloom with clean control',

    'warmth|attack|control': 'Fuller center with quick response',

    'sensitivity|sustain|warmth': 'Open touch with woody bloom',

    'sensitivity|warmth|sustain': 'Open touch with woody bloom',

    'control|attack|projection': 'Focused power with clean shape',

    'control|projection|attack': 'Focused power with clean shape',

    'control|attack|brightness': 'Dry snap with clean control',

    'control|brightness|attack': 'Controlled snap with clear edge',

    'control|brightness|sustain': 'Controlled center with open edge',

    'control|projection|brightness': 'Focused throw with clear edge',

    'control|brightness|projection': 'Focused edge with forward carry',

    'control|warmth|projection': 'Focused body with forward carry',

    'sustain|warmth|control': 'Open bloom with warm control',

    'sustain|warmth|projection': 'Open bloom with forward body',

    'sustain|warmth|sensitivity': 'Open bloom with responsive body',

    'sustain|warmth|brightness': 'open bloom with warm body and clear top edge',

  };

  if (exactTitles[signature]) {

    return exactTitles[signature];

  }

  if (depthClass === 'veryShallow' || depthClass === 'shallow') {

    return 'Quick snap with clean control';

  }

  if (depthClass === 'deep') {

    return 'Full body with extended bloom';

  }

  const phraseByNode = {

    attack: 'quick response',

    brightness: 'clear top edge',

    projection: 'forward carry',

    sustain: 'open bloom',

    warmth: 'warm body',

    sensitivity: 'responsive touch',

    control: 'clean control',

  };

  const firstPhrase = phraseByNode[first] || 'balanced response';

  const secondPhrase = phraseByNode[second] || 'clear shape';

  const thirdPhrase = phraseByNode[third] || 'usable center';

  return `${firstPhrase} with ${secondPhrase} and ${thirdPhrase}`;

}

function buildSummary(nodes = [], spec = {}) {

  const hasWarmth = nodes.includes('warmth');

  const hasSustain = nodes.includes('sustain');

  const hasProjection = nodes.includes('projection');

  const hasAttack = nodes.includes('attack');

  const hasBrightness = nodes.includes('brightness');

  const hasSensitivity = nodes.includes('sensitivity');

  const hasControl = nodes.includes('control');

  if (hasBrightness && hasSensitivity && hasAttack) {

    return 'The drum is reading with a crisp upper edge, quick response, and enough touch detail to keep the smaller voice lively.';

  }

  if (hasBrightness && hasSustain && hasSensitivity) {

    return 'The drum is reading with clear top-end detail, responsive touch, and enough bloom to keep the shell moving.';

  }

  if (hasAttack && hasBrightness && hasControl) {

    return 'The drum is reading as quicker, clearer, and more controlled, with a defined edge and a more contained response.';

  }

  if (hasAttack && hasWarmth && hasControl) {

    return 'The drum is reading with a quicker front edge, a fuller center, and enough control to keep the note organized.';

  }

  if (hasControl && hasBrightness && hasSustain) {

    return 'The drum is reading with a controlled center, clear top edge, and enough bloom to keep the shell voice present.';

  }

  if (hasSustain && hasWarmth && hasControl) {

    return 'The drum is reading with more open bloom and wood body while still keeping the note shape organized.';

  }

  if (hasAttack && hasProjection && hasControl) {

    return 'The drum is reading with stronger front-edge definition, more outward push, and a cleaner, more organized note shape.';

  }

  if (hasWarmth && hasProjection && hasSustain) {

    return 'The drum is reading with more body, longer bloom, and broader room shape while still keeping the voice grounded.';

  }

  if (hasWarmth && hasProjection && hasControl) {

    return 'The drum is reading with a fuller body, stronger room presence, and enough organization to keep the note shaped and usable.';

  }

  if (hasSustain && hasWarmth && hasSensitivity) {

    return 'The drum is reading as open, touch-sensitive, and woody, with more shell movement and a breathing response under the hands.';

  }

  if (hasSensitivity && hasSustain && hasWarmth) {

    return 'The drum is reading as open, touch-sensitive, and woody, with more shell movement and a breathing response under the hands.';

  }

  if (hasAttack && hasProjection && hasWarmth) {

    return 'The drum is reading with a clear front edge, a warm center, and enough forward push to feel present without losing body.';

  }

  if (hasWarmth && hasSustain && hasProjection) {

    return 'The drum is reading with more open bloom, a fuller center, and a broader room shape.';

  }

  return 'The drum is reading with a clear first impression across its main voice traits, giving the player a quick read on body, response, and note shape.';

}

function buildNodeRead(key, value, spec = {}) {

  const depthClass = classifyDepth(spec);

  if (key === 'attack') {

    if (value >= 5.6) {

      return 'The stick speaks quickly and clearly, giving the first hit a defined front edge.';

    }

    return 'The note starts with a clear, natural edge before the shell tone opens behind it.';

  }

  if (key === 'brightness') {

    if (value >= 5.6) {

      return 'The upper edge is crisp and articulate, giving the drum extra clarity right away.';

    }

    return 'The top end adds enough clarity to define the note without making the drum feel overly sharp.';

  }

  if (key === 'projection') {

    if (depthClass === 'deep' || depthClass === 'mediumDeep') {

      return 'The voice pushes outward with more room shape, helping the drum carry beyond the player.';

    }

    return 'The note carries forward clearly, giving the drum presence without overpowering the center.';

  }

  if (key === 'sustain') {

    if (depthClass === 'deep' || depthClass === 'mediumDeep') {

      return 'The bloom hangs longer after the hit, making the shell depth part of the first impression.';

    }

    return 'The note keeps speaking after the hit, adding shell movement without becoming uncontrolled.';

  }

  if (key === 'warmth') {

    if (depthClass === 'veryShallow' || depthClass === 'shallow') {

      return 'The warmth reads as compact wood body, not a wide or bloom-heavy voice.';

    }

    if (depthClass === 'deep' || depthClass === 'mediumDeep') {

      return 'The center of the sound feels fuller and more body-rich right away.';

    }

    return 'The drum carries a grounded center with enough wood body to keep the voice musical.';

  }

  if (key === 'sensitivity') {

    return 'The drum gives back detail under the hands, especially in softer notes and lighter dynamic changes.';

  }

  if (key === 'control') {

    if (value >= 5.6) {

      return 'The note shape feels more locked in, with a cleaner decay and less loose spread.';

    }

    return 'The response stays organized enough to keep the note focused and easy to place.';

  }

  return 'This trait is one of the first things your ear is likely to catch in this configuration.';

}

function buildNodeReads(nodes = [], visualProfile = {}, spec = {}) {

  return nodes.map((key, index) => {

    const value = round2(visualProfile?.[key] ?? 5);

    return {

      key,

      label: NODE_LABELS[key] || key,

      rank: index + 1,

      definition: NODE_DEFINITIONS[key] || 'A core part of the first impression.',

      read: buildNodeRead(key, value, spec),

      value,

    };

  });

}

function buildRuleFamily(spec = {}, nodes = []) {

  const depthClass = classifyDepth(spec);

  const thicknessClass = getThicknessClass(spec);

  const parts = [`depth:${depthClass}`];

  const construction = toLower(spec.shellConstruction || spec.construction);

  const material = toLower(spec.shellMaterial || spec.material);

  const hoop = toLower(spec.hoopType);

  const finish = toLower(spec.finishTreatment || spec.finish);

  if (construction) {

    if (construction.includes('stave')) parts.push('construction:stave');

    else if (construction.includes('ply')) parts.push('construction:ply');

    else if (construction.includes('metal')) parts.push('construction:metal');

    else parts.push(`construction:${construction.split(' ')[0]}`);

  }

  if (material) {

    parts.push(`material:${material.split(' ')[0]}`);

  }

  if (thicknessClass !== 'unknown') {

    parts.push(`thickness:${thicknessClass}`);

  }

  if (hoop) {

    if (includesAny(hoop, ['die-cast', 'die cast', 'diecast'])) {

      parts.push('hoop:die-cast');

    } else if (includesAny(hoop, ['triple', 'flange'])) {

      parts.push('hoop:triple-flange');

    }

  }

  if (finish) {

    if (includesAny(finish, ['blackened', 'black stain', 'black stained'])) {

      parts.push('finish:blackened');

    } else if (includesAny(finish, ['light'])) {

      parts.push('finish:light');

    } else if (includesAny(finish, ['medium', 'torch'])) {

      parts.push('finish:medium-torch');

    }

  }

  parts.push(`nodes:${nodes.join('-')}`);

  return parts.join(' | ');

}

function resolveUniversalFirstListen({

  profile = {},

  spec = {},

  source = 'universal',

} = {}) {

  const normalizedSpec = normalizeSpec(spec);

  const rawProfile = normalizeProfile(profile);

  const baseSpecModifiers = buildSpecModifiers(normalizedSpec);

  const heritageOakModifiers = buildHeritageOakFirstListenModifiers(normalizedSpec);

  const specModifiers = mergeModifiers(baseSpecModifiers, heritageOakModifiers);

  const scoredProfile = applyModifiers(rawProfile, specModifiers);

  const initiallySortedNodes = stableSortNodes(scoredProfile, normalizedSpec);

  const guardedNodes = enforceFirstListenGuardrails(

    initiallySortedNodes.slice(0, 3),

    scoredProfile,

    normalizedSpec

  );

  const title = buildTitle(guardedNodes, normalizedSpec);

  const summary = buildSummary(guardedNodes, normalizedSpec);

  const visualProfile = NODES.reduce((acc, node) => {

    acc[node] = round2(scoredProfile[node]);

    return acc;

  }, {});

  const nodeReads = buildNodeReads(guardedNodes, visualProfile, normalizedSpec);

  const ruleFamily = buildRuleFamily(normalizedSpec, guardedNodes);

  return {

    title,

    baseTitle: title,

    nodes: guardedNodes,

    summary,

    nodeReads,

    visualProfile,

    ruleFamily,

    resolverMeta: {

      source,

      engine: 'resolveUniversalFirstListen',

      version: 'universal-first-listen-v1.0',

      deadband: DEADBAND,

      depthClass: classifyDepth(normalizedSpec),

      thicknessClass: getThicknessClass(normalizedSpec),

      rawProfile,

      specModifiers,

      scoredProfile: visualProfile,

      initialNodeOrder: initiallySortedNodes,

      finalNodeOrder: guardedNodes,

      normalizedSpec,

    },

  };

}

export { resolveUniversalFirstListen };

export default resolveUniversalFirstListen;