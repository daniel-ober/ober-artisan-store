
import promotableAudit from '../reviewPlans/remaining-engine-promotable-audit-heads-wires-do-not-block.json';

import generatedSnareReferences from '../data/snareReferenceDrums.generated.json';

const COLLECTION = 'snareReferenceDrums';

const normalizeText = value =>

  String(value || '')

    .trim()

    .toLowerCase();

const cleanText = value =>

  String(value || '')

    .replace(/\s+/g, ' ')

    .trim();

const cleanModelName = value =>

  cleanText(value)

    .replace(/\b(private listing|sweetwater listing|dcp dealer listing|dealer listing|reverb listing|ebay listing|used listing)\b/gi, '')

    .replace(/\b(open box|used|new old stock|nos)\b/gi, '')

    .replace(/\b(snare drum|snare)\b/gi, '')

    .replace(/\b\d{1,2}(\.\d+)?\s*[x×]\s*\d{1,2}(\.\d+)?\b/gi, '')

    .replace(/\b\d{1,2}["”]\s*[x×]\s*\d{1,2}(\.\d+)?["”]?\b/gi, '')

    .replace(/\s+[-–—]\s+$/g, '')

    .replace(/\s{2,}/g, ' ')

    .trim();

const toNumber = value => {

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const match = String(value || '').match(/-?\d+(\.\d+)?/);

  if (!match) return null;

  const parsed = Number(match[0]);

  return Number.isFinite(parsed) ? parsed : null;

};

const firstValue = (record, keys) => {

  for (const key of keys) {

    const value = record?.[key];

    if (value !== undefined && value !== null && String(value).trim() !== '') {

      return value;

    }

  }

  return '';

};

const getCompany = record =>

  cleanText(

    firstValue(record, [

      'companyName',

      'company',

      'brand',

      'COMPANY_NAME',

      'COMPANY NAME',

    ])

  );

const getModel = record =>

  cleanModelName(

    firstValue(record, [

      'modelName',

      'model',

      'MODEL_NAME',

      'MODEL NAME',

    ])

  );

const getLineSeries = record =>

  cleanText(

    firstValue(record, [

      'lineSeries',

      'line',

      'series',

      'LINE_SERIES',

      'LINE/SERIES',

    ])

  );

const getDiameter = record =>

  toNumber(

    firstValue(record, [

      'diameter',

      'diameterInches',

      'DIAMETER',

      'DIAMETER_INCHES',

    ])

  );

const getDepth = record =>

  toNumber(

    firstValue(record, [

      'depth',

      'depthInches',

      'DEPTH',

      'DEPTH_INCHES',

    ])

  );

const getShellMaterial = record =>

  cleanText(

    firstValue(record, [

      'shellMaterial1',

      'shellMaterial',

      'primaryShellMaterial',

      'material',

      'SHELL_MATERIAL_1',

      'SHELL MATERIAL 1',

      'SHELL MATERIAL',

    ])

  );

const getShellConstruction = record =>

  cleanText(

    firstValue(record, [

      'shellConstruction',

      'construction',

      'SHELL_CONSTRUCTION',

      'SHELL CONSTRUCTION',

    ])

  );

const getShellThickness = record =>

  toNumber(

    firstValue(record, [

      'shellThicknessMm',

      'shellThicknessMM',

      'shellThickness',

      'thicknessMm',

      'thickness',

      'SHELL_THICKNESS_MM',

      'SHELL THICKNESS (mm)',

      'SHELL THICKNESS',

    ])

  );

const getBearingEdge = record =>

  cleanText(

    firstValue(record, [

      'bearingEdge',

      'bearingEdgeType',

      'bearingEdgeProfile',

      'bearingEdgeDetail',

      'bearingEdgeDescription',

      'BEARING_EDGE',

      'BEARING EDGE',

    ])

  );

const getHoopType = record =>

  cleanText(

    firstValue(record, [

      'hoopType',

      'hoops',

      'rimType',

      'HOOP_TYPE',

      'HOOP/RIM TYPE',

    ])

  );

const hasMeaningfulBearingEdge = record => {

  const text = normalizeText(getBearingEdge(record));

  if (!text) return false;

  return !(

    text.includes('unknown') ||

    text.includes('not specified') ||

    text.includes('not-spec') ||

    text.includes('not verified') ||

    text.includes('notverified') ||

    text.includes('needs verification') ||

    text.includes('placeholder') ||
    text.includes('missing') ||

    text.includes('missing') ||

    text === 'n/a' ||

    text === 'na'

  );

};

const hasApprovedBearingEdgeFallback = record =>

  record?.engineAssumptions?.bearingEdgeFallbackApplied === true ||

  record?.bearingEdgeFallbackApplied === true ||

  Boolean(record?.engineAssumptions?.bearingEdgeFallbackKey) ||

  Boolean(record?.bearingEdgeFallbackKey);

