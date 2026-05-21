
const normalize = value =>

  String(value || '')

    .toLowerCase()

    .replace(/[™®©]/g, '')

    .replace(/[^a-z0-9]+/g, ' ')

    .trim();

const tokenizeModel = model =>

  normalize(model)

    .split(/\s+/)

    .filter(Boolean)

    .filter(token => ![

      'snare',

      'drum',

      'series',

      'dealer',

      'listing',

      'dcp',

      '14x5',

      '14x5x14',

      '14x55',

      '14x6',

      '14x65',

      '14x8',

      '5x14',

      '55x14',

      '65x14',

      '8x14'

    ].includes(token));

const getPrimaryMaterial = drum =>

  drum?.families?.shellMaterial || 'unknownMaterial';

const getConstruction = drum =>

  drum?.families?.shellConstruction || 'unknownConstruction';

const getCompany = drum =>

  normalize(drum?.company);

const getModelTokens = drum =>

  tokenizeModel(drum?.model);

const getModelSimilarity = (aDrum, bDrum) => {

  const a = new Set(getModelTokens(aDrum));

  const b = new Set(getModelTokens(bDrum));

  if (!a.size || !b.size) return 0;

  const overlap = [...a].filter(token => b.has(token)).length;

  const union = new Set([...a, ...b]).size;

  return union ? overlap / union : 0;

};

const isSameCompany = (targetDrum, matchDrum) =>

  getCompany(targetDrum) && getCompany(targetDrum) === getCompany(matchDrum);

const isSameMaterial = (targetDrum, matchDrum) =>

  getPrimaryMaterial(targetDrum) === getPrimaryMaterial(matchDrum);

const isSameConstruction = (targetDrum, matchDrum) =>

  getConstruction(targetDrum) === getConstruction(matchDrum);

const isSameFamily = (targetDrum, matchDrum) => {

  if (!isSameCompany(targetDrum, matchDrum)) return false;

  const modelSimilarity = getModelSimilarity(targetDrum, matchDrum);

  return modelSimilarity >= 0.28;

};

const isNearDuplicate = (targetDrum, match) => {

  const modelSimilarity = getModelSimilarity(targetDrum, match.drum);

  const similarity = match.similarity?.similarity || 0;

  return (

    isSameCompany(targetDrum, match.drum) &&

    modelSimilarity >= 0.45 &&

    similarity >= 0.94

  );

};

const uniqueByDrumId = matches => {

  const seen = new Set();

  const out = [];

  for (const match of matches) {

    const key = match.drum?.id || `${match.drum?.company}-${match.drum?.model}-${match.drum?.size}`;

    if (seen.has(key)) continue;

    seen.add(key);

    out.push(match);

  }

  return out;

};

const limitGroup = (matches, limit) =>

  uniqueByDrumId(matches).slice(0, limit);

const groupSimilarSnareVoiceMatches = (similarVoiceResult, options = {}) => {

  const {

    nearDuplicateLimit = 4,

    sameFamilyLimit = 6,

    sameMaterialLimit = 8,

    differentBrandLimit = 8,

    broadAlternativesLimit = 8

  } = options;

  const targetDrum = similarVoiceResult?.target?.drum;

  const matches = similarVoiceResult?.matches || [];

  const nearDuplicates = [];

  const sameFamily = [];

  const sameMaterialAlternatives = [];

  const differentBrandAlternatives = [];

  const broadAlternatives = [];

  for (const match of matches) {

    if (isNearDuplicate(targetDrum, match)) {

      nearDuplicates.push({

        ...match,

        matchGroup: 'nearDuplicate',

        groupReason:

          'Very close voice match from the same brand/model family.'

      });

      continue;

    }

    if (isSameFamily(targetDrum, match.drum)) {

      sameFamily.push({

        ...match,

        matchGroup: 'sameFamily',

        groupReason:

          'Related model or family voice from the same brand.'

      });

      continue;

    }

    if (isSameMaterial(targetDrum, match.drum)) {

      sameMaterialAlternatives.push({

        ...match,

        matchGroup: 'sameMaterialAlternative',

        groupReason:

          'Similar voice behavior using the same primary shell material family.'

      });

      continue;

    }

    if (!isSameCompany(targetDrum, match.drum)) {

      differentBrandAlternatives.push({

        ...match,

        matchGroup: 'differentBrandAlternative',

        groupReason:

          'Similar voice behavior from a different brand.'

      });

      continue;

    }

    broadAlternatives.push({

      ...match,

      matchGroup: 'broadAlternative',

      groupReason:

        'Similar overall voice behavior outside the closest family/material buckets.'

    });

  }

  return {

    target: similarVoiceResult.target,

    mode: similarVoiceResult.mode,

    groupedAt: new Date().toISOString(),

    groups: {

      nearDuplicates: limitGroup(nearDuplicates, nearDuplicateLimit),

      sameFamily: limitGroup(sameFamily, sameFamilyLimit),

      sameMaterialAlternatives: limitGroup(sameMaterialAlternatives, sameMaterialLimit),

      differentBrandAlternatives: limitGroup(differentBrandAlternatives, differentBrandLimit),

      broadAlternatives: limitGroup(broadAlternatives, broadAlternativesLimit)

    },

    counts: {

      nearDuplicates: nearDuplicates.length,

      sameFamily: sameFamily.length,

      sameMaterialAlternatives: sameMaterialAlternatives.length,

      differentBrandAlternatives: differentBrandAlternatives.length,

      broadAlternatives: broadAlternatives.length,

      totalMatches: matches.length

    }

  };

};

module.exports = {

  groupSimilarSnareVoiceMatches,

  getModelSimilarity,

  isSameFamily,

  isNearDuplicate,

  isSameMaterial,

  isSameConstruction

};

