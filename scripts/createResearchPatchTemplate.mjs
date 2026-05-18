
import fs from 'fs';

const docsPath = process.argv[2];

if (!docsPath) {

  console.error('Usage: node scripts/createResearchPatchTemplate.mjs data/snareResearchPackets/canopus-core-batch-1-firestore-docs.json');

  process.exit(1);

}

const exported = JSON.parse(fs.readFileSync(docsPath, 'utf8'));

const patch = {

  patchName: 'canopus-core-batch-1-minimum-engine-research',

  createdAt: new Date().toISOString(),

  patchType: 'source-backed-core-shell-research',

  records: exported.docs.map((doc) => ({

    id: doc.id,

    failedCoreFields: doc.failedCoreFields,

    patch: {

      shellMaterial1: 'RESEARCH_REQUIRED',

      shellMaterial2: 'unknown',

      shellMaterial3: 'unknown',

      shellThicknessMm: 'RESEARCH_REQUIRED',

      bearingEdge: 'RESEARCH_REQUIRED',

      reinforcementRings: 'RESEARCH_REQUIRED_TRUE_OR_FALSE',

      reRingMaterial: 'unknown',

      reRingThicknessMm: null,

      snareBeds: 'RESEARCH_REQUIRED_TRUE_OR_FALSE',

      snareBedType: 'RESEARCH_REQUIRED_BUCKET',

      sourceConfidence: 'low',

      voiceScoreConfidence: 'low',

      primarySourceUrl: 'RESEARCH_REQUIRED',

      secondarySourceUrl: 'unknown',

      notesOnMissingData: 'Research required before this record can pass core shell minimum readiness.',

      researchUpdatedBy: 'canopus-core-batch-1'

    }

  }))

};

const outPath = 'data/snareResearchPatches/canopus-core-batch-1-patch-template.json';

fs.writeFileSync(outPath, JSON.stringify(patch, null, 2));

console.log(`Created ${outPath}`);

