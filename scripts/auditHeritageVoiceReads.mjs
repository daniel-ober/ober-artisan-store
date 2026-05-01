
import fs from 'fs';

import path from 'path';

import vm from 'vm';

import { createRequire } from 'module';

import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);

const ROOT = path.resolve(path.dirname(__filename), '..');

const OUT_JSON = path.join(ROOT, 'heritage-voice-audit-report.json');

const OUT_CSV = path.join(ROOT, 'heritage-voice-audit-cases.csv');

const AXES = ['attack', 'brightness', 'projection', 'sustain', 'warmth', 'sensitivity', 'control'];

const DEFAULT_BENCHMARK = {

  benchmarkFamilyId: 'ober-custom',

  benchmarkTypeId: 'heritage-oak-reference',

  benchmarkSizeId: '14x5_5',

};

const TEST_DEPTHS_BY_SIZE = {

  12: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  13: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

  14: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],

};

const TEST_STAVE_OPTIONS_BY_SIZE_AND_LUGS = {

  12: {

    6: ['12 - 8mm + $150 (Re-Rings Required)'],

    8: ['16 - 10mm'],

  },

  13: {

    8: ['16 - 10mm'],

  },

  14: {

    8: ['16 - 10mm'],

    10: ['20 - 12mm', '10 - 7mm + $150 (Re-Rings Required)'],

  },

};

const TEST_HOOPS = ['Triple Flange', 'Die-Cast'];

const TEST_HARDWARE = ['Chrome', 'Black Nickel', 'Brass/Gold'];

const TEST_FINISHES = ['Light Torch', 'Medium Torch', 'Blackened'];

const SLOT_ORDER = { simple: 0, shaped: 1, complex: 2 };

const EXPECTED_LABEL_BY_SLOT = {

  simple: 'First Hit',

  shaped: 'Under the Hands',

  complex: 'From the Bench',

};

const moduleCache = new Map();

function resolveModulePath(fromFile, request) {

  if (!request.startsWith('.')) return request;

  const base = path.resolve(path.dirname(fromFile), request);

  const candidates = [

    base,

    `${base}.js`,

    `${base}.mjs`,

    `${base}.json`,

    path.join(base, 'index.js'),

  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));

  if (!found) throw new Error(`Could not resolve ${request} from ${fromFile}`);

  return found;

}

function splitNamed(namedBlock) {

  return namedBlock

    .split(',')

    .map((item) => item.trim())

    .filter(Boolean)

    .map((item) => {

      const [left, right] = item.split(/\s+as\s+/);

      return {

        imported: left.trim(),

        local: (right || left).trim(),

      };

    });

}

function transformEsmToCjs(source) {

  let code = source;

  code = code.replace(

    /import\s+([\w$]+)\s*,\s*\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g,

    (_m, defaultName, namedBlock, request) => {

      const named = splitNamed(namedBlock)

        .map(({ imported, local }) => `${imported}: ${local}`)

        .join(', ');

      return `const __mod_${defaultName} = __require(${JSON.stringify(request)}); const ${defaultName} = __mod_${defaultName}.default || __mod_${defaultName}; const { ${named} } = __mod_${defaultName};`;

    }

  );

  code = code.replace(

    /import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]\s*;?/g,

    (_m, namedBlock, request) => {

      const named = splitNamed(namedBlock)

        .map(({ imported, local }) => `${imported}: ${local}`)

        .join(', ');

      return `const { ${named} } = __require(${JSON.stringify(request)});`;

    }

  );

  code = code.replace(

    /import\s+([\w$]+)\s+from\s+['"]([^'"]+)['"]\s*;?/g,

    (_m, localName, request) => {

      return `const __mod_${localName} = __require(${JSON.stringify(request)}); const ${localName} = __mod_${localName}.default || __mod_${localName};`;

    }

  );

  code = code.replace(/import\s+['"]([^'"]+)['"]\s*;?/g, '');

  // Handle anonymous default object/array/function/class expressions.

  code = code.replace(/export\s+default\s+(\{[\s\S]*?\n\})\s*;?\s*$/m, 'module.exports.default = $1;');

  code = code.replace(/export\s+default\s+(\[[\s\S]*?\n\])\s*;?\s*$/m, 'module.exports.default = $1;');

  code = code.replace(/export\s+default\s+function\s*\(/g, 'module.exports.default = function(');

  code = code.replace(/export\s+default\s+class\s+/g, 'module.exports.default = class ');

  const explicitExports = [];

  code = code.replace(/export\s+function\s+([\w$]+)\s*\(/g, (_m, name) => {

    explicitExports.push({ exported: name, local: name });

    return `function ${name}(`;

  });

  code = code.replace(/export\s+const\s+([\w$]+)\s*=/g, (_m, name) => {

    explicitExports.push({ exported: name, local: name });

    return `const ${name} =`;

  });

  code = code.replace(/export\s+let\s+([\w$]+)\s*=/g, (_m, name) => {

    explicitExports.push({ exported: name, local: name });

    return `let ${name} =`;

  });

  code = code.replace(/export\s+var\s+([\w$]+)\s*=/g, (_m, name) => {

    explicitExports.push({ exported: name, local: name });

    return `var ${name} =`;

  });

  code = code.replace(/export\s*\{([^}]+)\}\s*;?/g, (_m, block) => {

    splitNamed(block).forEach(({ imported, local }) => {

      explicitExports.push({ exported: local, local: imported });

    });

    return '';

  });

  code = code.replace(/export\s+default\s+([\w$]+)\s*;?/g, (_m, name) => {

    explicitExports.push({ exported: 'default', local: name });

    return '';

  });

  const exportLines = explicitExports.map(({ exported, local }) => {

    return `try { module.exports.${exported} = ${local}; } catch (_) {}`;

  });

  return `${code}\n\n${exportLines.join('\n')}\n`;

}

