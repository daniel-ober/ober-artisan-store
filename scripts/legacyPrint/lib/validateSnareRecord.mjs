export function validateSnareRecord(record) {

  const missingRequiredFields = [];

  const requiredFields = [

    "id",

    "companyName",

    "modelName",

    "drumType",

    "dimensions",

    "shell",

    "sourceConfidence",

    "voiceScoreConfidence",

    "scoringBasis",

  ];

  requiredFields.forEach((field) => {

    if (

      record[field] === undefined ||

      record[field] === null ||

      record[field] === ""

    ) {

      missingRequiredFields.push(field);

    }

  });

  const invalidEnums = [];

  const confidenceEnums = ["high", "medium", "low", "unknown"];

  if (

    record.sourceConfidence &&

    !confidenceEnums.includes(record.sourceConfidence)

  ) {

    invalidEnums.push("sourceConfidence");

  }

  if (

    record.voiceScoreConfidence &&

    !confidenceEnums.includes(record.voiceScoreConfidence)

  ) {

    invalidEnums.push("voiceScoreConfidence");

  }

  const engineReady =

    missingRequiredFields.length === 0 &&

    invalidEnums.length === 0 &&

    record.needsResearch !== true;

  return {

    recordId: record.id || null,

    engineReady,

    needsResearch: !engineReady,

    missingRequiredFields,

    invalidEnums,

    conflicts: [],

    warnings: [],

    confidenceDowngrades: [],

    validationVersion: "legacyprint-snare-v1",

  };

}