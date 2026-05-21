
import promotableAudit from '../reviewPlans/remaining-engine-promotable-audit-heads-wires-do-not-block.json';

const COLLECTION = 'snareReferenceDrums';

const normalizeText = value =>

  String(value || '')

    .trim()

    .toLowerCase();

const getSearchHaystack = record =>

  [

    record.id,

    record.companyName,

    record.company,

    record.lineSeries,

    record.modelName,

    record.model,

    record.drumType,

    record.diameter,

    record.depth,

    record.shellConstruction,

    record.shellMaterial1,

    record.shellMaterial,

    record.hoopType,

    record.legacyPrintReadinessTier,

  ]

    .filter(Boolean)

    .join(' ')

    .toLowerCase();

const buildReferenceLabel = record => {

  const company = record.companyName || record.company || 'Unknown Company';

  const model = record.modelName || record.model || 'Unknown Model';

  return `${company} ${model}`.trim();

};

const buildReferenceDetail = record => {

  const diameter = record.diameter || record.diameterInches || null;

  const depth = record.depth || record.depthInches || null;

  const size = diameter && depth ? `${diameter}x${depth}` : record.size || 'Size unknown';

  const material =

    record.shellMaterial1 ||

    record.shellMaterial ||

    record.primaryShellMaterial ||

    'Material unknown';

  const construction =

    record.shellConstruction ||

    record.construction ||

    'Construction unknown';

  return `${size} · ${material} · ${construction}`;

};

const normalizeReference = doc => {

  const data = doc.data ? doc.data() : doc;

  return {

    id: doc.id || data.id,

    key: doc.id || data.id,

    snareReferenceId: doc.id || data.id,

    label: buildReferenceLabel(data),

    detail: buildReferenceDetail(data),

    companyName: data.companyName || data.company || '',

    modelName: data.modelName || data.model || '',

    lineSeries: data.lineSeries || '',

    diameter: data.diameter || data.diameterInches || null,

    depth: data.depth || data.depthInches || null,

    shellMaterial:

      data.shellMaterial1 ||

      data.shellMaterial ||

      data.primaryShellMaterial ||

      '',

    shellConstruction: data.shellConstruction || data.construction || '',

    readinessTier: data.legacyPrintReadinessTier || '',

    promotionRule: data.legacyPrintPromotionRule || '',

    sourceConfidence: data.sourceConfidence || null,

    searchHaystack: getSearchHaystack({

      id: doc.id || data.id,

      ...data,

    }),

  };

};

export async function loadPromotableSnareReferences({

  firestore,

  query = '',

  limit = 80,

} = {}) {

  const normalizedQuery = normalizeText(query);

  let source = 'localAudit';

  let rawReferences =

    promotableAudit.promotableRecords ||

    promotableAudit.records ||

    promotableAudit.candidates ||

    [];

  if (firestore) {

    try {

      const snapshot = await firestore

        .collection(COLLECTION)

        .where('legacyPrintEnginePromotable', '==', true)

        .limit(500)

        .get();

      if (!snapshot.empty) {

        source = 'firestore';

        rawReferences = snapshot.docs;

      }

    } catch (error) {

      console.warn('[LegacyPrint] Firestore promotable snare lookup failed; using local audit fallback.', error);

    }

  }

  const references = rawReferences

    .map(normalizeReference)

    .filter(reference => {

      if (!normalizedQuery) return true;

      return reference.searchHaystack.includes(normalizedQuery);

    })

    .sort((a, b) => {

      const companyCompare = a.companyName.localeCompare(b.companyName);

      if (companyCompare !== 0) return companyCompare;

      return a.modelName.localeCompare(b.modelName);

    })

    .slice(0, limit);

  return {

    success: true,

    source,

    totalFetched: rawReferences.length,

    count: references.length,

    references,

  };

}

