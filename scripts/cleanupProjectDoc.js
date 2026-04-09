// cleanupProjectDoc.js
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/your-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function cleanupFields() {
  const docRef = db.collection('projects').doc('yBgvJb3ZCOvjSxV80bcl');
  const snapshot = await docRef.get();

  if (!snapshot.exists) {
    console.error('❌ Document not found.');
    return;
  }

  const data = snapshot.data();
  const fieldsToDelete = {};

  ['depth', 'diameter', 'throwOff', 'targetCompletionWithBuffer'].forEach((field) => {
    if (field in data) {
      fieldsToDelete[field] = admin.firestore.FieldValue.delete();
    }
  });

  if (Object.keys(fieldsToDelete).length > 0) {
    await docRef.update(fieldsToDelete);
    // console.log('✅ Removed:', Object.keys(fieldsToDelete));
  } else {
    // console.log('ℹ️ No matching fields found to delete.');
  }
}

cleanupFields().catch(console.error);