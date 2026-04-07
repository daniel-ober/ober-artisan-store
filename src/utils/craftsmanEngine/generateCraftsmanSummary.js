// src/utils/craftsmanEngine/generateCraftsmanSummary.js

import buildDrumSpecsFromLegacyForm from '../spider/buildDrumSpecsFromLegacyForm';
import scoreSpiderProfile from '../spider/scoreSpiderProfile';
import scoreLegacyTuningProfile from '../spider/scoreLegacyTuningProfile';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round2 = (n) => Math.round(n * 100) / 100;

const AXIS_LABELS = {
  attack: 'Attack',
  sustain: 'Sustain',
  warmth: 'Warmth',
  projection: 'Projection',
  brightness: 'Brightness',
  sensitivity: 'Sensitivity',
  control: 'Control',
};

function avg(nums = [], fallback = 0.7) {
  const valid = nums.filter((n) => Number.isFinite(Number(n))).map(Number);
  if (!valid.length) return fallback;
  return valid.reduce((sum, n) => sum + n, 0) / valid.length;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeLower(value) {
  return normalizeText(value).toLowerCase();
}

function inferPrimaryWood(specs = {}) {
  const construction = String(specs.construction || '').toLowerCase();

  if ((specs.shellFamily || '').toLowerCase() !== 'wood') {
    return '';
  }

  if (construction.includes('hybrid')) {
    return (
      normalizeText(specs.innerSpecies) ||
      normalizeText(specs.outerSpecies) ||
      normalizeText(specs.primarySpecies) ||
      ''
    );
  }

  return (
    normalizeText(specs.primarySpecies) ||
    (Array.isArray(specs.species) && specs.species.length
      ? normalizeText(specs.species[0])
      : normalizeText(specs.species)) ||
    ''
  );
}

function inferWoodBlend(specs = {}) {
  const shellFamily = String(specs.shellFamily || '').toLowerCase();
  const construction = String(specs.construction || '').toLowerCase();
  const woods = [];
  const seen = new Set();

  if (shellFamily !== 'wood') return woods;

  const pushWood = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    woods.push(normalized);
  };

  if (construction.includes('hybrid')) {
    pushWood(specs.innerSpecies);
    pushWood(specs.secondarySpecies);
    pushWood(specs.outerSpecies);
    return woods;
  }

  const primary =
    normalizeText(specs.primarySpecies) ||
    (Array.isArray(specs.species) && specs.species.length
      ? normalizeText(specs.species[0])
      : normalizeText(specs.species));

  pushWood(primary);
  pushWood(specs.secondarySpecies);

  return woods;
}

function hasExplicitSpec(specValue) {
  if (Array.isArray(specValue)) return specValue.filter(Boolean).length > 0;
  return (
    specValue !== undefined &&
    specValue !== null &&
    String(specValue).trim() !== ''
  );
}

function confidenceFromSource({
  explicit = false,
  inferred = false,
  base = 0.6,
  bonus = 0,
}) {
  let score = base;

  if (explicit) score += 0.18;
  if (inferred) score += 0.06;
  if (!explicit && !inferred) score -= 0.08;

  score += bonus;

  return round2(clamp(score, 0.42, 0.9));
}

function getBuildVoicing(spiderProfile = {}) {
  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const projection = Number(spiderProfile.projection) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;
  const control = Number(spiderProfile.control) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;

  if (attack >= 7.5 && brightness >= 7 && control >= 6.5) {
    return 'tight-articulate';
  }
  if (warmth >= 7.5 && sustain >= 7) return 'warm-resonant';
  if (projection >= 7.5 && attack >= 7) return 'projecting-fast';
  if (control >= 7.5 && sustain <= 6.2) return 'controlled-dry';
  if (warmth >= 7 && attack <= 6.2) return 'round-bodied';

  return 'balanced';
}

