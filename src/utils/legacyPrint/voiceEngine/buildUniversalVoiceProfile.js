// src/utils/legacyPrint/voiceEngine/buildUniversalVoiceProfile.js

import { LEGACYPRINT_NODE_ORDER } from '../../../data/legacyPrint/voiceEngineTaxonomy.js';

import { buildHoopHardwareRead } from '../../../data/legacyPrint/hoopHardwareProfiles.js';

import {

  getShellConstructionProfile,

  normalizeConstructionNodeBias,

} from '../../../data/legacyPrint/shellConstructionProfiles.js';

import {

  buildShellMaterialRead,

  findShellMaterialKey,

} from '../../../data/legacyPrint/shellMaterialProfiles.js';

import { buildShellThicknessRead } from '../../../data/legacyPrint/shellThicknessProfiles.js';

import { buildDrumheadRead } from '../../../data/legacyPrint/drumheadProfiles.js';

import { buildReinforcementRead } from '../../../data/legacyPrint/reinforcementProfiles.js';

import { buildTuningRead } from '../../../data/legacyPrint/tuningProfiles.js';

import { buildFinishTreatmentRead } from '../../../data/legacyPrint/finishTreatmentProfiles.js';

import { buildBearingEdgeRead } from '../../../data/legacyPrint/bearingEdgeProfiles.js';

const DEFAULT_NODE_CENTER = 5;

const ENGINE_NODE_MIN = 1;

const ENGINE_NODE_MAX = 10;

/**

 * Global profile gain.

 *

 * The data files intentionally use small acoustic bias values so each category

 * stays tunable and doesn't blow up the engine by itself.

 *

 * This gain converts the combined acoustic bias into a useful 1–10 readout range.

 */

const UNIVERSAL_PROFILE_GAIN = 4.25;

/**

 * Interaction gain.

 *

 * Interaction rules are already written in direct node-score movement terms,

 * so this should stay lower than UNIVERSAL_PROFILE_GAIN.

 */

const UNIVERSAL_INTERACTION_GAIN = 1;

/**

 * Category-level influence weights.

 *

 * These are architecture weights, not final locked science values.

 * The purpose right now is to keep each acoustic category separated so we can tune

 * the model cleanly instead of hard-coding Ober-specific exceptions everywhere.

 *

 * Heaviest categories:

 * - shell construction

 * - shell material

 * - shell thickness

 * - bearing edge

 *

 * Secondary shaping categories:

 * - reinforcement

 * - hoop / hardware

 * - drumheads

 * - tuning

 * - finish / treatment

 */

export const UNIVERSAL_CATEGORY_WEIGHTS = {

  shellConstruction: 0.2,

  shellMaterial: 0.18,

  shellThickness: 0.14,

  reinforcement: 0.07,

  bearingEdge: 0.1,

  hoopHardware: 0.1,

  drumheads: 0.11,

  tuning: 0.06,

  finishTreatment: 0.04,

};

const round2 = (value) => Math.round(Number(value || 0) * 100) / 100;

const clamp = (value, min = ENGINE_NODE_MIN, max = ENGINE_NODE_MAX) => {

  const num = Number(value);

  if (!Number.isFinite(num)) return min;

  return Math.max(min, Math.min(max, num));

};

function normalizeText(value = '') {

  return String(value || '')

    .trim()

    .toLowerCase();

}

function buildNeutralNodeBias() {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = 0;

    return acc;

  }, {});

}

function normalizeNodeBias(nodeBias = {}) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = Number(nodeBias?.[nodeKey] || 0);

    return acc;

  }, {});

}

function applyWeightedBias(totalBias, nodeBias, weight = 1) {

  const normalizedBias = normalizeNodeBias(nodeBias);

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = round2(

      Number(acc[nodeKey] || 0) + normalizedBias[nodeKey] * weight

    );

    return acc;

  }, totalBias);

}

function buildProfileFromBias(totalBias = {}) {

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = round2(

      clamp(

        DEFAULT_NODE_CENTER +

          Number(totalBias[nodeKey] || 0) * UNIVERSAL_PROFILE_GAIN

      )

    );

    return acc;

  }, {});

}

