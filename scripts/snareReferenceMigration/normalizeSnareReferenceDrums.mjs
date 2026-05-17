import admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

const COLLECTION = 'snareReferenceDrums';

const PREVIEW_LIMIT = 5;

const SHOULD_WRITE = process.argv.includes('--write');

const unknown = 'unknown';

const get = (obj, path, fallback = unknown) => {

  const value = path.split('.').reduce((acc, key) => {

    if (acc === undefined || acc === null) return undefined;

    return acc[key];

  }, obj);

  return value === undefined || value === null || value === '' ? fallback : value;

};

const normalizeBoolean = (value, fallback = unknown) => {

  if (value === true || value === false) return value;

  if (value === 'true') return true;

  if (value === 'false') return false;

  return fallback;

};

const normalizeSnare = (docId, drum = {}) => {

  const diameter = get(drum, 'shell.dimensions.diameterInches', drum.diameter ?? unknown);

  const depth = get(drum, 'shell.dimensions.depthInches', drum.depth ?? unknown);

  return {

    companyName: drum.companyName ?? unknown,

    companyType: drum.companyType ?? unknown,

    lineSeries: drum.lineSeries ?? unknown,

    modelName: drum.modelName ?? unknown,

    patchName: drum.patchName ?? docId,

    identification: {

      modelNumber: get(drum, 'identification.modelNumber', get(drum, 'production.modelNum')),

      badgeStyle: get(drum, 'identification.badgeStyle'),

      productionStatus: get(drum, 'identification.productionStatus'),

      currentlyInProduction: normalizeBoolean(

        get(drum, 'identification.currentlyInProduction', get(drum, 'production.currentlyInProduction'))

      ),

      artistSignature: normalizeBoolean(

        get(drum, 'identification.artistSignature', get(drum, 'production.artistSignatureLine'))

      ),

      rareCollectible: normalizeBoolean(

        get(drum, 'identification.rareCollectible', get(drum, 'production.rareCollectible'))

      ),

    },

    shell: {

      drumType: get(drum, 'shell.drumType', drum.drumType ?? 'snare'),

      dimensions: {

        diameterInches: diameter,

        depthInches: depth,

        metricDimensionsMm:

          Number.isFinite(Number(diameter)) && Number.isFinite(Number(depth))

            ? `${(Number(diameter) * 25.4).toFixed(1)} x ${(Number(depth) * 25.4).toFixed(1)}`

            : unknown,

      },

      construction: {

        shellConstruction: get(drum, 'shell.construction.shellConstruction', get(drum, 'shell.shellConstruction')),

        shellMaterialPrimary: get(drum, 'shell.construction.shellMaterialPrimary', get(drum, 'shell.material1')),

        shellMaterialSecondary: get(drum, 'shell.construction.shellMaterialSecondary', get(drum, 'shell.material2', 'none')),

        shellMaterialTertiary: get(drum, 'shell.construction.shellMaterialTertiary', get(drum, 'shell.material3', 'none')),

        plyCount: get(drum, 'shell.construction.plyCount', null),

        layupDescription: get(drum, 'shell.construction.layupDescription'),

        shellThicknessMm: get(drum, 'shell.construction.shellThicknessMm', get(drum, 'shell.thicknessMm', null)),

        thicknessClass: get(drum, 'shell.construction.thicknessClass'),

        reinforcementRings: get(drum, 'shell.construction.reinforcementRings'),

        reinforcementRingMaterial: get(drum, 'shell.construction.reinforcementRingMaterial'),

        reinforcementRingThicknessMm: get(drum, 'shell.construction.reinforcementRingThicknessMm', null),

      },

      bearingEdges: {

        batterSideProfile: get(drum, 'shell.bearingEdges.batterSideProfile'),

        snareSideProfile: get(drum, 'shell.bearingEdges.snareSideProfile'),

        roundover: get(drum, 'shell.bearingEdges.roundover'),

        evidenceLevel: get(drum, 'shell.bearingEdges.evidenceLevel'),

        confidence: get(drum, 'shell.bearingEdges.confidence'),

        notes: get(drum, 'shell.bearingEdges.notes'),

      },

      snareBeds: {

        present: get(drum, 'shell.snareBeds.present'),

        depthBucket: get(drum, 'shell.snareBeds.depthBucket'),

        widthBucket: get(drum, 'shell.snareBeds.widthBucket'),

        bedStyle: get(drum, 'shell.snareBeds.bedStyle'),

        evidenceLevel: get(drum, 'shell.snareBeds.evidenceLevel'),

        confidence: get(drum, 'shell.snareBeds.confidence'),

        notes: get(drum, 'shell.snareBeds.notes'),

      },

      finish: {

        finishName: get(drum, 'shell.finish.finishName'),

        finishType: get(drum, 'shell.finish.finishType', get(drum, 'shell.finishType')),

        exteriorTreatment: get(drum, 'shell.finish.exteriorTreatment'),

        interiorTreatment: get(drum, 'shell.finish.interiorTreatment'),

        acousticImpact: get(drum, 'shell.finish.acousticImpact', 'engineCalculated'),

        notes: get(drum, 'shell.finish.notes'),

      },

    },

    stockHardware: drum.stockHardware ?? {},

    stockSnareSystem: drum.stockSnareSystem ?? {},

    pricing: drum.pricing ?? {},

    collectorMetadata: drum.collectorMetadata ?? {},

    snareFacts: Array.isArray(drum.snareFacts) ? drum.snareFacts : [],

    sources: drum.sources ?? {},

    summary: drum.summary ?? {},

  };

};

async function main() {

  const snapshot = await db.collection(COLLECTION).limit(PREVIEW_LIMIT).get();

  if (snapshot.empty) {

    console.log('No docs found.');

    return;

  }

  if (!SHOULD_WRITE) {

    console.log(`Previewing normalized schema for ${PREVIEW_LIMIT} snareReferenceDrums docs...`);

    console.log('No writes will be performed.');

    snapshot.docs.forEach((doc, index) => {

      console.log('\n========================================');

      console.log(`Preview ${index + 1}: ${doc.id}`);

      console.log('========================================');

      console.dir(normalizeSnare(doc.id, doc.data()), { depth: null });

    });

    console.log('\nPreview complete. No writes performed.');

    console.log('\nTo actually write later, run:');

    console.log('node scripts/snareReferenceMigration/normalizeSnareReferenceDrums.mjs --write');

    return;

  }

  console.log(`Writing normalized schema for ${snapshot.docs.length} docs...`);

  const batch = db.batch();

  snapshot.docs.forEach((doc) => {

    batch.set(doc.ref, normalizeSnare(doc.id, doc.data()), { merge: false });

  });

  await batch.commit();

  console.log(`Write complete. Updated ${snapshot.docs.length} docs.`);

}
main().catch((error) => {

  console.error('Migration preview failed:', error);

  process.exit(1);

});