function parseFirstNumber(value) {
  const match = String(value || '').match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function getThicknessMm(value) {
  return parseFirstNumber(value);
}

function isExtremeShellThickness(mm, shellFamily = 'wood') {
  if (!Number.isFinite(mm)) return false;

  const family = normalizeLower(shellFamily);

  if (family === 'metal') {
    return mm >= 3 || mm <= 1.0;
  }

  if (family === 'acrylic') {
    return mm >= 12 || mm < 5;
  }

  return mm >= 15 || mm <= 5;
}

function isCommonShellThickness(mm, shellFamily = 'wood') {
  if (!Number.isFinite(mm)) return false;

  const family = normalizeLower(shellFamily);

  if (family === 'metal') {
    return mm > 1.0 && mm <= 1.5;
  }

  if (family === 'acrylic') {
    return mm >= 5 && mm <= 10;
  }

  return mm >= 6 && mm <= 11;
}

function isUncommonBearingEdge(value) {
  const normalized = String(value || '').trim().toLowerCase();

  return (
    normalized.includes('baseball bat') ||
    normalized.includes('sharp') ||
    normalized.includes('acute') ||
    normalized.includes('vintage wide round')
  );
}

function getShellDescriptor(specs = {}) {
  const shellFamily = normalizeLower(specs.shellFamily || 'Wood');

  if (shellFamily === 'metal') {
    return normalizeText(specs.metalMaterial) || 'metal';
  }

  if (shellFamily === 'acrylic') {
    return normalizeText(specs.acrylicType) || 'acrylic';
  }

  const blend = inferWoodBlend(specs);
  if (blend.length > 1) return blend.join(' + ');
  return inferPrimaryWood(specs) || 'wood';
}

function recommendShellThickness(specs = {}, spiderProfile = {}) {
  const projection = Number(spiderProfile.projection) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;
  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const control = Number(spiderProfile.control) || 5;
  const existing = String(specs.thickness || '');
  const voicing = getBuildVoicing(spiderProfile);
  const existingMm = getThicknessMm(existing);
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');

  if (existing) {
    const isExtreme = isExtremeShellThickness(existingMm, shellFamily);
    const isCommon = isCommonShellThickness(existingMm, shellFamily);

    return {
      value: existing,
      confidence01: confidenceFromSource({
        explicit: true,
        base: isExtreme ? 0.52 : isCommon ? 0.68 : 0.6,
      }),
      rationale: isExtreme
        ? `${existing} is a more specialized shell-thickness choice for this shell family. It can absolutely work, but it should be treated as a more intentional voicing move rather than a neutral baseline.`
        : isCommon
          ? `${existing} sits in a very workable range for this shell family and already aligns with the current build direction.`
          : `${existing} already supports the current build direction and should remain the working recommendation unless build goals change.`,
    };
  }

  let recommendation = 'Medium — 8mm–11mm';

  if (shellFamily === 'metal') {
    if (voicing === 'tight-articulate' || projection >= 8 || attack >= 8) {
      recommendation = 'Heavy — 1.5mm';
    } else if (voicing === 'warm-resonant' || sustain >= 7.2) {
      recommendation = 'Thin — 1.0mm';
    } else {
      recommendation = 'Standard — 1.2mm';
    }

    return {
      value: recommendation,
      confidence01: confidenceFromSource({ inferred: true, base: 0.6 }),
      rationale:
        recommendation === 'Standard — 1.2mm'
          ? 'Standard — 1.2mm remains the most balanced all-around metal-shell thickness recommendation for this tonal direction.'
          : `${recommendation} is the best first-pass metal shell thickness recommendation for the current balance of projection, control, and sustain.`,
    };
  }

  if (shellFamily === 'acrylic') {
    if (projection >= 8 || control >= 7.2) {
      recommendation = 'Heavy — 8mm–10mm';
    } else {
      recommendation = 'Standard — 5mm–6mm';
    }

    return {
      value: recommendation,
      confidence01: confidenceFromSource({ inferred: true, base: 0.58 }),
      rationale:
        recommendation === 'Standard — 5mm–6mm'
          ? 'Standard — 5mm–6mm remains the most balanced acrylic-shell thickness recommendation for this tonal direction.'
          : `${recommendation} is the most balanced acrylic-shell recommendation for the current tonal direction.`,
    };
  }

  if (voicing === 'tight-articulate' || voicing === 'projecting-fast') {
    recommendation = 'Thick — 11mm–15mm';
  } else if (voicing === 'warm-resonant' || voicing === 'round-bodied') {
    recommendation = 'Thin — 6mm–8mm';
  } else if (projection >= 8 || attack >= 8) {
    recommendation = 'Thick — 11mm–15mm';
  } else if (sustain >= 7.5 && warmth >= 7) {
    recommendation = 'Thin — 6mm–8mm';
  }

  return {
    value: recommendation,
    confidence01: confidenceFromSource({ inferred: true, base: 0.58 }),
    rationale: `${recommendation} is the best working shell-thickness estimate for the current tonal direction, balancing ${
      attack >= warmth ? 'definition and projection' : 'body and controlled resonance'
    }.`,
  };
}

function recommendStaveCount(specs = {}, spiderProfile = {}) {
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');
  const construction = normalizeLower(specs.construction);
  const explicitWidth = hasExplicitSpec(specs.width);

  if (shellFamily !== 'wood' || construction.includes('ply') || construction.includes('solid')) {
    return {
      value: 'N/A',
      confidence01: confidenceFromSource({ explicit: true, base: 0.86 }),
      rationale:
        'Stave count is only relevant to stave-style shell recipes and is not a meaningful recommendation for this shell direction.',
    };
  }

  const width = Number(specs.width) || 14;
  const attack = Number(spiderProfile.attack) || 5;
  const control = Number(spiderProfile.control) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const voicing = getBuildVoicing(spiderProfile);

  let count = 16;

  if (width <= 13) count = 14;
  if (width >= 15) count = 18;

  if (voicing === 'tight-articulate' || voicing === 'projecting-fast') {
    count += 2;
  }
  if (voicing === 'warm-resonant' || voicing === 'round-bodied') {
    count -= 2;
  }

  if (attack >= 7.5 || control >= 7.5) count += 2;
  if (warmth >= 7.5 && attack <= 6.5) count -= 2;

  count = clamp(count, 10, 24);
  if (count % 2 !== 0) count += 1;

  return {
    value: count,
    confidence01: confidenceFromSource({
      explicit: explicitWidth,
      inferred: true,
      base: 0.54,
      bonus: explicitWidth ? 0.04 : 0,
    }),
    rationale: `${count} staves should give enough structural consistency for the target sound without overcomplicating the shell recipe.`,
  };
}

function recommendBearingEdge(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.bearingEdge);
  const explicit = hasExplicitSpec(specs.bearingEdge);

  if (existing) {
    const uncommon = isUncommonBearingEdge(existing);

    return {
      value: existing,
      confidence01: confidenceFromSource({
        explicit: true,
        base: uncommon ? 0.54 : 0.7,
      }),
      rationale: uncommon
        ? `${existing} can support the current tonal intent, but it reads as a more specialized edge choice and should be treated with more caution than a standard all-around recommendation.`
        : `${existing} already supports the tonal intent shown in the current build profile.`,
    };
  }

  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const control = Number(spiderProfile.control) || 5;
  const voicing = getBuildVoicing(spiderProfile);

  let value = '45 Degree Inner';

  if (voicing === 'warm-resonant' || voicing === 'round-bodied') {
    value = '30 Degree Inner';
  } else if (warmth >= 7.8 && control >= 6.8) {
    value = 'Slight Roundover';
  } else if (warmth >= 7 && sensitivity >= 6.8) {
    value = '45 / Roundover Hybrid';
  } else if (attack >= 7.5 || voicing === 'tight-articulate') {
    value = '45 Degree Inner';
  }

  return {
    value,
    confidence01: confidenceFromSource({
      explicit,
      inferred: true,
      base: 0.57,
    }),
    rationale: `${value} best fits the current balance of articulation, warmth, and touch response.`,
  };
}