function loadLocalModule(filePath) {

  const resolved = path.resolve(filePath);

  if (moduleCache.has(resolved)) return moduleCache.get(resolved).exports;

  if (resolved.endsWith('.json')) {

    const jsonExports = JSON.parse(fs.readFileSync(resolved, 'utf8'));

    moduleCache.set(resolved, { exports: jsonExports });

    return jsonExports;

  }

  const raw = fs.readFileSync(resolved, 'utf8');

  const transformed = transformEsmToCjs(raw);

  const module = { exports: {} };

  moduleCache.set(resolved, module);

  const localRequire = (request) => {

    const target = resolveModulePath(resolved, request);

    if (!target.startsWith(ROOT)) return require(target);

    return loadLocalModule(target);

  };

  const context = vm.createContext({

    module,

    exports: module.exports,

    __require: localRequire,

    require: localRequire,

    console,

    process,

    Math,

    Number,

    String,

    Boolean,

    Array,

    Object,

    Date,

    JSON,

    RegExp,

    Set,

    Map,

  });

  try {

    new vm.Script(transformed, { filename: resolved, displayErrors: true }).runInContext(context);

  } catch (error) {

    console.error(`\nFailed loading module: ${resolved}\n`);

    console.error(error);

    process.exit(1);

  }

  return module.exports;

}

function toNumber(value, fallback = 5) {

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : fallback;

}

function round(value, places = 2) {

  return Number(Number(value || 0).toFixed(places));

}

function axisDelta(profile, axis) {

  return round(toNumber(profile?.[axis], 5) - 5, 2);

}

function movementScore(profile) {

  return round(AXES.reduce((sum, axis) => sum + Math.abs(axisDelta(profile, axis)), 0), 2);

}

function spreadScore(profile) {

  const values = AXES.map((axis) => toNumber(profile?.[axis], 5));

  return round(Math.max(...values) - Math.min(...values), 2);

}

function createInputs() {

  const inputs = [];

  Object.entries(TEST_DEPTHS_BY_SIZE).forEach(([size, depths]) => {

    depths.forEach((depth) => {

      const lugMap = TEST_STAVE_OPTIONS_BY_SIZE_AND_LUGS[size] || {};

      Object.entries(lugMap).forEach(([lugs, staveOptions]) => {

        staveOptions.forEach((staveOption) => {

          TEST_HOOPS.forEach((hoopType) => {

            TEST_HARDWARE.forEach((hardwareColor) => {

              TEST_FINISHES.forEach((scorchDepth) => {

                inputs.push({

                  ...DEFAULT_BENCHMARK,

                  size,

                  depth,

                  lugs,

                  staveOption,

                  hoopType,

                  hardwareColor,

                  scorchDepth,

                });

              });

            });

          });

        });

      });

    });

  });

  return inputs;

}

function signature(input) {

  return [

    input.size,

    input.depth,

    input.lugs,

    input.staveOption,

    input.hoopType,

    input.hardwareColor,

    input.scorchDepth,

  ].join('|');

}

function label(input) {

  return [

    `${input.size}x${input.depth}`,

    `${input.lugs} lugs`,

    input.staveOption,

    input.hoopType,

    input.hardwareColor,

    input.scorchDepth,

  ].join(' • ');

}

