import crypto from 'crypto';

import { normalizeSlug } from './normalizeSlug';

export function generateSourceId({

  publisher = '',

  url = ''

}) {

  const publisherSlug = normalizeSlug(publisher);

  const hash = crypto

    .createHash('md5')

    .update(url)

    .digest('hex')

    .slice(0, 6);

  return `src_${publisherSlug}_${hash}`;

}