function recommendHeadType(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.drumhead);
  const explicit = hasExplicitSpec(specs.drumhead);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.69 }),
      rationale: `${existing} remains a strong fit for the way this drum currently wants to speak.`,
    };
  }

  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const control = Number(spiderProfile.control) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;
  const voicing = getBuildVoicing(spiderProfile);

  let value = 'Coated';

  if (
    voicing === 'tight-articulate' ||
    (attack >= 7.8 && warmth <= 6.2 && brightness >= 6.8)
  ) {
    value = 'Clear';
  } else if (voicing === 'controlled-dry' || control >= 7.6) {
    value = 'Hybrid (Coated + Clear)';
  } else {
    value = 'Coated';
  }

  return {
    value,
    confidence01: confidenceFromSource({
      explicit,
      inferred: true,
      base: 0.56,
    }),
    rationale: `${value} gives the best match to the drum’s predicted attack-to-warmth balance.`,
  };
}

function recommendHeadTension(specs = {}, spiderProfile = {}, legacyTuning = {}) {
  const existing = normalizeText(specs.tension);
  const explicit = hasExplicitSpec(specs.tension);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.7 }),
      rationale: `${existing} tension agrees with the current playable range and LegacyPrint™ center.`,
    };
  }

  const attack = Number(spiderProfile.attack) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;
  const control = Number(spiderProfile.control) || 5;
  const legacyCenterHz = Number(legacyTuning.legacyCenterHz) || 215;
  const voicing = getBuildVoicing(spiderProfile);

  let value = 'Medium';

  if (
    voicing === 'tight-articulate' ||
    legacyCenterHz >= 245 ||
    attack >= 7.8
  ) {
    value = 'High';
  } else if (
    voicing === 'warm-resonant' ||
    legacyCenterHz <= 195 ||
    sustain >= 7.6
  ) {
    value = 'Low';
  } else if (control >= 7.5 && sustain <= 6.2) {
    value = 'Medium';
  }

  return {
    value,
    confidence01: confidenceFromSource({
      explicit,
      inferred: true,
      base: 0.57,
    }),
    rationale: `${value} head tension best supports the estimated sweet spot around ${legacyCenterHz} Hz.`,
  };
}

function recommendHoopType(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.hoopType);
  const explicit = hasExplicitSpec(specs.hoopType);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.66 }),
      rationale: `${existing} already supports the current balance of focus, feel, and overtone control.`,
    };
  }

  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const control = Number(spiderProfile.control) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;
  const voicing = getBuildVoicing(spiderProfile);

  let value = 'Triple-Flanged';

  if (voicing === 'tight-articulate' || control >= 7.4 || attack >= 7.8) {
    value = 'Die-Cast';
  } else if (voicing === 'warm-resonant' || (warmth >= 7.4 && sustain >= 7)) {
    value = 'Wood Hoop';
  }

  return {
    value,
    confidence01: confidenceFromSource({
      inferred: true,
      base: 0.53,
    }),
    rationale:
      value === 'Die-Cast'
        ? 'Die-Cast hoops best support a tighter, more focused response with stronger control at the edge.'
        : value === 'Wood Hoop'
          ? 'Wood hoops best support a warmer, more open response with a softer edge feel.'
          : 'Triple-Flanged hoops remain the most balanced all-around recommendation when the build wants openness without losing usable focus.',
  };
}

