
import promotableAudit from '../reviewPlans/remaining-engine-promotable-audit-heads-wires-do-not-block.json';

const COLLECTION = 'snareReferenceDrums';

const normalizeText = value =>

  String(value || '')

    .trim()

    .toLowerCase();

const titleCase = value =>

  String(value || '')

    .replace(/[-_]+/g, ' ')

    .replace(/\s+/g, ' ')

    .trim()

    .replace(/\b\w/g, char => char.toUpperCase());

const normalizeMaterialLabel = value => {

  const raw = String(value || '').trim();

  const key = raw

    .toLowerCase()

    .replace(/[\/,_-]+/g, ' ')

    .replace(/\s+/g, ' ')

    .trim();

  const materialMap = {

    acrylic: 'Acrylic',

    aluminum: 'Aluminum',

    aluminium: 'Aluminum',

    ash: 'Ash',

    beech: 'Beech',

    birch: 'Birch',

    brass: 'Brass',

    'bell brass': 'Bell Brass',

    bronze: 'Bronze',

    bubinga: 'Bubinga',

    cherry: 'Cherry',

    copper: 'Copper',

    mahogany: 'Mahogany',

    maple: 'Maple',

    'maple poplar': 'Maple/Poplar',

    'mahogany poplar': 'Mahogany/Poplar',

    'solid maple': 'Maple',

    cordia: 'Cordia',

    oak: 'Oak',

    'phosphor bronze': 'Phosphor Bronze',

    poplar: 'Poplar',

    rosewood: 'Rosewood',

    'stainless steel': 'Stainless Steel',

    steel: 'Steel',

    walnut: 'Walnut',

    wood: 'Wood',

  };

  return materialMap[key] || titleCase(raw);

};

const normalizeConstructionLabel = value => {

  const raw = String(value || '').trim();

  const key = raw

    .toLowerCase()

    .replace(/[\/,_-]+/g, ' ')

    .replace(/\s+/g, ' ')

    .trim();

  const constructionMap = {

    cast: 'Cast',

    metal: 'Metal',

    'cast metal': 'Cast Metal',

    'cast metal shell': 'Cast Metal',

    'seamless metal shell': 'Seamless Metal',

    'beaded metal shell': 'Beaded Metal',

    ply: 'Ply',

    'ply shell': 'Ply',

    'ply with reinforcement rings': 'Ply w/ Reinforcement Rings',

    acrylic: 'Acrylic',

    hybrid: 'Hybrid',

    seamless: 'Seamless',

    segmented: 'Segmented',

    'solid shell': 'Solid Shell',

    solid: 'Solid Shell',

    stave: 'Stave',

    'steam bent': 'Steam-Bent',

    steambent: 'Steam-Bent',

    'single ply': 'Single-Ply',

  };

  return constructionMap[key] || titleCase(raw);

};

const getAuditRecords = () => [

  ...(promotableAudit.alreadyPromoted || []),

  ...(promotableAudit.additionalPromotableRecords || []),

  ...(promotableAudit.promotableRecords || []),

  ...(promotableAudit.records || []),

  ...(promotableAudit.candidates || []),

];

const unwrapRecord = doc => {

  if (doc?.data) {

    return {

      id: doc.id,

      ...doc.data(),

    };

  }

  return doc?.record || doc?.patch || doc?.data || doc || {};

};

