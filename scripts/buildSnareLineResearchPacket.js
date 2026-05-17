// scripts/buildSnareLineResearchPacket.js

const fs = require('fs');

const path = require('path');

const [companyArg, ...lineParts] = process.argv.slice(2);

const lineArg = lineParts.join(' ').trim();

if (!companyArg || !lineArg) {

  console.error('\nUsage: node scripts/buildSnareLineResearchPacket.js "Tama" "Starclassic"\n');

  process.exit(1);

}

const safeCompany = companyArg

  .toLowerCase()

  .replace(/[^a-z0-9]+/g, '-')

  .replace(/^-+|-+$/g, '');

const normalize = (value = '') =>

  String(value).trim().toLowerCase().replace(/\s+/g, ' ');

const planPath = path.resolve(

  __dirname,

  `../snareCompanyResearchPlans/${safeCompany}-company-research-plan.json`

);

const outputDir = path.resolve(__dirname, '../snareLineResearchPackets');

if (!fs.existsSync(planPath)) {

  console.error(`Missing company research plan: ${planPath}`);

  console.error(`Run: node scripts/researchSnareCompanyBatch.js "${companyArg}"`);

  process.exit(1);

}

const plan = require(planPath);

const linePlan = (plan.linePlans || []).find(

  (item) => normalize(item.lineSeries) === normalize(lineArg)

);

if (!linePlan) {

  console.error(`No line/series found for: ${companyArg} / ${lineArg}`);

  console.error('\nAvailable lines:\n');

  (plan.linePlans || []).forEach((line) => {

    console.error(`- ${line.lineSeries}`);

  });

  process.exit(1);

}

const missingFieldLabels = {

  'shell.thicknessMm': 'Shell thickness in millimeters',

  'shell.reinforcementRings': 'Whether the shell has reinforcement rings',

  'shell.bearingEdge': 'Bearing edge profile',

  'shell.snareBedType': 'Snare bed type / depth / style',

  'shell.hoopRimType': 'Factory hoop / rim type',

  'hardware.lugCount': 'Lug count',

  'hardware.lugType': 'Lug type',

  'hardware.snareThrowMakeAndModel': 'Throw-off / strainer model',

  'hardware.stockSnareWires': 'Factory snare wires',

  'hardware.stockBatterHead': 'Factory batter head',

  'hardware.stockResoHead': 'Factory resonant/snare-side head',

  'sources.primarySourceUrl': 'Best primary source URL',

};

const packet = {

  companyName: plan.companyName,

  lineSeries: linePlan.lineSeries,

  generatedAt: new Date().toISOString(),

  drumCount: linePlan.drumCount,

  totalMissingFields: linePlan.totalMissingFields,

  researchGoal:

    'Research this snare line/series as a group first. Identify shared factory specs that can be applied across multiple Firestore snareReferenceDrums documents. Do not invent unknown specs. Do not assume specs across eras unless source-backed.',

  priorityMissingFields: Object.entries(linePlan.fieldFrequency || {})

    .sort((a, b) => b[1] - a[1])

    .map(([key, count]) => ({

      key,

      label: missingFieldLabels[key] || key,

      missingInDrums: count,

    })),

  recommendedSearches: [

    `${plan.companyName} ${linePlan.lineSeries} snare drum catalog specs`,

    `${plan.companyName} ${linePlan.lineSeries} snare shell thickness bearing edge hoops throw off`,

    `${plan.companyName} ${linePlan.lineSeries} snare drum PDF catalog`,

    `${plan.companyName} ${linePlan.lineSeries} snare drum archived catalog`,

    `${plan.companyName} ${linePlan.lineSeries} snare stock heads snare wires`,

  ],

  updateRules: [

    'Shared line-level values may be applied only when source-backed.',

    'Model-specific values must stay model-specific.',

    'Older/vintage and modern versions must not be merged unless the source confirms continuity.',

    'If a value cannot be confirmed, leave it blank and add notesOnMissingData.',

    'Ober scores should not be changed during this research pass unless a physical spec correction materially changes the shell read.',

  ],

  drums: linePlan.drums.map((drum) => ({

    id: drum.id,

    companyName: drum.companyName,

    lineSeries: drum.lineSeries,

    modelName: drum.modelName,

    diameter: drum.diameter,

    depth: drum.depth,

    shellConstruction: drum.shellConstruction,

    shellMaterial1: drum.shellMaterial1,

    shellMaterial2: drum.shellMaterial2,

    shellMaterial3: drum.shellMaterial3,

    missingCount: drum.missingCount,

    missingFields: drum.missingFields,

  })),

  proposedSharedPatch: {

    shell: {},

    hardware: {},

    sources: {},

    notes: {

      researchStatus: 'pending',

      researchedBy: 'company-line-batch',

      lineResearchNotes: '',

    },

  },

};

fs.mkdirSync(outputDir, { recursive: true });

const safeLine = lineArg

  .toLowerCase()

  .replace(/[^a-z0-9]+/g, '-')

  .replace(/^-+|-+$/g, '');

const outputPath = path.join(

  outputDir,

  `${safeCompany}-${safeLine}-research-packet.json`

);

fs.writeFileSync(outputPath, `${JSON.stringify(packet, null, 2)}\n`);

console.log('\nLine research packet created');

console.log('Company:', packet.companyName);

console.log('Line:', packet.lineSeries);

console.log('Output:', outputPath);

console.log('Drums:', packet.drumCount);

console.log('Total missing fields:', packet.totalMissingFields);

console.log('\nPriority missing fields:');

packet.priorityMissingFields.forEach((field) => {

  console.log(`- ${field.key}: ${field.missingInDrums}`);

});

console.log('\nRecommended searches:');

packet.recommendedSearches.forEach((search) => {

  console.log(`- ${search}`);

});