function recommendHardwareType(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.hardwareType);
  const explicit = hasExplicitSpec(specs.hardwareType);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.62 }),
      rationale: `${existing} remains a workable hardware direction for the current tonal posture and build feel.`,
    };
  }

  const attack = Number(spiderProfile.attack) || 5;
  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const projection = Number(spiderProfile.projection) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;

  let value = 'Standard Lugs';

  if (attack >= 7.8 || projection >= 7.8) {
    value = 'Tube Lugs';
  } else if (warmth >= 7.2 && sensitivity >= 6.8) {
    value = 'Standard Lugs';
  }

  return {
    value,
    confidence01: confidenceFromSource({
      inferred: true,
      base: 0.48,
    }),
    rationale:
      value === 'Tube Lugs'
        ? 'Tube-style hardware fits the more articulate and projecting direction of this build without visually or structurally overcomplicating it.'
        : 'Standard Lugs remain the most neutral, dependable recommendation for the current shell direction.',
  };
}

function recommendFinishType(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.finish);
  const explicit = hasExplicitSpec(specs.finish);
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');

  if (existing) {
    return {
      value: specs.finish,
      confidence01: confidenceFromSource({ explicit: true, base: 0.58 }),
      rationale: `${specs.finish} remains a reasonable finish choice for the current shell direction and aesthetic intent.`,
    };
  }

  if (shellFamily !== 'wood') {
    return {
      value: 'Raw / Unfinished',
      confidence01: confidenceFromSource({ inferred: true, base: 0.7 }),
      rationale:
        'A raw or unfinished-style presentation is the most neutral tonal assumption for non-wood shells in this version of the model.',
    };
  }

  const sustain = Number(spiderProfile.sustain) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const control = Number(spiderProfile.control) || 5;

  let value = 'Gloss Lacquer';

  if (control >= 7.4) {
    value = 'Wrap';
  } else if (sustain >= 7.2 || warmth >= 7.2) {
    value = 'Oil / Wax';
  } else if (warmth >= 6.7) {
    value = 'Satin Lacquer';
  }

  return {
    value,
    confidence01: confidenceFromSource({
      inferred: true,
      base: 0.44,
    }),
    rationale:
      value === 'Oil / Wax'
        ? 'An oil or wax style finish best suits a build leaning warmer and more open in its natural response.'
        : value === 'Wrap'
          ? 'A wrapped finish can suit a more controlled presentation while also serving a strong visual direction.'
          : value === 'Satin Lacquer'
            ? 'A satin lacquer finish fits a balanced but slightly warmer shell direction.'
            : 'A gloss lacquer finish remains the most balanced default recommendation when the build wants clarity, polish, and broad versatility.',
  };
}

function recommendShellMaterial(specs = {}, spiderProfile = {}) {
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');
  const voicing = getBuildVoicing(spiderProfile);
  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const projection = Number(spiderProfile.projection) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;

  if (shellFamily === 'metal') {
    const existing = normalizeText(specs.metalMaterial);
    if (existing) {
      return {
        value: existing,
        confidence01: confidenceFromSource({ explicit: true, base: 0.71 }),
        rationale: `${existing} remains a strong metal-shell direction for the current tonal posture.`,
      };
    }

    let value = 'Brass';

    if (brightness >= 7.5 || attack >= 8.0) {
      value = 'Steel';
    } else if (warmth >= 7.4) {
      value = 'Copper';
    } else if (projection >= 7.8) {
      value = 'Bronze';
    } else if (voicing === 'balanced') {
      value = 'Aluminum';
    }

    return {
      value,
      confidence01: confidenceFromSource({ inferred: true, base: 0.58 }),
      rationale: `${value} is the best first-pass metal shell material recommendation for the current attack, warmth, and projection balance.`,
    };
  }

  if (shellFamily === 'acrylic') {
    return {
      value: normalizeText(specs.acrylicType) || 'Simple Acrylic',
      confidence01: confidenceFromSource({ explicit: true, base: 0.84 }),
      rationale:
        'Simple Acrylic remains the baseline acrylic shell direction in this version of the tool and fits the current build posture well.',
    };
  }

  const woods = inferWoodBlend(specs);
  const primary = inferPrimaryWood(specs);

  if (woods.length > 1) {
    return {
      value: woods.join(' + '),
      confidence01: confidenceFromSource({ explicit: true, base: 0.68 }),
      rationale:
        'The current multi-species recipe already provides a meaningful tonal direction and should remain the working recommendation.',
    };
  }

  if (primary) {
    return {
      value: primary,
      confidence01: confidenceFromSource({ explicit: true, base: 0.66 }),
      rationale: `${primary} remains the best working primary species given the current build direction.`,
    };
  }

  if (voicing === 'projecting-fast' || (projection >= 7.6 && warmth <= 6.4)) {
    return {
      value: 'Maple',
      confidence01: confidenceFromSource({ inferred: true, base: 0.48 }),
      rationale:
        'Maple is the safest balanced recommendation when the build needs projection and articulation first.',
    };
  }

  if (voicing === 'warm-resonant' || warmth >= 7.5) {
    return {
      value: 'Walnut',
      confidence01: confidenceFromSource({ inferred: true, base: 0.47 }),
      rationale:
        'Walnut is the strongest default recommendation when body, smoothness, and warmth are leading priorities.',
    };
  }

  if (attack >= 7 && warmth >= 6.5) {
    return {
      value: 'Cherry',
      confidence01: confidenceFromSource({ inferred: true, base: 0.46 }),
      rationale:
        'Cherry is a useful middle-ground recommendation when the drum needs both tone body and respectable articulation.',
    };
  }

  return {
    value: 'Maple',
    confidence01: confidenceFromSource({ inferred: true, base: 0.44 }),
    rationale:
      'With the current information available, maple is the most defensible neutral starting point.',
  };
}

