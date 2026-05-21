
const fs = require('fs');

const {

  DEFAULT_SNARE_CALIBRATION_OVERLAY,

  validateSnareCalibrationOverlay

} = require('../../src/legacyPrint/engine/snare');

const OUT_JSON = 'src/legacyPrint/reviewPlans/snare-calibration-overlay-audit-v01.json';

const OUT_MD = 'src/legacyPrint/reviewPlans/snare-calibration-overlay-audit-v01.md';

const audit = validateSnareCalibrationOverlay(DEFAULT_SNARE_CALIBRATION_OVERLAY);

const packet = {

  status: 'SNARE_CALIBRATION_OVERLAY_AUDIT_V01_NO_FIRESTORE_WRITES',

  generatedAt: new Date().toISOString(),

  firestoreWrites: 0,

  overlayVersion: DEFAULT_SNARE_CALIBRATION_OVERLAY.version,

  audit

};

fs.writeFileSync(OUT_JSON, JSON.stringify(packet, null, 2));

const rows = audit.issues.map(issue =>

  `| ${issue.severity} | ${issue.code} | ${issue.path} | ${issue.message} |`

);

const md = [

  '# LegacyPrint Snare Calibration Overlay Audit v0.1',

  '',

  `Generated: ${packet.generatedAt}`,

  '',

  `- Firestore writes: ${packet.firestoreWrites}`,

  `- Overlay version: ${packet.overlayVersion}`,

  `- Valid: ${audit.valid ? 'yes' : 'no'}`,

  `- Errors: ${audit.errorCount}`,

  `- Warnings: ${audit.warningCount}`,

  `- Info: ${audit.infoCount}`,

  '',

  '## Issues',

  '',

  audit.issues.length

    ? '| Severity | Code | Path | Message |\n|---|---|---|---|\n' + rows.join('\n')

    : 'No issues.'

].join('\n');

fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({

  outJson: OUT_JSON,

  outMd: OUT_MD,

  status: packet.status,

  firestoreWrites: 0,

  overlayVersion: packet.overlayVersion,

  valid: audit.valid,

  errors: audit.errorCount,

  warnings: audit.warningCount,

  info: audit.infoCount

}, null, 2));

if (!audit.valid) {

  process.exit(1);

}