const isShellUsableReference = record => {

  const hasCoreFields = Boolean(

    getCompany(record) &&

      getModel(record) &&

      getDiameter(record) &&

      getDepth(record) &&

      getShellMaterial(record) &&

      getShellConstruction(record)

  );

  if (!hasCoreFields) return false;

  const hasThickness = Boolean(getShellThickness(record));

  const hasEdge = hasMeaningfulBearingEdge(record) || hasApprovedBearingEdgeFallback(record);

  return Boolean(hasThickness && hasEdge);

};

const normalizeBrandValue = value => {

  const text = cleanText(value);

  const lower = text.toLowerCase();

  if (lower === 'dw' || lower === 'pdp' || lower === 'dw / pdp' || lower === 'dw/pdp') {

    return 'DW / PDP';

  }

  return text;

};

const getAuditRecords = () => {

  if (Array.isArray(promotableAudit)) return promotableAudit;

  if (Array.isArray(promotableAudit?.records)) return promotableAudit.records;

  if (Array.isArray(promotableAudit?.promotableRecords)) return promotableAudit.promotableRecords;

  if (Array.isArray(promotableAudit?.items)) return promotableAudit.items;

  return [];

};

const normalizeReference = record => {

  const diameter = getDiameter(record);

  const depth = getDepth(record);

  const companyName = normalizeBrandValue(getCompany(record));

  const modelName = getModel(record);

  const lineSeries = getLineSeries(record);

  const shellMaterial = getShellMaterial(record);

  const shellConstruction = getShellConstruction(record);

  const shellThicknessMm = getShellThickness(record);

  const bearingEdge = getBearingEdge(record);

  const hoopType = getHoopType(record);

  return {

    ...record,

    id: record.id || record.docId || record.referenceId,

    referenceId: record.id || record.docId || record.referenceId,

    companyName,

    company: companyName,

    brand: companyName,

    modelName,

    model: modelName,

    lineSeries,

    diameter,

    diameterInches: diameter,

    depth,

    depthInches: depth,

    shellMaterial,

    shellMaterial1: shellMaterial,

    shellConstruction,

    shellThicknessMm,

    bearingEdge,

    hoopType,

    label: [companyName, lineSeries, modelName, diameter && depth ? `${diameter}x${depth}` : '']

      .filter(Boolean)

      .join(' · '),

    raw: record,

  };

};

const getSearchHaystack = record =>

  [

    record.id,

    record.referenceId,

    record.companyName,

    record.company,

    record.brand,

    record.lineSeries,

    record.modelName,

    record.model,

    record.drumType,

    record.diameter,

    record.depth,

    record.shellMaterial,

    record.shellMaterial1,

    record.shellConstruction,

    record.shellThicknessMm,

    record.bearingEdge,

    record.hoopType,

    record.legacyPrintReadinessTier,

    record.promotionRule,

  ]

    .filter(Boolean)

    .join(' ')

    .toLowerCase();

const dedupeById = records => {

  const seen = new Set();

  const out = [];

  records.forEach(record => {

    const key = record.referenceId || record.id || `${record.companyName}-${record.modelName}-${record.diameter}-${record.depth}`;

    if (!key || seen.has(key)) return;

    seen.add(key);

    out.push(record);

  });

  return out;

};

const sortReferences = (a, b) => {

  const companyCompare = String(a.companyName || '').localeCompare(String(b.companyName || ''));

  if (companyCompare !== 0) return companyCompare;

  const lineCompare = String(a.lineSeries || '').localeCompare(String(b.lineSeries || ''));

  if (lineCompare !== 0) return lineCompare;

  return String(a.modelName || '').localeCompare(String(b.modelName || ''));

};

const fetchFirestoreRecords = async ({ firestore, limit }) => {

  if (!firestore) return [];

  try {

    const snapshot = await firestore

      .collection(COLLECTION)

      .limit(limit)

      .get();

    return snapshot.docs.map(doc => ({

      id: doc.id,

      ...doc.data(),

    }));

  } catch (error) {

    console.warn('[LegacyPrint] Firestore snare reference lookup failed; using local generated reference index.', error);

    return [];

  }

};

export async function loadPromotableSnareReferences({

  firestore,

  query = '',

  limit = 2000,

} = {}) {

  const firestoreRecords = await fetchFirestoreRecords({ firestore, limit });

  const rawLocalRecords = [

    ...generatedSnareReferences,

    ...getAuditRecords(),

  ];

  const rawRecords = firestoreRecords.length

    ? [...rawLocalRecords, ...firestoreRecords]

    : rawLocalRecords;

  const normalizedShellUsable = rawRecords

    .filter(isShellUsableReference)

    .map(normalizeReference);

  const search = normalizeText(query);

  const references = dedupeById(normalizedShellUsable)

    .filter(reference => {

      if (!search) return true;

      return getSearchHaystack(reference).includes(search);

    })

    .sort(sortReferences);

  return {

    success: true,

    source: firestoreRecords.length ? 'firestore+generatedShellUsableIndex' : 'generatedShellUsableIndex',

    count: references.length,

    totalFetched: rawRecords.length,

    firestoreFetched: firestoreRecords.length,

    localFetched: rawLocalRecords.length,

    shellUsableCount: normalizedShellUsable.length,

    references,

  };

}

export default loadPromotableSnareReferences;