function recommendSnareBedDepth(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.snareBedDepth);
  const explicit = hasExplicitSpec(specs.snareBedDepth);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.72 }),
      rationale:
        existing.toLowerCase().includes('standard')
          ? 'A standard snare-bed depth remains the most balanced match for the current response and sensitivity direction.'
          : `${existing} remains a strong match for the current response and sensitivity direction.`,
    };
  }

  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const control = Number(spiderProfile.control) || 5;

  let value = 'Standard — ~1/16" to 3/32"';

  if (sensitivity >= 7.7 && control <= 6.4) {
    value = 'Deep — ~3/32" to 1/8"';
  } else if (control >= 7.4 && sensitivity <= 6.4) {
    value = 'Shallow — ~1/32" to 1/16"';
  }

  return {
    value,
    confidence01: confidenceFromSource({ inferred: true, base: 0.58 }),
    rationale:
      value.toLowerCase().includes('standard')
        ? 'A standard snare-bed depth is the most balanced recommendation when the build does not strongly call for extra dryness or extra wire sensitivity.'
        : `${value} best fits the current balance of snare sensitivity, engagement, and overall control.`,
  };
}

function recommendSnareSideHead(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.snareSideHead);
  const explicit = hasExplicitSpec(specs.snareSideHead);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.74 }),
      rationale:
        existing.toLowerCase().includes('standard')
          ? 'A standard 3mil snare-side head stays the most balanced all-around match for the current response profile.'
          : `${existing} stays aligned with the current sensitivity and response profile.`,
    };
  }

  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const control = Number(spiderProfile.control) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;

  let value = 'Standard — 3mil';

  if (sensitivity >= 7.3 && control <= 6.2) {
    value = 'Thin — 2mil';
  } else if (control >= 7.5 && sustain <= 6.4) {
    value = 'Thick — 5mil';
  }

  return {
    value,
    confidence01: confidenceFromSource({ inferred: true, base: 0.6 }),
    rationale:
      value.toLowerCase().includes('standard')
        ? 'A standard 3mil snare-side head is the most balanced recommendation when the build does not clearly need extra snare speed or extra dryness.'
        : `${value} best supports the drum’s predicted snare response and overall composure.`,
  };
}

function recommendSnareWireCount(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.snareWireCount);
  const explicit = hasExplicitSpec(specs.snareWireCount);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.71 }),
      rationale:
        existing === '20'
          ? '20-strand wires remain the most balanced all-around count for the current response profile.'
          : `${existing}-strand wire count remains a workable match for the current response balance.`,
    };
  }

  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const control = Number(spiderProfile.control) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;

  let value = '20';

  if (sensitivity >= 7.8 && control <= 6.2) {
    value = '24';
  } else if (sensitivity >= 8.2) {
    value = '30';
  } else if (control >= 7.6) {
    value = '16';
  } else if (warmth >= 7.3 && control <= 6.0) {
    value = '24';
  }

  return {
    value,
    confidence01: confidenceFromSource({ inferred: true, base: 0.57 }),
    rationale:
      value === '20'
        ? '20-strand wires are the most balanced starting point when the build does not strongly call for either a drier or more saturated snare response.'
        : `${value}-strand wires best fit the current balance of snare activity, focus, and saturation.`,
  };
}

function recommendSnareWireStyle(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.snareWireStyle);
  const explicit = hasExplicitSpec(specs.snareWireStyle);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.7 }),
      rationale:
        existing.toLowerCase() === 'standard'
          ? 'Standard remains the most balanced all-around wire style for the current control-versus-openness direction.'
          : `${existing} remains aligned to the current control-versus-openness direction.`,
    };
  }

  const sensitivity = Number(spiderProfile.sensitivity) || 5;
  const control = Number(spiderProfile.control) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;

  let value = 'Standard';

  if (control >= 7.5) {
    value = 'Dry / Controlled';
  } else if (sensitivity >= 7.8 && warmth >= 6.4) {
    value = 'Wide / Saturated';
  } else if (sensitivity >= 7.3) {
    value = 'Open / Sensitive';
  }

  return {
    value,
    confidence01: confidenceFromSource({ inferred: true, base: 0.58 }),
    rationale:
      value === 'Standard'
        ? 'Standard is the most balanced wire-style recommendation when the build does not clearly need extra dryness or extra saturation.'
        : `${value} best supports the current snare-response character shown by the tonal read.`,
  };
}

