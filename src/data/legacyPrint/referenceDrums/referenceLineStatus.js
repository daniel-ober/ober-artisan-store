// src/data/legacyPrint/referenceDrums/referenceLineStatus.js

export const REFERENCE_LINE_STATUS = {

  CURRENT: 'current',

  DISCONTINUED: 'discontinued',

  VINTAGE: 'vintage',

  RARE: 'rare',

  COLLECTOR: 'collector',

  SIGNATURE: 'signature',

  LIMITED: 'limited',

  HISTORIC: 'historic',

  UNKNOWN: 'unknown',

};

export const REFERENCE_LINE_ACCESS = {

  FREE: 'free',

  UPGRADE: 'upgrade',

  ADMIN: 'admin',

};

export const REFERENCE_LINE_BUCKET_LABELS = {

  current: 'Current / Core References',

  discontinued: 'Discontinued References',

  vintage: 'Vintage References',

  rare: 'Rare / Hard-to-Find References',

  collector: 'Collector References',

  signature: 'Signature References',

  limited: 'Limited / Special Edition References',

  historic: 'Historic Catalog References',

  unknown: 'Unsorted References',

};

export const REFERENCE_LINE_STATUS_ORDER = [

  REFERENCE_LINE_STATUS.CURRENT,

  REFERENCE_LINE_STATUS.DISCONTINUED,

  REFERENCE_LINE_STATUS.VINTAGE,

  REFERENCE_LINE_STATUS.RARE,

  REFERENCE_LINE_STATUS.COLLECTOR,

  REFERENCE_LINE_STATUS.SIGNATURE,

  REFERENCE_LINE_STATUS.LIMITED,

  REFERENCE_LINE_STATUS.HISTORIC,

  REFERENCE_LINE_STATUS.UNKNOWN,

];