function slotSort(relationships) {

  return [...relationships].sort((a, b) => {

    const slotDelta = (SLOT_ORDER[a.slotKey] ?? 99) - (SLOT_ORDER[b.slotKey] ?? 99);

    if (slotDelta !== 0) return slotDelta;

    return Number(b.score || 0) - Number(a.score || 0);

  });

}

function classifyStrength(score) {

  const n = Number(score);

  if (!Number.isFinite(n)) return 'unknown';

  if (n >= 4.25) return 'strong';

  if (n >= 3.1) return 'clear';

  if (n >= 2) return 'moderate';

  if (n >= 1) return 'subtle';

  return 'reference';

}

function compactProfile(profile) {

  return AXES.reduce((acc, axis) => {

    acc[axis] = round(toNumber(profile?.[axis], 5), 2);

    return acc;

  }, {});

}

function deltaProfile(profile) {

  return AXES.reduce((acc, axis) => {

    acc[axis] = axisDelta(profile, axis);

    return acc;

  }, {});

}

function relationshipDigest(relationships) {

  return relationships.map((rel) => `${rel.slotKey}:${rel.id}`).join(' > ');

}

function countBy(items, getter) {

  return items.reduce((acc, item) => {

    const key = getter(item) || 'None';

    acc[key] = (acc[key] || 0) + 1;

    return acc;

  }, {});

}

function csvEscape(value) {

  const str = String(value ?? '');

  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;

  return str;

}

function writeCsv(cases) {

  const headers = [

    'label',

    'signature',

    'size',

    'depth',

    'lugs',

    'staveOption',

    'hoopType',

    'hardwareColor',

    'scorchDepth',

    'movement',

    'spread',

    'firstHit',

    'firstHitScore',

    'underTheHands',

    'underTheHandsScore',

    'fromTheBench',

    'fromTheBenchScore',

    'digest',

    ...AXES,

    ...AXES.map((axis) => `${axis}Delta`),

    'playingSituation',

    'feelReadText',

    'highlightedCharacteristics',

  ];

  const rows = cases.map((item) => {

    const bySlot = Object.fromEntries(item.relationships.map((rel) => [rel.slotKey, rel]));

    return [

      item.label,

      item.signature,

      item.input.size,

      item.input.depth,

      item.input.lugs,

      item.input.staveOption,

      item.input.hoopType,

      item.input.hardwareColor,

      item.input.scorchDepth,

      item.movement,

      item.spread,

      bySlot.simple?.title || '',

      bySlot.simple?.score || '',

      bySlot.shaped?.title || '',

      bySlot.shaped?.score || '',

      bySlot.complex?.title || '',

      bySlot.complex?.score || '',

      item.digest,

      ...AXES.map((axis) => item.profile[axis]),

      ...AXES.map((axis) => item.deltas[axis]),

      item.playingSituation,

      item.feelRead,

      item.highlightedCharacteristics,

    ].map(csvEscape).join(',');

  });

  fs.writeFileSync(OUT_CSV, [headers.join(','), ...rows].join('\n'));

}

function getRepeatedReadIssues(cases) {

  const issues = [];

  for (let i = 0; i < cases.length; i += 1) {

    for (let j = i + 1; j < cases.length; j += 1) {

      const a = cases[i];

      const b = cases[j];

      const profileDistance = AXES.reduce((sum, axis) => {

        return sum + Math.abs(toNumber(a.profile[axis], 5) - toNumber(b.profile[axis], 5));

      }, 0);

      const differentMajorSpec =

        a.input.size !== b.input.size ||

        a.input.depth !== b.input.depth ||

        a.input.lugs !== b.input.lugs ||

        a.input.staveOption !== b.input.staveOption ||

        a.input.hoopType !== b.input.hoopType ||

        a.input.scorchDepth !== b.input.scorchDepth;

      if (!differentMajorSpec) continue;

      if (a.digest === b.digest && profileDistance >= 1.2) {

        issues.push({

          severity: 'review',

          type: 'same-three-card-read-despite-profile-movement',

          profileDistance: round(profileDistance, 2),

          from: a.label,

          to: b.label,

          digest: a.digest,

        });

      } else if (a.topRelationshipId === b.topRelationshipId && profileDistance >= 1.85) {

        issues.push({

          severity: 'watch',

          type: 'same-top-read-despite-large-profile-movement',

          profileDistance: round(profileDistance, 2),

          from: a.label,

          to: b.label,

          topRelationship: a.topRelationshipTitle,

        });

      }

    }

  }

  return issues.sort((a, b) => b.profileDistance - a.profileDistance).slice(0, 100);

}