function recommendSnareWireMaterial(specs = {}, spiderProfile = {}) {
  const existing = normalizeText(specs.snareWireMaterial);
  const explicit = hasExplicitSpec(specs.snareWireMaterial);

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.7 }),
      rationale:
        `${existing} remains a workable wire material choice for the current tonal posture.`,
    };
  }

  const warmth = Number(spiderProfile.warmth) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;

  const value = warmth >= 7.2 && brightness <= 6.0 ? 'Brass' : 'Steel';

  return {
    value,
    confidence01: confidenceFromSource({ inferred: true, base: 0.55 }),
    rationale:
      value === 'Brass'
        ? 'Brass wires better suit the warmer, fuller response suggested by the current read.'
        : 'Steel wires better suit the clearer, crisper response suggested by the current read.',
  };
}

function recommendReRings(specs = {}, spiderProfile = {}) {
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');
  const existing = normalizeText(specs.reRings);
  const explicit = hasExplicitSpec(specs.reRings);

  if (shellFamily !== 'wood') {
    return {
      value: 'N/A',
      confidence01: confidenceFromSource({ explicit: true, base: 0.86 }),
      rationale:
        'Re-rings are only modeled for wood-shell builds in this version of the tool.',
    };
  }

  if (existing) {
    return {
      value: existing,
      confidence01: confidenceFromSource({ explicit: true, base: 0.63 }),
      rationale:
        `${existing} remains a workable shell-structure choice for the current build direction.`,
    };
  }

  const control = Number(spiderProfile.control) || 5;
  const attack = Number(spiderProfile.attack) || 5;
  const sustain = Number(spiderProfile.sustain) || 5;

  let value = 'No Re-Rings';

  if (control >= 7.7 || attack >= 7.8) {
    value = 'Standard Re-Rings';
  } else if (sustain >= 7.5) {
    value = 'Thin Re-Rings';
  }

  return {
    value,
    confidence01: confidenceFromSource({ inferred: true, base: 0.5 }),
    rationale:
      `${value} best fits the current balance between shell openness and containment.`,
  };
}

function recommendStickSuggestion(spiderProfile = {}) {
  const attack = Number(spiderProfile.attack) || 5;
  const warmth = Number(spiderProfile.warmth) || 5;
  const brightness = Number(spiderProfile.brightness) || 5;
  const control = Number(spiderProfile.control) || 5;
  const voicing = getBuildVoicing(spiderProfile);

  let value = '5A wood tip';
  let rationale =
    'A 5A wood tip stays neutral enough to let the shell speak honestly.';

  if (voicing === 'tight-articulate' || (attack >= 7.8 && brightness >= 7)) {
    value = '5A or 55A wood tip';
    rationale =
      'A wood-tip 5A/55A keeps articulation while avoiding extra cymbal-edge brightness that could overstate the top end.';
  } else if (
    voicing === 'warm-resonant' ||
    (warmth >= 7.5 && control <= 6.2)
  ) {
    value = '55A wood tip';
    rationale =
      'A 55A wood tip should add a little authority without pushing the drum into an overly hard-edged response.';
  } else if (voicing === 'controlled-dry' || control >= 7.5) {
    value = '5B wood tip';
    rationale =
      'A 5B wood tip can help pull a fuller stroke from a more focused shell without needing extreme tension.';
  }

  return {
    value,
    confidence01: confidenceFromSource({ inferred: true, base: 0.46 }),
    rationale,
  };
}

function getAxisInterpretation(axis, score) {
  const label = AXIS_LABELS[axis] || axis;

  switch (axis) {
    case 'attack':
      if (score >= 7.5) return 'quick and defined on the front end';
      if (score >= 6.5) return 'fairly articulate without becoming overly sharp';
      return 'softer and less immediate on the initial strike';

    case 'sustain':
      if (score >= 7.5) return 'fairly long in decay';
      if (score >= 6.2) return 'moderately open after the strike';
      return 'relatively controlled and shorter in decay';

    case 'warmth':
      if (score >= 7.5) return 'noticeably warm and body-forward';
      if (score >= 6.2) return 'slightly fuller than neutral';
      return 'leaner and less warmth-forward';

    case 'projection':
      if (score >= 7.5) return 'strong and present outwardly';
      if (score >= 6.2) return 'solid and reasonably present';
      return 'more contained than forceful in the room';

    case 'brightness':
      if (score >= 7.5) return 'bright and articulate';
      if (score >= 6.2) return 'clear without getting too sharp';
      return 'darker and less top-end forward';

    case 'sensitivity':
      if (score >= 7.5) return 'very responsive to light playing';
      if (score >= 6.2) return 'fairly receptive to lighter playing';
      return 'more stroke-dependent before it fully opens up';

    case 'control':
      if (score >= 7.5) return 'tight and well-contained';
      if (score >= 6.2) return 'fairly tidy and contained';
      return 'more open and less damped by nature';

    default:
      return `${label} sits around ${score}/10`;
  }
}

