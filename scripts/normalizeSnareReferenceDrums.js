// scripts/normalizeSnareReferenceDrums.js

import fs from 'fs';

import {

  SNARE_REFERENCE_SCHEMA_VERSION,

  snareReferenceSchemaTemplate,

} from '../src/data/legacyPrint/snareReferenceDrums/bakedSchema.js';

const INPUT_PATH = process.argv[2] || 'data/snareReferenceDrums-sample-current.json';

const OUTPUT_PATH = process.argv[3] || 'data/snareReferenceDrums-sample-normalized-preview.json';

const clone = (value) => JSON.parse(JSON.stringify(value));

const valueOrUnknown = (value) => {

  if (value === null || value === undefined || value === '') return 'unknown';

  return value;

};

const valueOrNull = (value) => {

  if (value === null || value === undefined || value === '') return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;

};

const yesNoToBoolOrUnknown = (value) => {

  if (typeof value === 'boolean') return value;

  if (value === null || value === undefined || value === '') return 'unknown';

  const normalized = String(value).trim().toLowerCase();

  if (['yes', 'y', 'true', '1'].includes(normalized)) return true;

  if (['no', 'n', 'false', '0'].includes(normalized)) return false;

  return 'unknown';

};

const normalizeDrumType = (value) => {

  const normalized = String(value || '').toLowerCase();

  if (normalized.includes('snare')) return 'snare';

  return 'snare';

};

