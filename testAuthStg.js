const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
} catch (error) {
  console.error('Error parsing service account key:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

console.log(`Using project: ${admin.app().options.projectId}`);

admin.auth().listUsers(10)
  .then((listUsersResult) => {
    console.log('Users:', listUsersResult.users);
  })
  .catch((error) => {
    console.log('Error listing users:', error);
  });