function buildSpiderExplanation(spiderResult = {}) {
  const axisBreakdown = spiderResult.axisBreakdown || {};
  const axes = Object.entries(axisBreakdown).map(([axis, entry]) => ({
    axis,
    label: AXIS_LABELS[axis] || axis,
    score: Number(entry?.score) || 0,
    confidence01: Number(entry?.confidence01) || 0,
    confidencePercent: Math.round((Number(entry?.confidence01) || 0) * 100),
    interpretation: getAxisInterpretation(axis, Number(entry?.score) || 0),
    contributors: Array.isArray(entry?.contributors) ? entry.contributors : [],
  }));

  const sorted = axes.slice().sort((a, b) => b.score - a.score);
  const strongest = sorted.slice(0, 2);
  const weakest = sorted[sorted.length - 1];

  const summaryParts = [];

  if (strongest.length) {
    if (strongest.length === 1) {
      summaryParts.push(
        `The most pronounced trait is ${strongest[0].label.toLowerCase()}.`
      );
    } else {
      summaryParts.push(
        `The most pronounced traits are ${strongest
          .map((item) => item.label.toLowerCase())
          .join(' and ')}.`
      );
    }
  }

  if (weakest) {
    summaryParts.push(
      `The least emphasized trait is ${weakest.label.toLowerCase()}.`
    );
  }

  return {
    axes,
    summary: summaryParts.join(' '),
  };
}

function getTopAxisTraits(spiderExplanation = {}) {
  const axes = Array.isArray(spiderExplanation.axes)
    ? spiderExplanation.axes
    : [];

  return axes
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => ({
      axis: item.axis,
      label: item.label,
      score: item.score,
      interpretation: item.interpretation,
    }));
}

function buildRecommendationMatrix(
  specs = {},
  spiderResult = {},
  legacyTuning = {}
) {
  const spiderProfile = spiderResult.profile || {};

  return {
    shellMaterial: recommendShellMaterial(specs, spiderProfile),
    shellThickness: recommendShellThickness(specs, spiderProfile),
    staveCount: recommendStaveCount(specs, spiderProfile),
    bearingEdge: recommendBearingEdge(specs, spiderProfile),
    headType: recommendHeadType(specs, spiderProfile),
    headTension: recommendHeadTension(specs, spiderProfile, legacyTuning),
    hoopType: recommendHoopType(specs, spiderProfile),
    hardwareType: recommendHardwareType(specs, spiderProfile),
    finishType: recommendFinishType(specs, spiderProfile),
    snareBedDepth: recommendSnareBedDepth(specs, spiderProfile),
    snareSideHead: recommendSnareSideHead(specs, spiderProfile),
    snareWireCount: recommendSnareWireCount(specs, spiderProfile),
    snareWireStyle: recommendSnareWireStyle(specs, spiderProfile),
    snareWireMaterial: recommendSnareWireMaterial(specs, spiderProfile),
    reRings: recommendReRings(specs, spiderProfile),
    stickSuggestion: recommendStickSuggestion(spiderProfile),
  };
}

function matrixToSpecSummary(matrix = {}) {
  return {
    shellMaterial: matrix.shellMaterial?.value || null,
    shellThickness: matrix.shellThickness?.value || null,
    staveCount: matrix.staveCount?.value || null,
    bearingEdge: matrix.bearingEdge?.value || null,
    headType: matrix.headType?.value || null,
    headTension: matrix.headTension?.value || null,
    hoopType: matrix.hoopType?.value || null,
    hardwareType: matrix.hardwareType?.value || null,
    finishType: matrix.finishType?.value || null,
    snareBedDepth: matrix.snareBedDepth?.value || null,
    snareSideHead: matrix.snareSideHead?.value || null,
    snareWireCount: matrix.snareWireCount?.value || null,
    snareWireStyle: matrix.snareWireStyle?.value || null,
    snareWireMaterial: matrix.snareWireMaterial?.value || null,
    reRings: matrix.reRings?.value || null,
    stickSuggestion: matrix.stickSuggestion?.value || null,
  };
}

function matrixConfidenceSummary(matrix = {}) {
  return Object.entries(matrix).reduce((acc, [key, value]) => {
    const confidence01 = Number(value?.confidence01);
    acc[key] = {
      confidence01: round2(confidence01 || 0),
      confidencePercent: Math.round((confidence01 || 0) * 100),
      rationale: value?.rationale || '',
    };
    return acc;
  }, {});
}

