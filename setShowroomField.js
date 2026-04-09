// Quick setter for a single Firestore field on soundlegend_showroom/<serial>
// Usage examples:
//   node setShowroomField.js SL-001 specs.shellFundHz 92.4
//   node setShowroomField.js SL-004 "specs.legacyTuningNotes" "200–220 Hz (G3–A3)"
//   node setShowroomField.js SL-004 "specs.fundamentalPitch" "206.0 Hz (G#3)"

const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

function coerce(val) {
  if (val === "true") return true;
  if (val === "false") return false;
  const n = Number(val);
  return Number.isFinite(n) && String(n) === val ? n : val;
}

(async () => {
  const [serialArg, fieldPath, ...valueParts] = process.argv.slice(2);
  if (!serialArg || !fieldPath || !valueParts.length) {
    console.error("Usage: node setShowroomField.js <serial> <fieldPath> <value>");
    process.exit(1);
  }
  const serial = serialArg.toUpperCase();
  const valueRaw = valueParts.join(" ");
  const value = coerce(valueRaw);

  const ref = db.collection("soundlegend_showroom").doc(serial);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error(`❌ No doc for ${serial}`);
    process.exit(1);
  }

  await ref.update({ [fieldPath]: value });
  // console.log(`✅ Updated ${serial}: ${fieldPath} = ${JSON.stringify(value)}`);
  process.exit(0);
})();