function buildFallbackRead({

  id = 'unknown',

  label = 'Unknown',

  nodeBias = {},

  summary = '',

} = {}) {

  return {

    id,

    label,

    nodeBias: normalizeNodeBias(nodeBias),

    summary,

  };

}

function resolveShellConstructionKey(config = {}) {

  const rawValue =

    config.shellConstruction ||

    config.construction ||

    config.constructionKey ||

    'stave';

  const normalized = normalizeText(rawValue);

  if (normalized.includes('feuz') || normalized.includes('hybrid')) {

    if (

      normalized.includes('feuz') ||

      normalized.includes('stave interior') ||

      normalized.includes('steam bent exterior')

    ) {

      return 'feuzonHybrid';

    }

    return 'genericHybrid';

  }

  if (normalized.includes('stave')) return 'stave';

  if (normalized.includes('ply')) return 'ply';

  if (normalized.includes('steam')) return 'steamBent';

  if (normalized.includes('solid')) return 'solid';

  if (normalized.includes('metal')) return 'metalShell';

  if (normalized.includes('acrylic')) return 'acrylicShell';

  if (

    normalized.includes('composite') ||

    normalized.includes('carbon') ||

    normalized.includes('fiberglass')

  ) {

    return 'compositeOther';

  }

  return rawValue;

}

function normalizeConstructionContextKey(constructionKey = 'stave') {

  if (constructionKey === 'metalShell') return 'metal';

  if (constructionKey === 'acrylicShell') return 'acrylic';

  if (constructionKey === 'compositeOther') return 'composite';

  if (constructionKey === 'genericHybrid') return 'composite';

  return constructionKey;

}

function resolveShellConstructionRead(config = {}) {

  const constructionKey = resolveShellConstructionKey(config);

  const profile = getShellConstructionProfile(constructionKey);

  if (!profile) {

    return buildFallbackRead({

      id: constructionKey,

      label: constructionKey || 'Unknown Construction',

      nodeBias: config.shellConstructionNodeBias || {},

      summary:

        'Shell construction profile is using fallback bias because this construction key is not in the construction taxonomy yet.',

    });

  }

  return {

    id: constructionKey,

    constructionKey,

    label: profile.label,

    category: profile.category,

    description: profile.description,

    acousticRole: profile.acousticRole,

    interactionHints: profile.interactionHints || {},

    hybridModel: profile.hybridModel || null,

    nodeBias: normalizeConstructionNodeBias(constructionKey),

    summary: profile.acousticRole || profile.description || '',

  };

}

function resolveShellMaterialKey(config = {}) {

  const rawValue =

    config.shellMaterial ||

    config.primarySpecies ||

    config.material ||

    config.woodSpeciesLabel ||

    config.metalMaterial ||

    config.acrylicType ||

    'maple';

  return findShellMaterialKey(rawValue) || 'maple';

}

function resolveShellMaterialRead(config = {}) {

  const materialKey = resolveShellMaterialKey(config);

  const materialRead = buildShellMaterialRead(materialKey);

  return {

    id: materialKey,

    materialKey,

    ...materialRead,

    summary: materialRead.generalCharacter || materialRead.notes || '',

  };

}

function resolveShellThicknessRead(config = {}, constructionKey = 'stave') {

  const thicknessValue =

    config.shellThicknessMm ??

    config.thicknessMm ??

    config.shellThickness ??

    null;

  const thicknessRead = buildShellThicknessRead({

    thickness: thicknessValue,

    constructionKey,

    fallbackClass: config.shellThicknessClass || 'medium',

  });

  return {

    id: thicknessRead.thicknessMm || thicknessRead.classKey || 'unknown',

    label: thicknessRead.thicknessMm

      ? `${thicknessRead.thicknessMm}mm shell`

      : thicknessRead.label || 'Unknown Thickness',

    ...thicknessRead,

    nodeBias: normalizeNodeBias(thicknessRead.nodeBias),

    summary:

      thicknessRead.generalCharacter ||

      thicknessRead.notes ||

      'Shell thickness read resolved from shell thickness taxonomy.',

  };

}