function buildContributorHighlights(spiderResult = {}) {
  const axisBreakdown = spiderResult.axisBreakdown || {};

  return Object.entries(axisBreakdown).reduce((acc, [axis, entry]) => {
    const topContributors = Array.isArray(entry?.contributors)
      ? entry.contributors.slice(0, 3)
      : [];

    acc[axis] = {
      label: AXIS_LABELS[axis] || axis,
      score: Number(entry?.score) || 0,
      confidence01: Number(entry?.confidence01) || 0,
      confidencePercent: Math.round((Number(entry?.confidence01) || 0) * 100),
      topContributors,
    };

    return acc;
  }, {});
}

function buildOverallConfidence(spiderResult = {}, legacyTuning = {}, matrix = {}) {
  const spiderConfidence = Number(spiderResult.confidence01);
  const legacyConfidence = Number(legacyTuning.confidence01);

  const matrixConfidenceValues = Object.values(matrix)
    .map((item) => Number(item?.confidence01))
    .filter((n) => Number.isFinite(n));

  return round2(
    clamp(
      avg(
        [
          Number.isFinite(spiderConfidence) ? spiderConfidence : 0.6,
          Number.isFinite(legacyConfidence) ? legacyConfidence : 0.62,
          ...matrixConfidenceValues,
        ],
        0.66
      ),
      0.45,
      0.93
    )
  );
}

function buildOverview(specs = {}, spiderResult = {}, legacyTuning = {}, topTraits = []) {
  const shellFamily = normalizeLower(specs.shellFamily || 'wood');
  const construction = specs.construction || 'Stave';
  const shellDescriptor = getShellDescriptor(specs);

  const shellLead =
    shellFamily === 'metal'
      ? `This build currently reads as a ${normalizeText(shellDescriptor).toLowerCase()} metal-shell voice`
      : shellFamily === 'acrylic'
        ? 'This build currently reads as an acrylic-shell voice'
        : `This build currently reads as a ${construction.toLowerCase()}-leaning wood voice with ${
            shellDescriptor ? shellDescriptor.toLowerCase() : 'a balanced shell'
          } at the center of the recommendation`;

  const overviewParts = [shellLead + '.'];

  if (topTraits.length) {
    overviewParts.push(
      `The strongest tonal traits are ${topTraits
        .map((trait) => `${trait.label.toLowerCase()} (${trait.score}/10)`)
        .join(', ')}.`
    );
  }

  overviewParts.push(
    `The most repeatable LegacyPrint™ zone is estimated around ${legacyTuning.legacyCenterHz} Hz (${legacyTuning.legacyCenterNote}), inside a broader practical range of ${legacyTuning.lowestHz}–${legacyTuning.highestHz} Hz.`
  );

  return overviewParts.join(' ');
}

export function generateCraftsmanSummary(input = {}) {
  const specs = buildDrumSpecsFromLegacyForm(input.specs || input);
  const spiderResult = scoreSpiderProfile(specs);
  const spiderExplanation = buildSpiderExplanation(spiderResult);
  const legacyTuning = scoreLegacyTuningProfile(specs);
  const matrix = buildRecommendationMatrix(specs, spiderResult, legacyTuning);

  const topTraits = getTopAxisTraits(spiderExplanation);
  const overallConfidence01 = buildOverallConfidence(
    spiderResult,
    legacyTuning,
    matrix
  );

  const overview = buildOverview(
    specs,
    spiderResult,
    legacyTuning,
    topTraits
  );

  const recommendedSpecs = matrixToSpecSummary(matrix);

  return {
    overview,

    confidence01: overallConfidence01,
    confidencePercent: Math.round(overallConfidence01 * 100),

    spiderProfile: spiderResult.profile,
    spiderExplanation,
    spiderAxisBreakdown: spiderResult.axisBreakdown || {},
    contributorHighlights: buildContributorHighlights(spiderResult),
    legacyTuning,

    recommendedSpecs,
    confidenceByArea: matrixConfidenceSummary(matrix),

    recommendationMatrix: matrix,

    rationale: {
      tonalSummary: spiderExplanation.summary,
      legacyWhy: legacyTuning.why,
    },

    drafts: {
      shortSummary: `Recommended shell direction: ${
        recommendedSpecs.shellMaterial || 'TBD'
      } / ${recommendedSpecs.shellThickness || 'TBD'} / ${
        recommendedSpecs.bearingEdge || 'TBD'
      }, with a LegacyPrint™ center near ${legacyTuning.legacyCenterHz} Hz.`,
      builderNotes: [
        matrix.shellMaterial?.rationale,
        matrix.shellThickness?.rationale,
        matrix.bearingEdge?.rationale,
        matrix.headTension?.rationale,
        matrix.hoopType?.rationale,
        matrix.snareBedDepth?.rationale,
        matrix.snareSideHead?.rationale,
        matrix.snareWireCount?.rationale,
        matrix.snareWireStyle?.rationale,
        matrix.snareWireMaterial?.rationale,
        matrix.reRings?.rationale,
        matrix.hardwareType?.rationale,
        matrix.finishType?.rationale,
      ].filter(Boolean),
    },
  };
}

export default generateCraftsmanSummary;