function expectedBehaviorChecks(casesBySignature) {

  const checks = [];

  function get(input) {

    return casesBySignature.get(signature(input));

  }

  function compare(name, fromInput, toInput, expectations) {

    const from = get(fromInput);

    const to = get(toInput);

    if (!from || !to) {

      checks.push({ name, status: 'missing-case', from: signature(fromInput), to: signature(toInput) });

      return;

    }

    const changes = AXES.reduce((acc, axis) => {

      acc[axis] = round(to.profile[axis] - from.profile[axis], 2);

      return acc;

    }, {});

    const failures = [];

    Object.entries(expectations).forEach(([axis, expected]) => {

      const value = changes[axis];

      if (expected === 'increase' && value <= 0) failures.push(`${axis} should increase`);

      if (expected === 'decrease' && value >= 0) failures.push(`${axis} should decrease`);

    });

    checks.push({

      name,

      status: failures.length ? 'review' : 'pass',

      failures,

      from: from.label,

      to: to.label,

      fromTop: from.topRelationshipTitle,

      toTop: to.topRelationshipTitle,

      changedTop: from.topRelationshipId !== to.topRelationshipId,

      totalMovement: round(AXES.reduce((sum, axis) => sum + Math.abs(changes[axis]), 0), 2),

      changes,

    });

  }

  compare(

    'Depth 12x5.0 → 12x8.0 should add body/bloom and reduce quickness',

    {

      size: '12',

      depth: '5.0',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    {

      size: '12',

      depth: '8.0',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    { warmth: 'increase', sustain: 'increase', attack: 'decrease', brightness: 'decrease' }

  );

  compare(

    'Depth 14x5.0 → 14x8.0 should add body/bloom',

    {

      size: '14',

      depth: '5.0',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    {

      size: '14',

      depth: '8.0',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    { warmth: 'increase', sustain: 'increase', attack: 'decrease', brightness: 'decrease' }

  );

  compare(

    'Triple Flange → Die-Cast should increase control/focus and reduce sustain',

    {

      size: '14',

      depth: '6.5',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    {

      size: '14',

      depth: '6.5',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Die-Cast',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    { control: 'increase', attack: 'increase', sustain: 'decrease' }

  );

  compare(

    'Medium Torch → Blackened should increase control and reduce sustain/sensitivity',

    {

      size: '14',

      depth: '6.5',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    {

      size: '14',

      depth: '6.5',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Blackened',

    },

    { control: 'increase', sustain: 'decrease', sensitivity: 'decrease' }

  );

  compare(

    '14x6.5 8-lug 10mm → 10-lug 12mm should increase attack/projection/control',

    {

      size: '14',

      depth: '6.5',

      lugs: '8',

      staveOption: '16 - 10mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    {

      size: '14',

      depth: '6.5',

      lugs: '10',

      staveOption: '20 - 12mm',

      hoopType: 'Triple Flange',

      hardwareColor: 'Chrome',

      scorchDepth: 'Medium Torch',

    },

    { attack: 'increase', projection: 'increase', control: 'increase', sustain: 'decrease' }

  );

  return checks;

}

function main() {

  const buildHeritageVoiceReadModule = loadLocalModule(

    path.join(ROOT, 'src/utils/legacyPrint/buildHeritageVoiceRead.js')

  );

  const keyRelationshipsModule = loadLocalModule(

    path.join(ROOT, 'src/utils/legacyPrint/heritageKeyRelationships.js')

  );

  const buildHeritageVoiceRead =

    buildHeritageVoiceReadModule.default || buildHeritageVoiceReadModule.buildHeritageVoiceRead;

  const buildKeyRelationships =

    keyRelationshipsModule.buildKeyRelationships || keyRelationshipsModule.default;

  if (typeof buildHeritageVoiceRead !== 'function') {

    throw new Error('Could not load buildHeritageVoiceRead.');

  }

  if (typeof buildKeyRelationships !== 'function') {

    throw new Error('Could not load buildKeyRelationships.');

  }

  const inputs = createInputs();

  const cases = inputs.map((input) => {

    const read = buildHeritageVoiceRead(input);

    const rawRelationships = buildKeyRelationships(read).slice(0, 3);

    const relationships = slotSort(rawRelationships);

    const profile = compactProfile(read.profile || {});

    const deltas = deltaProfile(profile);

    return {

      label: label(input),

      signature: signature(input),

      input,

      profile,

      deltas,

      movement: movementScore(profile),

      spread: spreadScore(profile),

      rawRelationships: rawRelationships.map((rel) => ({

        id: rel.id,

        slotKey: rel.slotKey,

        title: rel.title,

        score: round(rel.score, 4),

        strength: classifyStrength(rel.score),

      })),

      relationships: relationships.map((rel) => ({

        expectedUiLabel: EXPECTED_LABEL_BY_SLOT[rel.slotKey] || rel.slotKey,

        id: rel.id,

        slotKey: rel.slotKey,

        title: rel.title,

        nodes: rel.nodes || [],

        score: round(rel.score, 4),

        strength: classifyStrength(rel.score),

      })),

      digest: relationshipDigest(relationships),

      topRelationshipId: relationships[0]?.id || '',

      topRelationshipTitle: relationships[0]?.title || '',

      primaryGenre: read.primaryGenre || '',

      secondaryGenres: read.secondaryGenres || [],

      recordingMic: read.recordingMic || '',

      playingSituation: read.playingSituation || '',

      feelRead: read.feelRead || '',

      highlightedCharacteristics: read.highlightedCharacteristics || '',

      sourceBuildRead: read.sourceBuildRead || '',

    };

  });

  const casesBySignature = new Map(cases.map((item) => [item.signature, item]));

  const relationshipCounts = countBy(cases, (item) => item.topRelationshipTitle);

  const digestCounts = countBy(cases, (item) => item.digest);

  const firstHitCounts = countBy(cases, (item) => item.relationships.find((rel) => rel.slotKey === 'simple')?.title);

  const underHandsCounts = countBy(cases, (item) => item.relationships.find((rel) => rel.slotKey === 'shaped')?.title);

  const benchCounts = countBy(cases, (item) => item.relationships.find((rel) => rel.slotKey === 'complex')?.title);

  const weakCases = cases.filter((item) => item.movement < 0.75 || item.spread < 0.3);

  const repeatedReadIssues = getRepeatedReadIssues(cases);

  const expectationChecks = expectedBehaviorChecks(casesBySignature);

  const report = {

    generatedAt: new Date().toISOString(),

    summary: {

      totalCases: cases.length,

      uniqueTopReads: Object.keys(relationshipCounts).length,

      uniqueThreeCardDigests: Object.keys(digestCounts).length,

      weakCases: weakCases.length,

      repeatedReadIssues: repeatedReadIssues.length,

      expectationChecksNeedingReview: expectationChecks.filter((item) => item.status === 'review').length,

    },

    distributions: {

      topRelationshipCounts: relationshipCounts,

      threeCardDigestCounts: digestCounts,

      firstHitCounts,

      underHandsCounts,

      benchCounts,

    },

    expectationChecks,

    repeatedReadIssues,

    weakCases: weakCases.map((item) => ({

      label: item.label,

      movement: item.movement,

      spread: item.spread,

      digest: item.digest,

      profile: item.profile,

      deltas: item.deltas,

    })),

    cases,

  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));

  writeCsv(cases);

  console.log('\nHERITAGE VOICE READ AUDIT COMPLETE\n');

  console.table(report.summary);

  console.log('\nTop Relationship Distribution');

  console.table(

    Object.entries(relationshipCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([relationship, count]) => ({ relationship, count }))

  );

  console.log('\nFirst Hit Distribution');

  console.table(

    Object.entries(firstHitCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([read, count]) => ({ read, count }))

  );

  console.log('\nUnder the Hands Distribution');

  console.table(

    Object.entries(underHandsCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([read, count]) => ({ read, count }))

  );

  console.log('\nFrom the Bench Distribution');

  console.table(

    Object.entries(benchCounts)

      .sort((a, b) => b[1] - a[1])

      .map(([read, count]) => ({ read, count }))

  );

  console.log('\nExpected Behavior Checks');

  console.table(

    expectationChecks.map((item) => ({

      status: item.status,

      name: item.name,

      changedTop: item.changedTop,

      totalMovement: item.totalMovement,

      failures: item.failures?.join(' | ') || '',

      fromTop: item.fromTop,

      toTop: item.toTop,

    }))

  );

  if (repeatedReadIssues.length) {

    console.log('\nHighest-priority repeated-read review items');

    console.table(

      repeatedReadIssues.slice(0, 25).map((item) => ({

        type: item.type,

        distance: item.profileDistance,

        topRelationship: item.topRelationship || '',

        digest: item.digest || '',

        from: item.from,

        to: item.to,

      }))

    );

  }

  if (weakCases.length) {

    console.log('\nWeak / flat cases');

    console.table(

      weakCases.slice(0, 25).map((item) => ({

        label: item.label,

        movement: item.movement,

        spread: item.spread,

        digest: item.digest,

      }))

    );

  }

  console.log(`\nWrote JSON report: ${path.relative(ROOT, OUT_JSON)}`);

  console.log(`Wrote CSV cases:   ${path.relative(ROOT, OUT_CSV)}\n`);

}

main();