function resolveFinishTreatmentRead(config = {}) {

  return buildFinishTreatmentRead({

    finish:

      config.finish ||

      config.finishTreatment ||

      config.scorchDepth ||

      config.torchDepth ||

      'Medium Torch',

    interiorTreatment: config.interiorTreatment || 'none',

    isOberBuild: Boolean(config.isOberBuild || config.oberLine),

  });

}

function resolveBearingEdgeRead(config = {}) {

  return buildBearingEdgeRead({

    bearingEdge:

      config.bearingEdge ||

      config.edgeProfile ||

      config.edges ||

      '45 Inner / Strong Outer Roundover',

    isOberBuild: Boolean(config.isOberBuild || config.oberLine),

  });

}

function resolveTuningRead(config = {}) {

  return buildTuningRead({

    drumType: config.drumType || 'snare',

    width: config.width || config.diameter || 14,

    tuningTarget: config.tuningTarget || config.tuning || 'medium',

    batterResoRelationship:

      config.batterResoRelationship ||

      config.tuningRelationship ||

      config.resoRelationship ||

      'balanced',

    fundamentalHz:

      config.fundamentalHz ||

      config.currentFundamentalHz ||

      config.targetFundamentalHz ||

      null,

  });

}

function moveNode(profile, nodeKey, amount) {

  if (!Object.prototype.hasOwnProperty.call(profile, nodeKey)) return;

  profile[nodeKey] += amount * UNIVERSAL_INTERACTION_GAIN;

}