const normalizeCurrentDocToBakedSchema = (doc = {}) => {

  const normalized = clone(snareReferenceSchemaTemplate);

  normalized.companyName = valueOrUnknown(doc.companyName);

  normalized.companyType = valueOrUnknown(doc.companyType);

  normalized.lineSeries = valueOrUnknown(doc.lineSeries);

  normalized.modelName = valueOrUnknown(doc.modelName);

  normalized.patchName = valueOrUnknown(doc.id || doc.patchName);

  normalized.identification.modelNumber = valueOrUnknown(

    doc.modelNumber || doc.production?.modelNum

  );

  normalized.identification.badgeStyle = 'unknown';

  normalized.identification.productionStatus = doc.production?.currentlyInProduction

    ? 'current'

    : doc.production?.discontinued

      ? 'discontinued'

      : 'unknown';

  normalized.identification.currentlyInProduction = yesNoToBoolOrUnknown(

    doc.production?.currentlyInProduction

  );

  normalized.identification.discontinued = yesNoToBoolOrUnknown(

    doc.production?.discontinued

  );

  normalized.identification.artistSignature = yesNoToBoolOrUnknown(

    doc.production?.artistSignatureLine

  );

  normalized.identification.rareCollectible = yesNoToBoolOrUnknown(

    doc.production?.rareCollectible

  );

  normalized.shell.drumType = normalizeDrumType(doc.drumType);

  normalized.shell.dimensions.diameterInches = valueOrNull(doc.diameter);

  normalized.shell.dimensions.depthInches = valueOrNull(doc.depth);

  normalized.shell.dimensions.metricDimensionsMm =

    normalized.shell.dimensions.diameterInches && normalized.shell.dimensions.depthInches

      ? `${(normalized.shell.dimensions.diameterInches * 25.4).toFixed(1)} x ${(normalized.shell.dimensions.depthInches * 25.4).toFixed(1)}`

      : 'unknown';

  normalized.shell.construction.shellConstruction = valueOrUnknown(

    doc.shell?.shellConstruction || doc.shell?.construction

  );

  normalized.shell.construction.shellMaterialPrimary = valueOrUnknown(

    doc.shell?.shellMaterial || doc.shell?.material1

  );

normalized.shell.construction.shellMaterialSecondary =

  doc.shell?.material2 ? doc.shell.material2 : 'none';

normalized.shell.construction.shellMaterialTertiary =

  doc.shell?.material3 ? doc.shell.material3 : 'none';

  normalized.shell.construction.plyCount =

    typeof doc.shell?.plyCount === 'number' ? doc.shell.plyCount : null;

  normalized.shell.construction.layupDescription = valueOrUnknown(

    doc.shell?.plyCountLayup

  );

  normalized.shell.construction.shellThicknessMm = valueOrNull(

    doc.shell?.thicknessMm || doc.shellThicknessMm

  );

  normalized.shell.construction.thicknessClass = 'unknown';

  normalized.shell.construction.reinforcementRings = yesNoToBoolOrUnknown(

    doc.shell?.reinforcementRings

  );

  normalized.shell.construction.reinforcementRingMaterial = valueOrUnknown(

    doc.shell?.reinforcementRingMaterial

  );

  normalized.shell.construction.reinforcementRingThicknessMm = valueOrNull(

    doc.shell?.reinforcementRingThicknessMm

  );

  normalized.shell.bearingEdges.batterSideProfile = valueOrUnknown(

    doc.shell?.bearingEdge

  );

  normalized.shell.bearingEdges.snareSideProfile = valueOrUnknown(

    doc.shell?.bearingEdge

  );

  normalized.shell.bearingEdges.roundover = 'unknown';

  normalized.shell.bearingEdges.evidenceLevel =

    doc.shell?.bearingEdge ? 'legacyFieldMigrated' : 'notVerified';

  normalized.shell.bearingEdges.confidence =

    doc.shell?.bearingEdge ? 'medium' : 'low';

  normalized.shell.bearingEdges.notes =

    doc.shell?.bearingEdge

      ? 'Migrated from legacy shell.bearingEdge field; side-specific edge profile needs review.'

      : 'unknown';

  normalized.shell.snareBeds.present =

    doc.shell?.snareBedType ? true : 'unknown';

  normalized.shell.snareBeds.depthBucket = valueOrUnknown(doc.shell?.snareBedType);

  normalized.shell.snareBeds.widthBucket = 'unknown';

  normalized.shell.snareBeds.bedStyle = valueOrUnknown(doc.shell?.snareBedType);

  normalized.shell.snareBeds.evidenceLevel =

    doc.shell?.snareBedType ? 'legacyFieldMigrated' : 'notVerified';

  normalized.shell.snareBeds.confidence =

    doc.shell?.snareBedType ? 'medium' : 'low';

  normalized.shell.snareBeds.notes =

    doc.shell?.snareBedType

      ? 'Migrated from legacy shell.snareBedType field; depth/width/style needs review.'

      : 'unknown';

  normalized.shell.finish.finishName = valueOrUnknown(doc.shell?.finishType);

  normalized.shell.finish.finishType = valueOrUnknown(doc.shell?.finishType);

  normalized.shell.finish.exteriorTreatment = valueOrUnknown(doc.shell?.finishType);

  normalized.shell.finish.interiorTreatment = 'unknown';

  normalized.shell.finish.acousticImpact = 'engineCalculated';

  normalized.shell.finish.notes = 'unknown';

  normalized.stockHardware.hoops.batterHoopType = valueOrUnknown(

    doc.shell?.hoopRimType || doc.hardware?.hoopRimType

  );

  normalized.stockHardware.hoops.resonantHoopType = valueOrUnknown(

    doc.shell?.hoopRimType || doc.hardware?.hoopRimType

  );

  normalized.stockHardware.hoops.hoopFinish = valueOrUnknown(

    doc.hardware?.hardwareFinish

  );

  normalized.stockHardware.lugs.lugCount = valueOrNull(doc.hardware?.lugCount);

  normalized.stockHardware.lugs.lugType = valueOrUnknown(doc.hardware?.lugType);

  normalized.stockHardware.lugs.hardwareFinish = valueOrUnknown(

    doc.hardware?.hardwareFinish

  );

  normalized.stockHardware.throwOff.make = valueOrUnknown(

    doc.hardware?.snareThrowMakeAndModel

  );

  normalized.stockHardware.throwOff.model = valueOrUnknown(

    doc.hardware?.snareThrowMakeAndModel

  );

  normalized.stockHardware.throwOff.style = 'unknown';

  normalized.stockHardware.throwOff.notes =

    doc.hardware?.snareThrowMakeAndModel

      ? 'Migrated from legacy hardware.snareThrowMakeAndModel field.'

      : 'unknown';

  normalized.stockSnareSystem.snareWires.make = valueOrUnknown(

    doc.hardware?.stockSnareWires

  );

  normalized.stockSnareSystem.snareWires.model = valueOrUnknown(

    doc.hardware?.stockSnareWires

  );

  normalized.stockSnareSystem.snareWires.lengthInches =

    normalized.shell.dimensions.diameterInches;

  normalized.stockSnareSystem.heads.batterHead = valueOrUnknown(

    doc.hardware?.stockBatterHead

  );

  normalized.stockSnareSystem.heads.resonantHead = valueOrUnknown(

    doc.hardware?.stockResoHead

  );

  normalized.stockSnareSystem.heads.stockHeadsKnown =

    Boolean(doc.hardware?.stockBatterHead || doc.hardware?.stockResoHead);

  normalized.collectorMetadata.yearIntroduced = valueOrUnknown(

    doc.production?.yearInProduction

  );

  normalized.collectorMetadata.yearDiscontinued = valueOrUnknown(

    doc.production?.yearDiscontinued

  );

  normalized.sources.primarySourceUrl = valueOrUnknown(

    doc.sources?.primarySourceUrl

  );

  normalized.sources.secondarySourceUrls = doc.sources?.secondarySourceUrl

    ? [doc.sources.secondarySourceUrl]

    : [];

  normalized.sources.imageUrls = doc.sources?.imageUrl && doc.sources.imageUrl !== 'See primary source'

    ? [

        {

          url: doc.sources.imageUrl,

          sourcePageUrl: doc.sources.primarySourceUrl || 'unknown',

          source: 'legacy',

          type: 'legacyImageUrl',

          notes: 'Migrated from legacy sources.imageUrl; verify direct image URL before public use.',

        },

      ]

    : [];

  normalized.sources.sourceConfidence = valueOrUnknown(

    doc.sources?.sourceConfidence || doc.confidence?.sourceConfidence || doc.sourceConfidence

  );

  normalized.sources.notesOnMissingData = [

    doc.notes?.missingData,

    doc.notesOnMissingData,

  ].filter(Boolean);

  normalized.sourceAudit.lastResearched = '2026-05-17';

  normalized.sourceAudit.researchedBy = 'ChatGPT';

  normalized.sourceAudit.needsReview = true;

  normalized.summary.shortDescription = valueOrUnknown(doc.notes?.summary);

  normalized.summary.drumSummaryNotes = valueOrUnknown(

    doc.notes?.scoringBasis || doc.notes?.summary

  );

  return {

    id: doc.id,

    schemaVersion: SNARE_REFERENCE_SCHEMA_VERSION,

    ...normalized,

  };

};

const input = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));

const output = input.map(normalizeCurrentDocToBakedSchema);

fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

console.log(`Normalized ${output.length} docs`);

console.log(`Input: ${INPUT_PATH}`);

console.log(`Output: ${OUTPUT_PATH}`);