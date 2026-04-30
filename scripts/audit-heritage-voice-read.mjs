import buildHeritageVoiceRead from '../src/utils/legacyPrint/buildHeritageVoiceRead.js';
import buildVoiceThreadReadout from '../src/utils/legacyPrint/buildVoiceThreadReadout.js';
import { buildKeyRelationships } from '../src/utils/legacyPrint/heritageKeyRelationships.js';

const DEFAULT_BENCHMARK = {
  benchmarkFamilyId: 'ober-custom',
  benchmarkTypeId: 'heritage-oak-reference',
  benchmarkSizeId: '14x5_5',
};

const AXES = [
  'attack',
  'brightness',
  'projection',
  'sustain',
  'warmth',
  'sensitivity',
  'control',
];

const DEPTHS_BY_SIZE = {
  12: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],
  13: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],
  14: ['5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0'],
};

const STAVE_OPTIONS_BY_SIZE_AND_LUGS = {
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

const HOOPS = ['Triple Flange', 'Die-Cast'];
const HARDWARE = ['Chrome', 'Black Nickel', 'Brass/Gold'];
const FINISHES = ['Light Torch', 'Medium Torch', 'Blackened'];

const GOLDEN_CASES = [
  {
    name: '14x5.5 all-round Heritage center',
    input: {
      size: '14',
      depth: '5.5',
      lugs: '8',
      staveOption: '16 - 10mm',
      hoopType: 'Triple Flange',
      hardwareColor: 'Chrome',
      scorchDepth: 'Medium Torch',
    },
    topThreadId: 'balanced-heritage-center',
    maxAbsDelta: 0.12,
    textIncludes: ['all-round', 'warm', 'crisp', 'balanced'],
  },
  {
    name: '12x5 bite and quick dry response',
    input: {
      size: '12',
      depth: '5.0',
      lugs: '8',
      staveOption: '16 - 10mm',
      hoopType: 'Triple Flange',
      hardwareColor: 'Chrome',
      scorchDepth: 'Medium Torch',
    },
    topThreadId: 'compact-quick-lean-response',
    deltas: {
      attack: { min: 0.45 },
      brightness: { min: 0.35 },
      sustain: { max: -0.3 },
      warmth: { max: -0.35 },
    },
    textIncludes: ['bite', 'dry', 'quick'],
  },
  {
    name: '14x8 darker dry classic Triple Flange',
    input: {
      size: '14',
      depth: '8.0',
      lugs: '8',
      staveOption: '16 - 10mm',
      hoopType: 'Triple Flange',
      hardwareColor: 'Chrome',
      scorchDepth: 'Medium Torch',
    },
    topThreadId: 'warm-deep-settled-center',
    forbiddenTopThreadIds: ['wide-open-heritage-bloom'],
    deltas: {
      brightness: { max: -0.3 },
      attack: { max: -0.3 },
      warmth: { min: 0.5 },
      sustain: { min: 0.7 },
    },
    textIncludes: ['darker', 'drier', 'Triple Flange'],
  },
  {
    name: '14x6.5 heavy blackened crack',
    input: {
      size: '14',
      depth: '6.5',
      lugs: '10',
      staveOption: '20 - 12mm',
      hoopType: 'Die-Cast',
      hardwareColor: 'Chrome',
      scorchDepth: 'Blackened',
    },
    topThreadId: 'shorter-note-firm-response',
    deltas: {
      attack: { min: 0.8 },
      projection: { min: 0.7 },
      sustain: { max: -0.5 },
      control: { min: 1.0 },
    },
    textIncludes: ['projection', 'crack', 'beef', 'drier'],
  },
  {
    name: '14x6.5 thin re-ring complex Light Torch',
    input: {
      size: '14',
      depth: '6.5',
      lugs: '10',
      staveOption: '10 - 7mm + $150 (Re-Rings Required)',
      hoopType: 'Triple Flange',
      hardwareColor: 'Chrome',
      scorchDepth: 'Light Torch',
    },
    topThreadId: 'dark-complex-heritage-bloom',
    deltas: {
      sustain: { min: 0.8 },
      warmth: { min: 0.4 },
      brightness: { max: 0 },
      control: { max: -0.25 },
    },
    textIncludes: ['complex', 'overtone', 'longer sustain'],
  },
  {
    name: '12x6.5 re-ring studio warmth',
    input: {
      size: '12',
      depth: '6.5',
      lugs: '6',
      staveOption: '12 - 8mm + $150 (Re-Rings Required)',
      hoopType: 'Triple Flange',
      hardwareColor: 'Chrome',
      scorchDepth: 'Medium Torch',
    },
    deltas: {
      warmth: { min: 0.35 },
      sustain: { min: 0.5 },
      control: { min: -0.45 },
    },
    textIncludes: ['studio', 'warm'],
  },
];

const PREFERRED_DIRECTION_BY_THREAD_ID = {
  'clear-front-edge-lift': { attack: 'high', brightness: 'high' },
  'lively-touch-open-detail': { sensitivity: 'high', brightness: 'high' },
  'focused-throw-clean-shape': { attack: 'high', projection: 'high' },
  'compact-quick-lean-response': {
    attack: 'high',
    brightness: 'high',
    warmth: 'low',
  },
  'warm-deep-settled-center': { warmth: 'high', sustain: 'high' },
  'rounded-body-clear-start': {
    attack: 'either',
    warmth: 'high',
    sustain: 'high',
  },
  'grounded-body-directed-carry': {
    warmth: 'high',
    control: 'high',
    projection: 'high',
  },
  'expressive-blooming-response': {
    warmth: 'high',
    sustain: 'high',
    sensitivity: 'high',
  },
  'fast-disciplined-touch-response': {
    attack: 'high',
    sensitivity: 'high',
    control: 'high',
  },
  'body-blooms-outward': {
    warmth: 'high',
    sustain: 'high',
    projection: 'high',
    control: 'either',
  },
  'wide-open-heritage-bloom': {
    sustain: 'high',
    warmth: 'high',
    sensitivity: 'high',
    brightness: 'either',
  },
  'dark-complex-heritage-bloom': {
    sustain: 'high',
    warmth: 'high',
    brightness: 'low',
    control: 'low',
  },
  'shorter-note-firm-response': {
    control: 'high',
    sustain: 'low',
    attack: 'high',
    projection: 'either',
  },
  'dark-contained-shell-shape': {
    control: 'high',
    warmth: 'high',
    sustain: 'low',
    sensitivity: 'low',
  },
};

const round = (value, places = 4) => Number(Number(value || 0).toFixed(places));

const getAxis = (read, axis) => Number(read?.profile?.[axis] ?? 5);

const getDelta = (read, axis) => getAxis(read, axis) - 5;

const getProfileSpread = (read) => {
  const values = AXES.map((axis) => getAxis(read, axis));
  return round(Math.max(...values) - Math.min(...values), 2);
};

const getMovementScore = (read) =>
  round(
    AXES.reduce((sum, axis) => sum + Math.abs(getDelta(read, axis)), 0),
    2
  );

const signature = (input) =>
  [
    input.size,
    input.depth,
    input.lugs,
    input.staveOption,
    input.hoopType,
    input.hardwareColor,
    input.scorchDepth,
  ].join('|');

const acousticSignature = (input) =>
  [
    input.size,
    input.depth,
    input.lugs,
    input.staveOption,
    input.hoopType,
    input.scorchDepth,
  ].join('|');

const withoutDepthSignature = (input) =>
  [
    input.size,
    input.lugs,
    input.staveOption,
    input.hoopType,
    input.hardwareColor,
    input.scorchDepth,
  ].join('|');

const withoutHoopSignature = (input) =>
  [
    input.size,
    input.depth,
    input.lugs,
    input.staveOption,
    input.hardwareColor,
    input.scorchDepth,
  ].join('|');

const withoutFinishSignature = (input) =>
  [
    input.size,
    input.depth,
    input.lugs,
    input.staveOption,
    input.hoopType,
    input.hardwareColor,
  ].join('|');

const withoutLugStaveSignature = (input) =>
  [
    input.size,
    input.depth,
    input.hoopType,
    input.hardwareColor,
    input.scorchDepth,
  ].join('|');

const labelInput = (input) =>
  [
    `${input.size}x${input.depth}`,
    `${input.lugs} lugs`,
    input.staveOption,
    input.hoopType,
    input.hardwareColor,
    input.scorchDepth,
  ].join(' / ');

const getGoldenReadText = (row) =>
  [
    row?.read?.playingSituation,
    row?.read?.feelRead,
    row?.read?.highlightedCharacteristics,
    row?.read?.sourceBuildRead,
    row?.activeThread?.title,
    row?.activeThread?.summary,
    row?.activeThreadReadout?.whatThreadIsTellingUs,
    row?.activeThreadReadout?.trustNote,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const createInputs = () => {
  const inputs = [];

  Object.entries(DEPTHS_BY_SIZE).forEach(([size, depths]) => {
    depths.forEach((depth) => {
      Object.entries(STAVE_OPTIONS_BY_SIZE_AND_LUGS[size] || {}).forEach(
        ([lugs, staveOptions]) => {
          staveOptions.forEach((staveOption) => {
            HOOPS.forEach((hoopType) => {
              HARDWARE.forEach((hardwareColor) => {
                FINISHES.forEach((scorchDepth) => {
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
        }
      );
    });
  });

  return inputs;
};

const buildProjectedVoiceRange = (read) => {
  const profile = read?.profile || {};
  const warmth = Number(profile.warmth ?? 5);
  const brightness = Number(profile.brightness ?? 5);
  const attack = Number(profile.attack ?? 5);
  const projection = Number(profile.projection ?? 5);
  const sustain = Number(profile.sustain ?? 5);

  const weighted =
    3 +
    (warmth - 5) * -0.75 +
    (sustain - 5) * -0.18 +
    (brightness - 5) * 0.85 +
    (attack - 5) * 0.22 +
    (projection - 5) * 0.18;

  return Math.max(1, Math.min(5, weighted));
};

const getLegacyTuningRangeBounds = (position) => {
  const center = Number(position || 3);
  const width = 0.42;

  return {
    start: Math.max(1, center - width),
    end: Math.min(5, center + width),
    center,
  };
};

const mapPositionToHz = (position) => {
  const clamped = Math.max(1, Math.min(5, Number(position || 3)));

  if (clamped <= 2) return 80 + (clamped - 1) * (180 - 80);
  if (clamped <= 3) return 180 + (clamped - 2) * (350 - 180);
  if (clamped <= 4) return 350 + (clamped - 3) * (1200 - 350);

  return 1200 + (clamped - 4) * (4000 - 1200);
};

const getLegacyTuningHzRange = (range) => {
  const startHz = Math.round(mapPositionToHz(range.start));
  const endHz = Math.round(mapPositionToHz(range.end));
  return { startHz, endHz, label: `${startHz}-${endHz} Hz` };
};

const isReferenceLike = (input) =>
  input.size === '14' &&
  input.depth === '5.5' &&
  input.lugs === '8' &&
  input.staveOption === '16 - 10mm' &&
  input.hoopType === 'Triple Flange' &&
  input.scorchDepth === 'Medium Torch';

const collectRead = (input) => {
  const read = buildHeritageVoiceRead(input);
  const relationships = buildKeyRelationships(read);
  const activeThread = relationships[0] || null;
  const activeThreadReadout = activeThread
    ? buildVoiceThreadReadout({
        thread: activeThread,
        profile: read.profile,
        sourceBuildRead: read.sourceBuildRead,
      })
    : null;
  const legacyTuningPosition = buildProjectedVoiceRange(read);
  const legacyTuningRange = getLegacyTuningRangeBounds(legacyTuningPosition);
  const legacyTuningHz = getLegacyTuningHzRange(legacyTuningRange);

  return {
    input,
    read,
    relationships,
    activeThread,
    activeThreadReadout,
    legacyTuningPosition: round(legacyTuningPosition, 4),
    legacyTuningRange,
    legacyTuningHz,
    spread: getProfileSpread(read),
    movementScore: getMovementScore(read),
  };
};

const issues = [];

const addIssue = (severity, category, message, row, details = {}) => {
  issues.push({
    severity,
    category,
    message,
    config: row?.input ? labelInput(row.input) : '',
    signature: row?.input ? signature(row.input) : '',
    ...details,
  });
};

const assertDirection = ({
  category,
  message,
  from,
  to,
  axis,
  expected,
  tolerance = 0.075,
}) => {
  const fromValue = getAxis(from.read, axis);
  const toValue = getAxis(to.read, axis);
  const diff = round(toValue - fromValue, 4);
  const failed =
    expected === 'increase'
      ? diff < -tolerance
      : expected === 'decrease'
        ? diff > tolerance
        : Math.abs(diff) > tolerance;

  if (failed) {
    addIssue(
      'error',
      category,
      `${message}: expected ${axis} to ${expected}, saw ${diff}.`,
      to,
      {
        from: labelInput(from.input),
        to: labelInput(to.input),
        axis,
        diff,
        fromValue,
        toValue,
      }
    );
  }
};

const auditSingleRead = (row) => {
  const { input, read, relationships, activeThread, activeThreadReadout } = row;

  AXES.forEach((axis) => {
    const value = getAxis(read, axis);

    if (!Number.isFinite(value) || value < 1 || value > 10) {
      addIssue('critical', 'voicemap-range', `${axis} is out of range.`, row, {
        axis,
        value,
      });
    }
  });

  if (!relationships.length) {
    addIssue(
      'critical',
      'voice-threads',
      'No Voice Threads were returned.',
      row
    );
  }

  const slotKeys = relationships.map((relationship) => relationship.slotKey);
  const uniqueSlotKeys = new Set(slotKeys);

  if (slotKeys.length !== uniqueSlotKeys.size) {
    addIssue(
      'critical',
      'voice-threads',
      'Voice Threads reused a slot instead of returning simple/shaped/complex coverage.',
      row,
      { slots: slotKeys.join(', ') }
    );
  }

  relationships.forEach((relationship) => {
    const expectedNodeCount =
      relationship.slotKey === 'simple'
        ? [2, 3]
        : relationship.slotKey === 'shaped'
          ? [3]
          : [4];
    const nodeCount = relationship.nodes?.length || 0;

    if (!expectedNodeCount.includes(nodeCount)) {
      addIssue(
        'error',
        'voice-thread-shape',
        `Thread ${relationship.id} has ${nodeCount} nodes for ${relationship.slotKey} slot.`,
        row,
        { threadId: relationship.id, nodeCount, slotKey: relationship.slotKey }
      );
    }
  });

  if (activeThread) {
    const preferredDirections =
      PREFERRED_DIRECTION_BY_THREAD_ID[activeThread.id] || {};

    Object.entries(preferredDirections).forEach(([axis, direction]) => {
      if (direction === 'either') return;

      const delta = getDelta(read, axis);
      const stronglyOpposite =
        direction === 'high' ? delta < -0.45 : delta > 0.45;

      if (stronglyOpposite) {
        addIssue(
          'error',
          'voice-thread-contradiction',
          `Top Voice Thread "${activeThread.title}" asks for ${axis} ${direction}, but the VoiceMap is strongly opposite.`,
          row,
          {
            threadId: activeThread.id,
            axis,
            direction,
            delta: round(delta, 2),
          }
        );
      }
    });
  }

  if (!activeThreadReadout?.whatThreadIsTellingUs) {
    addIssue(
      'critical',
      'voice-thread-readout',
      'Active Voice Thread did not produce customer-facing readout copy.',
      row
    );
  }

  const textFields = [
    ['playingSituation', read.playingSituation],
    ['feelRead', read.feelRead],
    ['highlightedCharacteristics', read.highlightedCharacteristics],
    ['sourceBuildRead', read.sourceBuildRead],
    ['threadReadout', activeThreadReadout?.whatThreadIsTellingUs],
    ['threadTrustNote', activeThreadReadout?.trustNote],
  ];

  textFields.forEach(([field, value]) => {
    const text = String(value || '');

    if (!text.trim()) {
      addIssue('critical', 'legacyprint-read', `${field} is empty.`, row);
    }

    if (/undefined|NaN|null/i.test(text)) {
      addIssue(
        'critical',
        'legacyprint-read',
        `${field} contains generated placeholder leakage.`,
        row,
        { field, value: text }
      );
    }
  });

  if (
    row.legacyTuningPosition < 1 ||
    row.legacyTuningPosition > 5 ||
    row.legacyTuningHz.startHz >= row.legacyTuningHz.endHz
  ) {
    addIssue(
      'critical',
      'legacy-tuning',
      'LegacyTuning range is invalid.',
      row,
      {
        position: row.legacyTuningPosition,
        hz: row.legacyTuningHz.label,
      }
    );
  }

  if (!isReferenceLike(input) && row.spread < 0.38) {
    addIssue(
      'warning',
      'voicemap-flatness',
      'Non-reference configuration is reading very close to flat.',
      row,
      { spread: row.spread, movementScore: row.movementScore }
    );
  }
};

const auditGoldenCases = (rows) => {
  const rowsBySignature = new Map(
    rows.map((row) => [signature(row.input), row])
  );

  GOLDEN_CASES.forEach((goldenCase) => {
    const row = rowsBySignature.get(signature(goldenCase.input));
    const fallbackRow = {
      input: {
        ...DEFAULT_BENCHMARK,
        ...goldenCase.input,
      },
    };

    if (!row) {
      addIssue(
        'critical',
        'golden-calibration',
        `Golden case "${goldenCase.name}" is not represented in the exhaustive matrix.`,
        fallbackRow
      );
      return;
    }

    if (
      goldenCase.topThreadId &&
      row.activeThread?.id !== goldenCase.topThreadId
    ) {
      addIssue(
        'error',
        'golden-calibration',
        `Golden case "${goldenCase.name}" expected top Voice Thread ${goldenCase.topThreadId}, saw ${row.activeThread?.id || 'none'}.`,
        row,
        {
          expectedThreadId: goldenCase.topThreadId,
          actualThreadId: row.activeThread?.id || null,
        }
      );
    }

    (goldenCase.forbiddenTopThreadIds || []).forEach((threadId) => {
      if (row.activeThread?.id === threadId) {
        addIssue(
          'error',
          'golden-calibration',
          `Golden case "${goldenCase.name}" should not top-rank ${threadId}.`,
          row,
          { forbiddenThreadId: threadId }
        );
      }
    });

    if (Number.isFinite(goldenCase.maxAbsDelta)) {
      AXES.forEach((axis) => {
        const delta = Math.abs(getDelta(row.read, axis));

        if (delta > goldenCase.maxAbsDelta) {
          addIssue(
            'error',
            'golden-calibration',
            `Golden case "${goldenCase.name}" should stay centered on ${axis}; saw delta ${round(delta, 2)}.`,
            row,
            {
              axis,
              delta: round(delta, 2),
              tolerance: goldenCase.maxAbsDelta,
            }
          );
        }
      });
    }

    Object.entries(goldenCase.deltas || {}).forEach(([axis, bounds]) => {
      const delta = getDelta(row.read, axis);

      if (Number.isFinite(bounds.min) && delta < bounds.min) {
        addIssue(
          'error',
          'golden-calibration',
          `Golden case "${goldenCase.name}" expected ${axis} delta >= ${bounds.min}, saw ${round(delta, 2)}.`,
          row,
          { axis, delta: round(delta, 2), min: bounds.min }
        );
      }

      if (Number.isFinite(bounds.max) && delta > bounds.max) {
        addIssue(
          'error',
          'golden-calibration',
          `Golden case "${goldenCase.name}" expected ${axis} delta <= ${bounds.max}, saw ${round(delta, 2)}.`,
          row,
          { axis, delta: round(delta, 2), max: bounds.max }
        );
      }
    });

    const readText = getGoldenReadText(row);

    (goldenCase.textIncludes || []).forEach((needle) => {
      const normalizedNeedle = String(needle || '').toLowerCase();

      if (!readText.includes(normalizedNeedle)) {
        addIssue(
          'error',
          'golden-calibration',
          `Golden case "${goldenCase.name}" readout should mention "${needle}".`,
          row,
          { needle }
        );
      }
    });
  });
};

const compareHardwareInvariance = (rows) => {
  const byAcousticKey = new Map();

  rows.forEach((row) => {
    const key = acousticSignature(row.input);
    byAcousticKey.set(key, [...(byAcousticKey.get(key) || []), row]);
  });

  byAcousticKey.forEach((group) => {
    const [base] = group;

    group.slice(1).forEach((row) => {
      AXES.forEach((axis) => {
        const diff = round(getAxis(row.read, axis) - getAxis(base.read, axis));

        if (Math.abs(diff) > 0.0001) {
          addIssue(
            'critical',
            'hardware-invariance',
            `Hardware finish changed acoustic VoiceMap axis ${axis}.`,
            row,
            {
              base: labelInput(base.input),
              axis,
              diff,
            }
          );
        }
      });

      if (row.activeThread?.id !== base.activeThread?.id) {
        addIssue(
          'critical',
          'hardware-invariance',
          'Hardware finish changed top acoustic Voice Thread.',
          row,
          {
            base: labelInput(base.input),
            baseThread: base.activeThread?.title,
            thread: row.activeThread?.title,
          }
        );
      }

      if (row.legacyTuningPosition !== base.legacyTuningPosition) {
        addIssue(
          'critical',
          'hardware-invariance',
          'Hardware finish changed LegacyTuning position.',
          row,
          {
            base: labelInput(base.input),
            basePosition: base.legacyTuningPosition,
            position: row.legacyTuningPosition,
          }
        );
      }
    });
  });
};

const compareDepthMovement = (rows) => {
  const byDepthKey = new Map();

  rows.forEach((row) => {
    const key = withoutDepthSignature(row.input);
    byDepthKey.set(key, [...(byDepthKey.get(key) || []), row]);
  });

  byDepthKey.forEach((group) => {
    const sorted = [...group].sort(
      (a, b) => Number(a.input.depth) - Number(b.input.depth)
    );

    for (let i = 1; i < sorted.length; i += 1) {
      const shallow = sorted[i - 1];
      const deep = sorted[i];

      assertDirection({
        category: 'depth-acoustics',
        message: 'Deeper shell should preserve or increase sustain/bloom',
        from: shallow,
        to: deep,
        axis: 'sustain',
        expected: 'increase',
      });

      assertDirection({
        category: 'depth-acoustics',
        message: 'Deeper shell should preserve or increase low-mid body',
        from: shallow,
        to: deep,
        axis: 'warmth',
        expected: 'increase',
      });

      assertDirection({
        category: 'depth-acoustics',
        message: 'Deeper shell should not become sharper at the front edge',
        from: shallow,
        to: deep,
        axis: 'attack',
        expected: 'decrease',
        tolerance: 0.09,
      });

      const tuningDiff = round(
        deep.legacyTuningPosition - shallow.legacyTuningPosition,
        4
      );

      if (tuningDiff > 0.09) {
        addIssue(
          'error',
          'legacy-tuning-depth',
          'Deeper shell moved LegacyTuning brighter/higher instead of darker/lower.',
          deep,
          {
            from: labelInput(shallow.input),
            to: labelInput(deep.input),
            tuningDiff,
            fromPosition: shallow.legacyTuningPosition,
            toPosition: deep.legacyTuningPosition,
          }
        );
      }
    }
  });
};

const compareHoopMovement = (rows) => {
  const byHoopKey = new Map();

  rows.forEach((row) => {
    const key = withoutHoopSignature(row.input);
    byHoopKey.set(key, [...(byHoopKey.get(key) || []), row]);
  });

  byHoopKey.forEach((group) => {
    const triple = group.find((row) => row.input.hoopType === 'Triple Flange');
    const dieCast = group.find((row) => row.input.hoopType === 'Die-Cast');

    if (!triple || !dieCast) return;

    assertDirection({
      category: 'hoop-acoustics',
      message: 'Die-Cast should increase note control',
      from: triple,
      to: dieCast,
      axis: 'control',
      expected: 'increase',
    });

    assertDirection({
      category: 'hoop-acoustics',
      message: 'Die-Cast should tighten sustain',
      from: triple,
      to: dieCast,
      axis: 'sustain',
      expected: 'decrease',
    });

    assertDirection({
      category: 'hoop-acoustics',
      message: 'Die-Cast should reduce touch openness',
      from: triple,
      to: dieCast,
      axis: 'sensitivity',
      expected: 'decrease',
    });
  });
};

const compareFinishMovement = (rows) => {
  const byFinishKey = new Map();

  rows.forEach((row) => {
    const key = withoutFinishSignature(row.input);
    byFinishKey.set(key, [...(byFinishKey.get(key) || []), row]);
  });

  byFinishKey.forEach((group) => {
    const light = group.find((row) => row.input.scorchDepth === 'Light Torch');
    const medium = group.find(
      (row) => row.input.scorchDepth === 'Medium Torch'
    );
    const blackened = group.find(
      (row) => row.input.scorchDepth === 'Blackened'
    );

    if (!light || !medium || !blackened) return;

    [
      [light, medium],
      [medium, blackened],
    ].forEach(([from, to]) => {
      assertDirection({
        category: 'finish-acoustics',
        message: 'Darker TorchTune treatment should increase control',
        from,
        to,
        axis: 'control',
        expected: 'increase',
      });

      assertDirection({
        category: 'finish-acoustics',
        message: 'Darker TorchTune treatment should reduce top-end brightness',
        from,
        to,
        axis: 'brightness',
        expected: 'decrease',
      });

      assertDirection({
        category: 'finish-acoustics',
        message: 'Darker TorchTune treatment should reduce touch sensitivity',
        from,
        to,
        axis: 'sensitivity',
        expected: 'decrease',
      });

      assertDirection({
        category: 'finish-acoustics',
        message: 'Darker TorchTune treatment should tighten sustain',
        from,
        to,
        axis: 'sustain',
        expected: 'decrease',
      });

      const tuningDiff = round(
        to.legacyTuningPosition - from.legacyTuningPosition
      );

      if (tuningDiff > 0.075) {
        addIssue(
          'error',
          'legacy-tuning-finish',
          'Darker finish moved LegacyTuning brighter/higher instead of darker/lower.',
          to,
          {
            from: labelInput(from.input),
            to: labelInput(to.input),
            tuningDiff,
            fromPosition: from.legacyTuningPosition,
            toPosition: to.legacyTuningPosition,
          }
        );
      }
    });
  });
};

const compareLugAndThicknessMovement = (rows) => {
  const byLugKey = new Map();

  rows
    .filter((row) => row.input.size === '14')
    .forEach((row) => {
      const key = withoutLugStaveSignature(row.input);
      byLugKey.set(key, [...(byLugKey.get(key) || []), row]);
    });

  byLugKey.forEach((group) => {
    const standard = group.find(
      (row) => row.input.lugs === '8' && row.input.staveOption === '16 - 10mm'
    );
    const heavy = group.find(
      (row) => row.input.lugs === '10' && row.input.staveOption === '20 - 12mm'
    );

    if (!standard || !heavy) return;

    assertDirection({
      category: 'lug-thickness-acoustics',
      message: '10-lug 12mm shell should increase projection',
      from: standard,
      to: heavy,
      axis: 'projection',
      expected: 'increase',
    });

    assertDirection({
      category: 'lug-thickness-acoustics',
      message: '10-lug 12mm shell should increase control',
      from: standard,
      to: heavy,
      axis: 'control',
      expected: 'increase',
    });

    assertDirection({
      category: 'lug-thickness-acoustics',
      message: '10-lug 12mm shell should tighten sustain',
      from: standard,
      to: heavy,
      axis: 'sustain',
      expected: 'decrease',
    });

    assertDirection({
      category: 'lug-thickness-acoustics',
      message: '10-lug 12mm shell should reduce low-dynamic touch response',
      from: standard,
      to: heavy,
      axis: 'sensitivity',
      expected: 'decrease',
    });
  });
};

const inputs = createInputs();
const rows = inputs.map(collectRead);

rows.forEach(auditSingleRead);
auditGoldenCases(rows);
compareHardwareInvariance(rows);
compareDepthMovement(rows);
compareHoopMovement(rows);
compareFinishMovement(rows);
compareLugAndThicknessMovement(rows);

const countsBySeverity = issues.reduce((acc, issue) => {
  acc[issue.severity] = (acc[issue.severity] || 0) + 1;
  return acc;
}, {});

const countsByCategory = issues.reduce((acc, issue) => {
  acc[issue.category] = (acc[issue.category] || 0) + 1;
  return acc;
}, {});

const relationshipCounts = rows.reduce((acc, row) => {
  const key = row.activeThread?.title || 'None';
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

const rangeSummary = AXES.reduce((acc, axis) => {
  const values = rows.map((row) => getAxis(row.read, axis));
  acc[axis] = {
    min: round(Math.min(...values), 2),
    max: round(Math.max(...values), 2),
  };
  return acc;
}, {});

console.log('HERITAGE LEGACYPRINT EXHAUSTIVE AUDIT');
console.table({
  totalConfigurations: rows.length,
  criticalIssues: countsBySeverity.critical || 0,
  errors: countsBySeverity.error || 0,
  warnings: countsBySeverity.warning || 0,
  uniqueTopThreads: Object.keys(relationshipCounts).length,
});

console.log('\nVoiceMap axis ranges across all configs:');
console.table(rangeSummary);

console.log('\nTop Voice Thread distribution:');
console.table(
  Object.entries(relationshipCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([thread, count]) => ({
      thread,
      count,
      percent: `${round((count / rows.length) * 100, 1)}%`,
    }))
);

if (issues.length > 0) {
  console.log('\nIssue counts by category:');
  console.table(
    Object.entries(countsByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }))
  );

  console.log('\nHighest severity issue samples:');
  console.table(
    issues
      .filter((issue) => issue.severity !== 'warning')
      .slice(0, 40)
      .map((issue) => ({
        severity: issue.severity,
        category: issue.category,
        message: issue.message,
        config: issue.config,
      }))
  );

  const warningSamples = issues
    .filter((issue) => issue.severity === 'warning')
    .slice(0, 20);

  if (warningSamples.length) {
    console.log('\nWarning samples:');
    console.table(
      warningSamples.map((issue) => ({
        category: issue.category,
        message: issue.message,
        config: issue.config,
      }))
    );
  }
}

const hasBlockingIssues = issues.some(
  (issue) => issue.severity === 'critical' || issue.severity === 'error'
);

if (hasBlockingIssues) {
  process.exitCode = 1;
} else {
  console.log(
    '\nAudit passed: no critical/error issues found in exhaustive Heritage configuration space.'
  );
}