function applyBasicInteractions(profile = {}, config = {}) {

  const adjusted = { ...profile };

  const depth = Number(config.depth);

  const diameter = Number(config.width || config.diameter);

  const shellThicknessMm = Number(

    config.shellThicknessMm || config.thicknessMm || config.shellThickness

  );

  const drumType = config.drumType || 'snare';

  const constructionKey = resolveShellConstructionKey(config);

  const materialKey = resolveShellMaterialKey(config);

  const hoopType = normalizeText(config.hoopType || '');

  const finish = normalizeText(

    config.finish || config.finishTreatment || config.scorchDepth || ''

  );

  const bearingEdge = normalizeText(

    config.bearingEdge || config.edgeProfile || config.edges || ''

  );

  /**

   * Depth / diameter interaction.

   *

   * Deeper drums generally add body, bloom, and perceived projection,

   * but reduce some immediacy.

   */

  if (Number.isFinite(depth) && Number.isFinite(diameter) && diameter > 0) {

    const depthRatio = depth / diameter;

    const isMetalShell = constructionKey === 'metalShell';

    const isAcrylicShell = constructionKey === 'acrylicShell';

    const isCompositeShell = constructionKey === 'compositeOther';

    const isNonWoodShell = isMetalShell || isAcrylicShell || isCompositeShell;

    if (depthRatio >= 0.5) {

      if (isAcrylicShell) {

        adjusted.projection += 0.1;

        adjusted.attack += 0.04;

        adjusted.brightness += 0.03;

        adjusted.sustain += 0.03;

        adjusted.warmth -= 0.04;

        adjusted.control += 0.02;

      } else if (isMetalShell) {

        adjusted.projection += 0.09;

        adjusted.attack += 0.04;

        adjusted.brightness += 0.04;

        adjusted.sustain += 0.04;

        adjusted.warmth += 0.01;

        adjusted.control += 0.01;

      } else if (isCompositeShell) {

        adjusted.projection += 0.09;

        adjusted.attack += 0.04;

        adjusted.brightness += 0.02;

        adjusted.sustain += 0.01;

        adjusted.warmth -= 0.04;

        adjusted.control += 0.04;

      } else {

        adjusted.warmth += 0.18;

        adjusted.sustain += 0.14;

        adjusted.projection += 0.08;

        adjusted.attack -= 0.06;

        adjusted.brightness -= 0.04;

      }

    }

    if (depthRatio >= 0.58) {

      if (isNonWoodShell) {

        adjusted.projection += 0.05;

        adjusted.control += 0.03;

        adjusted.sustain += 0.02;

        adjusted.warmth -= 0.03;

      } else {

        adjusted.warmth += 0.08;

        adjusted.sustain += 0.08;

        adjusted.projection += 0.04;

        adjusted.sensitivity -= 0.03;

      }

    }

    if (depthRatio <= 0.36) {

      adjusted.attack += 0.12;

      adjusted.brightness += 0.08;

      adjusted.sustain -= 0.08;

      adjusted.warmth -= 0.06;

    }

  }

  /**

   * Exact thickness interaction.

   *

   * The dedicated shell thickness profile gives the category bias.

   * This interaction adds extra behavior when exact thickness crosses major zones.

   */

  if (Number.isFinite(shellThicknessMm)) {

    if (shellThicknessMm >= 12) {

      moveNode(adjusted, 'attack', 0.08);

      moveNode(adjusted, 'projection', 0.08);

      moveNode(adjusted, 'control', 0.1);

      moveNode(adjusted, 'sensitivity', -0.07);

      moveNode(adjusted, 'sustain', -0.04);

    }

    if (shellThicknessMm >= 16) {

      moveNode(adjusted, 'attack', 0.04);

      moveNode(adjusted, 'projection', 0.05);

      moveNode(adjusted, 'control', 0.05);

      moveNode(adjusted, 'sensitivity', -0.04);

      moveNode(adjusted, 'sustain', -0.03);

    }

    if (shellThicknessMm <= 8) {

      moveNode(adjusted, 'warmth', 0.1);

      moveNode(adjusted, 'sustain', 0.08);

      moveNode(adjusted, 'sensitivity', 0.08);

      moveNode(adjusted, 'control', -0.08);

    }

    if (shellThicknessMm <= 6) {

      moveNode(adjusted, 'warmth', 0.04);

      moveNode(adjusted, 'sustain', 0.05);

      moveNode(adjusted, 'sensitivity', 0.05);

      moveNode(adjusted, 'control', -0.05);

      moveNode(adjusted, 'attack', -0.03);

    }

  }

  /**

   * FEUZØN interaction.

   *

   * This stays intentionally small because the construction profile already

   * carries the main FEUZØN shape.

   */

  if (constructionKey === 'feuzonHybrid') {

    moveNode(adjusted, 'projection', 0.05);

    moveNode(adjusted, 'warmth', 0.04);

    moveNode(adjusted, 'control', 0.03);

    moveNode(adjusted, 'sustain', 0.03);

  }

  /**

   * Dense material + thick shell interaction.

   */

  if (

    Number.isFinite(shellThicknessMm) &&

    shellThicknessMm >= 12 &&

    ['bubinga', 'purpleheart', 'jatoba', 'ebony', 'bronze'].includes(materialKey)

  ) {

    moveNode(adjusted, 'attack', 0.04);

    moveNode(adjusted, 'projection', 0.05);

    moveNode(adjusted, 'control', 0.04);

    moveNode(adjusted, 'sensitivity', -0.03);

  }

  /**

   * Steam-bent / solid shell behavior.

   */

  if (constructionKey === 'steamBent') {

    moveNode(adjusted, 'sustain', 0.05);

    moveNode(adjusted, 'warmth', 0.04);

    moveNode(adjusted, 'sensitivity', 0.04);

    moveNode(adjusted, 'control', -0.02);

  }

  if (constructionKey === 'solid') {

    moveNode(adjusted, 'warmth', 0.05);

    moveNode(adjusted, 'projection', 0.03);

    moveNode(adjusted, 'sustain', 0.03);

  }

  /**

   * Hoop / edge interaction.

   */

  if (hoopType.includes('die') && bearingEdge.includes('45')) {

    moveNode(adjusted, 'attack', 0.03);

    moveNode(adjusted, 'control', 0.04);

    moveNode(adjusted, 'sustain', -0.02);

  }

  if (hoopType.includes('triple') && bearingEdge.includes('round')) {

    moveNode(adjusted, 'sustain', 0.03);

    moveNode(adjusted, 'warmth', 0.02);

    moveNode(adjusted, 'control', -0.01);

  }

  /**

   * Blackened / heavier finish interaction.

   */

  if (finish.includes('blackened') || finish.includes('black')) {

    moveNode(adjusted, 'control', 0.04);

    moveNode(adjusted, 'sustain', -0.03);

    moveNode(adjusted, 'sensitivity', -0.03);

    moveNode(adjusted, 'brightness', -0.02);

  }

  /**

   * Snare-specific response.

   */

  if (drumType === 'snare') {

    moveNode(adjusted, 'sensitivity', 0.03);

    moveNode(adjusted, 'attack', 0.02);

  }

  /**

   * Bass drum response should not over-read as snare-like brightness/control.

   */

  if (drumType === 'bassDrum') {

    moveNode(adjusted, 'warmth', 0.08);

    moveNode(adjusted, 'projection', 0.05);

    moveNode(adjusted, 'brightness', -0.05);

    moveNode(adjusted, 'sensitivity', -0.04);

  }

  /**

   * Floor tom response should favor body and bloom over snap.

   */

  if (drumType === 'floorTom') {

    moveNode(adjusted, 'warmth', 0.06);

    moveNode(adjusted, 'sustain', 0.05);

    moveNode(adjusted, 'attack', -0.03);

  }

  return LEGACYPRINT_NODE_ORDER.reduce((acc, nodeKey) => {

    acc[nodeKey] = round2(clamp(adjusted[nodeKey]));

    return acc;

  }, {});

}

