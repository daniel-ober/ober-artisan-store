import crypto from 'crypto';

import { normalizeSlug } from './normalizeSlug';

export function generateDrumReferenceId({

  companyName = '',

  lineSeries = '',

  modelName = '',

  diameter = '',

  depth = '',

  shellConstruction = '',

  shellMaterialPrimary = ''

}) {

  const normalized = [

    companyName,

    lineSeries,

    modelName,

    `${diameter}x${depth}`,

    shellConstruction,

    shellMaterialPrimary

  ]

    .map(normalizeSlug)

    .filter(Boolean);

  const baseSlug = normalized.join('_');

  const hash = crypto

    .createHash('md5')

    .update(baseSlug)

    .digest('hex')

    .slice(0, 6);

  return `${baseSlug}_${hash}`;

}