const deriveLineSeries = record => {

  if (record.lineSeries || record.line || record.series) {

    return record.lineSeries || record.line || record.series;

  }

  const id = String(record.id || '');

  const parts = id.split('_').filter(Boolean);

  if (parts.length >= 2) {

    return titleCase(parts[1]);

  }

  const model = String(record.modelName || record.model || '');

  const firstModelChunk = model

    .replace(/\b\d+(\.\d+)?x\d+(\.\d+)?\b/gi, '')

    .replace(/\b\d+["”]?\b/g, '')

    .split(/\s+/)

    .slice(0, 3)

    .join(' ')

    .trim();

  return firstModelChunk || '';

};

const getCompany = record =>

  record.companyName ||

  record.company ||

  record.COMPANY_NAME ||

  record['COMPANY NAME'] ||

  '';

const cleanModelName = value =>

  String(value || '')

    .replace(/\b(private listing|sweetwater listing|dcp dealer listing|dealer listing|reverb listing|ebay listing|used listing)\b/gi, '')

    .replace(/\b(open box|used|new old stock|nos)\b/gi, '')

    .replace(/\b(snare drum|snare)\b/gi, '')

    .replace(/\b\d{1,2}(\.\d+)?\s*[x×]\s*\d{1,2}(\.\d+)?\b/gi, '')

    .replace(/\b\d{1,2}["”]\s*[x×]\s*\d{1,2}(\.\d+)?["”]?\b/gi, '')

    .replace(/\s+[-–—]\s+$/g, '')

    .replace(/\s{2,}/g, ' ')

    .trim();

const getModel = record =>

  cleanModelName(

    record.modelName ||

      record.model ||

      record.MODEL_NAME ||

      record['MODEL NAME'] ||

      ''

  );

const getDiameter = record =>

  record.diameter ||

  record.diameterInches ||

  record.DIAMETER ||

  record['DIAMETER'] ||

  null;

const getDepth = record =>

  record.depth ||

  record.depthInches ||

  record.DEPTH ||

  record['DEPTH'] ||

  null;

const getShellMaterial = record =>

  normalizeMaterialLabel(

    record.shellMaterial1 ||

      record.shellMaterial ||

      record.primaryShellMaterial ||

      record.SHELL_MATERIAL ||

      record['SHELL MATERIAL 1'] ||

      record['SHELL MATERIAL'] ||

      ''

  );

const getShellConstruction = record =>

  normalizeConstructionLabel(

    record.shellConstruction ||

      record.construction ||

      record.SHELL_CONSTRUCTION ||

      record['SHELL CONSTRUCTION'] ||

      ''

  );

const getSearchHaystack = record =>

  [

    record.id,

    getCompany(record),

    deriveLineSeries(record),

    getModel(record),

    record.drumType,

    getDiameter(record),

    getDepth(record),

    getShellConstruction(record),

    getShellMaterial(record),

    record.hoopType,

    record.legacyPrintReadinessTier,

    record.promotionRule,

  ]

    .filter(Boolean)

    .join(' ')

    .toLowerCase();

const buildReferenceLabel = record => {

  const company = getCompany(record) || 'Unknown Company';

  const model = getModel(record) || 'Unknown Model';

  return `${company} ${model}`.trim();

};

const buildModelOptionLabel = record => {

  const model = getModel(record) || 'Unknown Model';

  const material = getShellMaterial(record) || 'Material unknown';

  const diameter = getDiameter(record);

  const depth = getDepth(record);

  const size = diameter && depth ? `${diameter}x${depth}` : 'Size unknown';

  return `${model} • ${material} • ${size}`;

};

const buildReferenceDetail = record => {

  const diameter = getDiameter(record);

  const depth = getDepth(record);

  const size = diameter && depth ? `${diameter}x${depth}` : record.size || 'Size unknown';

  const material = getShellMaterial(record) || 'Material unknown';

  const construction = getShellConstruction(record) || 'Construction unknown';

  return `${size} · ${material} · ${construction}`;

};

const normalizeReference = input => {

  const data = unwrapRecord(input);

  const id = data.id || input?.id || input?.snareReferenceId || '';

  const companyName = getCompany(data);

  const modelName = getModel(data);

  const lineSeries = deriveLineSeries({ id, ...data });

  return {

    id,

    key: id,

    snareReferenceId: id,

    label: buildReferenceLabel(data),

    detail: buildReferenceDetail(data),

    companyName,

    company: companyName,

    modelName,

    model: modelName,

    modelOptionLabel: buildModelOptionLabel(data),

    lineSeries,

    diameter: getDiameter(data),

    depth: getDepth(data),

    shellMaterial: getShellMaterial(data),

    shellConstruction: getShellConstruction(data),

    readinessTier: data.legacyPrintReadinessTier || '',

    promotionRule: data.legacyPrintPromotionRule || data.promotionRule || '',

    sourceConfidence: data.sourceConfidence || null,

    searchHaystack: getSearchHaystack({ id, ...data, lineSeries }),

  };

};

const dedupeById = records => {

  const map = new Map();

  records.forEach(record => {

    const normalized = normalizeReference(record);

    if (!normalized.id) return;

    const existing = map.get(normalized.id);

    map.set(normalized.id, {

      ...normalized,

      ...(existing || {}),

      ...normalized,

      lineSeries: normalized.lineSeries || existing?.lineSeries || '',

      companyName: normalized.companyName || existing?.companyName || '',

      modelName: normalized.modelName || existing?.modelName || '',

    });

  });

  return Array.from(map.values());

};

export async function loadPromotableSnareReferences({

  firestore,

  query = '',

  limit = 500,

} = {}) {

  const normalizedQuery = normalizeText(query);

  const localRecords = getAuditRecords();

  let firestoreRecords = [];

  if (firestore) {

    try {

      const snapshot = await firestore

        .collection(COLLECTION)

        .where('legacyPrintEnginePromotable', '==', true)

        .limit(500)

        .get();

      firestoreRecords = snapshot.docs || [];

    } catch (error) {

      console.warn(

        '[LegacyPrint] Firestore promotable snare lookup failed; using local audit fallback.',

        error

      );

    }

  }

  const references = dedupeById([...localRecords, ...firestoreRecords])

    .filter(reference => {

      if (!normalizedQuery) return true;

      return reference.searchHaystack.includes(normalizedQuery);

    })

    .sort((a, b) => {

      const companyCompare = a.companyName.localeCompare(b.companyName);

      if (companyCompare !== 0) return companyCompare;

      const lineCompare = a.lineSeries.localeCompare(b.lineSeries);

      if (lineCompare !== 0) return lineCompare;

      return a.modelName.localeCompare(b.modelName);

    })

    .slice(0, limit);

  return {

    success: true,

    source: firestoreRecords.length ? 'firestore+localAudit' : 'localAudit',

    totalFetched: localRecords.length + firestoreRecords.length,

    firestoreFetched: firestoreRecords.length,

    localFetched: localRecords.length,

    count: references.length,

    references,

  };

}

