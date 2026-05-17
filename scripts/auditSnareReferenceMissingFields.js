/* eslint-disable no-console */

const admin = require('firebase-admin');

const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({

  credential: admin.credential.cert(serviceAccount),

  projectId: serviceAccount.project_id,

});

const db = admin.firestore();

const COLLECTION = 'snareReferenceDrums';

const IMPORTANT_FIELD_CHECKS = [

  {

    key: 'shell.construction',

    label: 'Shell Construction',

    getValue: (drum) => drum.shell?.construction,

  },

  {

    key: 'shell.material1',

    label: 'Shell Material 1',

    getValue: (drum) => drum.shell?.material1,

  },

  {

    key: 'shell.thicknessMm',

    label: 'Shell Thickness mm',

    getValue: (drum) => drum.shell?.thicknessMm,

  },

  {

    key: 'shell.reinforcementRings',

    label: 'Reinforcement Rings',

    getValue: (drum) => drum.shell?.reinforcementRings,

  },

  {

    key: 'shell.bearingEdge',

    label: 'Bearing Edge',

    getValue: (drum) => drum.shell?.bearingEdge,

  },

  {

    key: 'shell.snareBedType',

    label: 'Snare Bed Type',

    getValue: (drum) => drum.shell?.snareBedType,

  },

  {

    key: 'shell.hoopRimType',

    label: 'Hoop / Rim Type',

    getValue: (drum) => drum.shell?.hoopRimType,

  },

  {

    key: 'hardware.lugCount',

    label: 'Lug Count',

    getValue: (drum) => drum.hardware?.lugCount,

  },

  {

    key: 'hardware.lugType',

    label: 'Lug Type',

    getValue: (drum) => drum.hardware?.lugType,

  },

  {

    key: 'hardware.snareThrowMakeAndModel',

    label: 'Throw-Off',

    getValue: (drum) => drum.hardware?.snareThrowMakeAndModel,

  },

  {

    key: 'hardware.stockSnareWires',

    label: 'Stock Snare Wires',

    getValue: (drum) => drum.hardware?.stockSnareWires,

  },

  {

    key: 'hardware.stockBatterHead',

    label: 'Stock Batter Head',

    getValue: (drum) => drum.hardware?.stockBatterHead,

  },

  {

    key: 'hardware.stockResoHead',

    label: 'Stock Reso Head',

    getValue: (drum) => drum.hardware?.stockResoHead,

  },

  {

    key: 'sources.primarySourceUrl',

    label: 'Primary Source URL',

    getValue: (drum) => drum.sources?.primarySourceUrl,

  },

];

function isMissing(value) {

  if (value === undefined || value === null) return true;

  const text = String(value).trim().toLowerCase();

  return (

    text === '' ||

    text === 'unknown' ||

    text === 'n/a' ||

    text === 'na' ||

    text === 'not available' ||

    text === 'not published' ||

    text === 'unknown / not published'

  );

}

async function main() {

  console.log(`Scanning ${COLLECTION}...`);

  const snap = await db.collection(COLLECTION).get();

  const report = [];

  snap.docs.forEach((docSnap) => {

    const drum = {

      id: docSnap.id,

      ...docSnap.data(),

    };

    const missingFields = IMPORTANT_FIELD_CHECKS.filter((check) =>

      isMissing(check.getValue(drum))

    ).map((check) => ({

      key: check.key,

      label: check.label,

    }));

    if (!missingFields.length) return;

    report.push({

      id: drum.id,

      companyName: drum.companyName || '',

      companyType: drum.companyType || '',

      lineSeries: drum.lineSeries || '',

      modelName: drum.modelName || '',

      drumType: drum.drumType || '',

      diameter: drum.diameter ?? '',

      depth: drum.depth ?? '',

      missingCount: missingFields.length,

      missingFields,

    });

  });

  report.sort((a, b) => {

    if (b.missingCount !== a.missingCount) {

      return b.missingCount - a.missingCount;

    }

    const companyCompare = String(a.companyName).localeCompare(

      String(b.companyName)

    );

    if (companyCompare !== 0) return companyCompare;

    return String(a.modelName).localeCompare(String(b.modelName));

  });

  const fs = require('fs');

  fs.writeFileSync(

    './missingSnareReferenceFieldsReport.json',

    JSON.stringify(report, null, 2)

  );

  console.log(`Done. ${report.length} drums have missing fields.`);

  console.log('Wrote missingSnareReferenceFieldsReport.json');

  const byCompany = report.reduce((acc, item) => {

    const company = item.companyName || 'Unknown';

    acc[company] = (acc[company] || 0) + 1;

    return acc;

  }, {});

  console.log('\nMissing data by company:');

  Object.entries(byCompany)

    .sort((a, b) => b[1] - a[1])

    .forEach(([company, count]) => {

      console.log(`${company}: ${count}`);

    });

}

main()

  .then(() => process.exit(0))

  .catch((error) => {

    console.error(error);

    process.exit(1);

  });