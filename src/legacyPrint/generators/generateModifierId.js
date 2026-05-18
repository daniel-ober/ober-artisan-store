import crypto from 'crypto';

import { normalizeSlug } from './normalizeSlug';

export function generateModifierId({

  modifierType = '',

  brand = '',

  modelName = '',

  variant = ''

}) {

  const normalized = [

    modifierType,

    brand,

    modelName,

    variant

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