function buildDominantNodes(profile = {}, limit = 3) {

  return LEGACYPRINT_NODE_ORDER.map((nodeKey) => {

    const value = Number(profile[nodeKey]);

    return {

      nodeKey,

      value: Number.isFinite(value) ? value : DEFAULT_NODE_CENTER,

      distanceFromCenter: Math.abs(

        (Number.isFinite(value) ? value : DEFAULT_NODE_CENTER) -

          DEFAULT_NODE_CENTER

      ),

    };

  })

    .sort((a, b) => b.distanceFromCenter - a.distanceFromCenter)

    .slice(0, limit)

    .map((entry) => entry.nodeKey);

}

function buildCategoryContributionSummary(reads = {}, categoryWeights = {}) {

  return Object.entries(categoryWeights).map(([categoryKey, weight]) => {

    const read = reads[categoryKey];

    return {

      categoryKey,

      weight,

      label:

        read?.label || read?.target?.label || read?.profile?.label || categoryKey,

      nodeBias: normalizeNodeBias(read?.nodeBias || {}),

      summary: read?.summary || read?.description || '',

    };

  });

}

export function buildUniversalVoiceProfile(config = {}) {

  const drumType = config.drumType || 'snare';

  const shellConstructionRead = resolveShellConstructionRead(config);

  const constructionContextKey = normalizeConstructionContextKey(

    shellConstructionRead.constructionKey || shellConstructionRead.id

  );

  const shellMaterialRead = resolveShellMaterialRead(config);

  const shellThicknessRead = resolveShellThicknessRead(

    config,

    constructionContextKey

  );

  const reinforcementRead = buildReinforcementRead({

    reinforcement: config.reinforcement || config.reRings,

    constructionKey: constructionContextKey,

    shellThicknessMm:

      config.shellThicknessMm || config.thicknessMm || config.shellThickness,

  });

  const bearingEdgeRead = resolveBearingEdgeRead(config);

  const hoopHardwareRead = buildHoopHardwareRead({

    drumType,

    width: config.width || config.diameter,

    hoopType: config.hoopType,

    lugType: config.lugType || config.hardwareType,

    lugQuantity: config.lugQuantity || config.lugCount,

    hardwareFinish: config.hardwareFinish || config.hardwareColor,

  });

  const drumheadRead = buildDrumheadRead({

    drumType,

    batterHead: config.batterHead,

    resonantHead: config.resonantHead,

    snareSideHead: config.snareSideHead,

  });

  const tuningRead = resolveTuningRead(config);

  const finishTreatmentRead = resolveFinishTreatmentRead(config);

  const reads = {

    shellConstruction: shellConstructionRead,

    shellMaterial: shellMaterialRead,

    shellThickness: shellThicknessRead,

    reinforcement: reinforcementRead,

    bearingEdge: bearingEdgeRead,

    hoopHardware: hoopHardwareRead,

    drumheads: drumheadRead,

    tuning: tuningRead,

    finishTreatment: finishTreatmentRead,

  };

  let totalBias = buildNeutralNodeBias();

  totalBias = applyWeightedBias(

    totalBias,

    shellConstructionRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.shellConstruction

  );

  totalBias = applyWeightedBias(

    totalBias,

    shellMaterialRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.shellMaterial

  );

  totalBias = applyWeightedBias(

    totalBias,

    shellThicknessRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.shellThickness

  );

  totalBias = applyWeightedBias(

    totalBias,

    reinforcementRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.reinforcement

  );

  totalBias = applyWeightedBias(

    totalBias,

    bearingEdgeRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.bearingEdge

  );

  totalBias = applyWeightedBias(

    totalBias,

    hoopHardwareRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.hoopHardware

  );

  totalBias = applyWeightedBias(

    totalBias,

    drumheadRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.drumheads

  );

  totalBias = applyWeightedBias(

    totalBias,

    tuningRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.tuning

  );

  totalBias = applyWeightedBias(

    totalBias,

    finishTreatmentRead.nodeBias,

    UNIVERSAL_CATEGORY_WEIGHTS.finishTreatment

  );

  const baseProfile = buildProfileFromBias(totalBias);

  const profile = applyBasicInteractions(baseProfile, config);

  const dominantNodes = buildDominantNodes(profile, 3);

  return {

    engineId: 'legacyprint-universal-voice-engine',

    engineVersion: 'universal-v0.6-profile-gain-foundation',

    drumType,

    input: config,

    profile,

    baseProfile,

    totalBias,

    dominantNodes,

    categoryWeights: UNIVERSAL_CATEGORY_WEIGHTS,

    profileGain: UNIVERSAL_PROFILE_GAIN,

    interactionGain: UNIVERSAL_INTERACTION_GAIN,

    categoryContributions: buildCategoryContributionSummary(

      reads,

      UNIVERSAL_CATEGORY_WEIGHTS

    ),

    reads,

    meta: {

      constructionKey:

        shellConstructionRead.constructionKey || shellConstructionRead.id,

      constructionContextKey,

      reinforcementConstructionKey: constructionContextKey,

      materialKey: shellMaterialRead.materialKey || shellMaterialRead.id,

      shellThicknessClass: shellThicknessRead.classKey || null,

      shellThicknessMm: shellThicknessRead.thicknessMm || null,

      bearingEdgeKey: bearingEdgeRead.bearingEdgeKey || null,

      hoopKey: hoopHardwareRead.hoopKey || null,

      lugKey: hoopHardwareRead.lugKey || null,

      lugCountKey: hoopHardwareRead.lugCountKey || null,

      finishKey: finishTreatmentRead.finishKey || null,

      interiorTreatmentKey: finishTreatmentRead.interiorKey || null,

      tuningTargetKey: tuningRead.targetKey || null,

      tuningWindow: tuningRead.tuningWindow || null,

      profileGain: UNIVERSAL_PROFILE_GAIN,

      interactionGain: UNIVERSAL_INTERACTION_GAIN,

      note:

        'Universal v0.6 adds a profile gain layer so the separated acoustic category biases produce a useful 1–10 LegacyPrint readout range without inflating the source taxonomy values. Shell construction, shell material, shell thickness, reinforcement, bearing edge, hoop/hardware, drumheads, tuning, and finish/treatment remain separated for clean tuning.',

    },

  };

}

export default buildUniversalVoiceProfile;