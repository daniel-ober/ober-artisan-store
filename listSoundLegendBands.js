const admin = require("firebase-admin");
const path = require("path");
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

(async () => {
  const qs = await db.collection("soundlegend_showroom").get();
  const rows = [];
  qs.forEach((d) => {
    const x = d.data() || {};
    const s = x.specs || {};
    rows.push({
      serial: d.id,
      shellFundHz: s.shellFundHz ?? "",
      fundamentalPitch: s.fundamentalPitch ?? "",
      legacyLowHz: s.legacyLowHz ?? "",
      legacyHighHz: s.legacyHighHz ?? "",
      lowestHz: s.lowestHz ?? "",
      highestHz: s.highestHz ?? "",
      legacyTuningNotes: s.legacyTuningNotes ?? "",
    });
  });
  console.table(rows);
  process.exit(0);
})();