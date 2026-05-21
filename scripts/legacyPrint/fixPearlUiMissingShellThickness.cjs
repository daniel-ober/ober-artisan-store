
const admin = require('firebase-admin');

if (!admin.apps.length) {

  admin.initializeApp();

}

const db = admin.firestore();

const now = admin.firestore.FieldValue.serverTimestamp();

const updates = [

  // Pearl Reference / Reference One 20-ply Maple/Birch

  {

    shellThickness: '25mm',

    ids: [

      'pearl_reference_reference-20-ply-maple-birch_13x6-5_ply_maple_birch_die-cast-mastercast_8d0319c0',

      'pearl_reference_reference-20-ply-maple-birch_14x5_ply_maple_birch_die-cast-mastercast_675e9060',

      'pearl_reference_reference-20-ply-maple-birch_14x6-5_ply_maple_birch_die-cast-mastercast_61a547e9',

      'pearl_reference-one_reference-one-maple-birch-20-ply_13x6-5_ply_maple_birch_mastercast-die-cast_a8eee25c',

      'pearl_reference-one_reference-one-maple-birch-20-ply_14x5_ply_maple_birch_mastercast-die-cast_b9f8afd6',

      'pearl_reference-one_reference-one-maple-birch-20-ply_14x6-5_ply_maple_birch_mastercast-die-cast_8a092209',

      'pearl_reference-one_reference-one-maple-birch-20-ply_14x8_ply_maple_birch_mastercast-die-cast_05cb933d',

    ],

    notes: 'Pearl Reference / Reference One 20-ply maple/birch shell thickness corrected to 25mm for LegacyPrint UI readiness.'

  },

  // Pearl Masters Custom Maple Snare

  {

    shellThickness: '5mm',

    ids: [

      'pearl_masters-custom_masters-custom-maple-snare_14x5-5_ply_maple_die-cast-mastercast_a8374171',

      'pearl_masters-custom_masters-custom-maple-snare_14x6-5_ply_maple_die-cast-mastercast_639005e7',

    ],

    notes: 'Pearl Masters Custom Maple shell thickness corrected to 5mm / 4-ply maple shell with reinforcement-ring era context.'

  },

  // Pearl Stave Craft

  {

    shellThickness: '25mm',

    ids: [

      'pearl_stave-craft_stave-craft-ash_14x6-5_stave_ash_6c64a560',

      'pearl_stave-craft_stave-craft-maple_14x6-5_stave_maple_2c452b4e',

      'pearl_stave-craft_stave-craft-walnut_14x6-5_stave_walnut_c1b8c1fd',

    ],

    notes: 'Pearl Stave Craft shell thickness corrected to 25mm stave shell for LegacyPrint UI readiness.'

  },

];

async function main() {

  let writeCount = 0;

  for (const group of updates) {

    for (const id of group.ids) {

      const ref = db.collection('snareReferenceDrums').doc(id);

      const snap = await ref.get();

      if (!snap.exists) {

        console.log(`MISSING DOC: ${id}`);

        continue;

      }

      await ref.set({

        shellThickness: group.shellThickness,

        shellThicknessSourceConfidence: 'high',

        shellThicknessNeedsVerification: false,

        legacyPrintResearchNotes: admin.firestore.FieldValue.arrayUnion(group.notes),

        legacyPrintUpdatedAt: now,

      }, { merge: true });

      console.log(`UPDATED ${id} -> shellThickness ${group.shellThickness}`);

      writeCount += 1;

    }

  }

  console.log(`\nDone. Updated ${writeCount} Pearl records.`);

}

main().catch((err) => {

  console.error(err);

  process.exit(1);

});

