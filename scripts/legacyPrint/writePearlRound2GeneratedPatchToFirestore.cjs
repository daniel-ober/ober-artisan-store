
const admin = require('firebase-admin');

const records = require('../../src/legacyPrint/data/snareReferenceDrums.generated.json');

const APPROVAL = 'WRITE_PEARL_ROUND_2_GENERATED_PATCH_TO_FIRESTORE';

const shouldWrite = process.env.LEGACYPRINT_APPROVE_FIRESTORE_WRITE === APPROVAL;

const targetIds = [

  'pearl_reference-one_reference-one-maple-birch-20-ply_13x6-5_ply_maple_birch_mastercast-die-cast_a8eee25c',

  'pearl_reference-one_reference-one-maple-birch-20-ply_14x5_ply_maple_birch_mastercast-die-cast_b9f8afd6',

  'pearl_reference-one_reference-one-maple-birch-20-ply_14x6-5_ply_maple_birch_mastercast-die-cast_8a092209',

  'pearl_reference-one_reference-one-maple-birch-20-ply_14x8_ply_maple_birch_mastercast-die-cast_05cb933d',

  'pearl_masters-custom_masters-custom-maple-snare_14x5-5_ply_maple_die-cast-mastercast_a8374171',

  'pearl_masters-custom_masters-custom-maple-snare_14x6-5_ply_maple_die-cast-mastercast_639005e7',

  'pearl_stave-craft_stave-craft-ash_14x6-5_stave_ash_6c64a560',

  'pearl_stave-craft_stave-craft-maple_14x6-5_stave_maple_2c452b4e',

  'pearl_stave-craft_stave-craft-walnut_14x6-5_stave_walnut_c1b8c1fd'

];

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const now = admin.firestore.FieldValue.serverTimestamp();

const byId = new Map(records.map(record => [record.id, record]));

function clean(value) {

  return value === undefined ? null : value;

}

async function main() {

  let checked = 0;

  let written = 0;

  let skipped = 0;

  console.log(JSON.stringify({

    mode: shouldWrite ? 'write' : 'dry-run',

    approvalRequired: APPROVAL,

    targetCount: targetIds.length

  }, null, 2));

  for (const id of targetIds) {

    checked += 1;

    const record = byId.get(id);

    if (!record) {

      skipped += 1;

      console.warn(`SKIP generated record missing: ${id}`);

      continue;

    }

    const shellThicknessMm =

      record.shellThicknessMm ??

      record.shell?.construction?.shellThicknessMm ??

      null;

    const shellThickness =

      record.shellThickness ??

      (shellThicknessMm ? `${shellThicknessMm}mm` : null);

    const bearingEdge =

      record.bearingEdge ??

      record.shell?.bearingEdges?.batterSideProfile ??

      null;

    if (!shellThicknessMm || !bearingEdge || String(bearingEdge).toLowerCase().includes('unknown')) {

      skipped += 1;

      console.warn(`SKIP incomplete generated patch: ${id}`);

      console.warn({ shellThickness, shellThicknessMm, bearingEdge });

      continue;

    }

    const update = {

      shellThickness: clean(shellThickness),

      shellThicknessMm: clean(shellThicknessMm),

      bearingEdge: clean(bearingEdge),

      'shell.construction.shellThicknessMm': clean(shellThicknessMm),

      'shell.construction.thicknessClass': clean(record.shell?.construction?.thicknessClass || 'sourceConfirmed'),

      'shell.bearingEdges.batterSideProfile': clean(record.shell?.bearingEdges?.batterSideProfile || bearingEdge),

      'shell.bearingEdges.snareSideProfile': clean(record.shell?.bearingEdges?.snareSideProfile || bearingEdge),

      'shell.bearingEdges.evidenceLevel': 'sourceBacked',

      'shell.bearingEdges.confidence': clean(record.shell?.bearingEdges?.confidence || 'high'),

      'shell.bearingEdges.notes': clean(record.shell?.bearingEdges?.notes || bearingEdge),

      sourceConfidence: clean(record.sourceConfidence || 'high'),

      fieldQualityTier: clean(record.fieldQualityTier || 'meaningfulCoreShellPass'),

      legacyPrintEnginePromotable: true,

      legacyPrintEngineReadinessTier: 'PROMOTE_NOW_FULL_REFERENCE_READY',

      legacyPrintEnginePromotionStatus: 'promoted',

      legacyPrintEnginePromotionRule: 'pearlRound2SourceBackedShellFields',

      legacyPrintLastResearchSession: 'pearl-wood-shell-research-round-2',

      legacyPrintLastResearchUpdatedAt: now

    };

    console.log('\n----------------------------------------');

    console.log(id);

    console.log(JSON.stringify({

      companyName: record.companyName,

      lineSeries: record.lineSeries,

      modelName: record.modelName,

      shellThickness,

      shellThicknessMm,

      bearingEdge

    }, null, 2));

    if (shouldWrite) {

      await db.collection('snareReferenceDrums').doc(id).update(update);

      written += 1;

      console.log('WRITE complete');

    } else {

      console.log('DRY RUN no write');

    }

  }

  console.log('\n========================================');

  console.log(JSON.stringify({

    status: shouldWrite

      ? 'PEARL_ROUND_2_FIRESTORE_WRITE_COMPLETE'

      : 'PEARL_ROUND_2_FIRESTORE_DRY_RUN_NO_WRITES',

    checked,

    written,

    skipped

  }, null, 2));

}

main().catch(error => {

  console.error(error);

  process.exit(1);

});

