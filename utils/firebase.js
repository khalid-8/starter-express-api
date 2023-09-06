const admin = require("firebase-admin");
const { getFirestore } = require('firebase-admin/firestore');
const {getAuth} = require("firebase-admin/auth")

require('dotenv').config()

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});


const auth = getAuth();
const db = getFirestore();

module.exports = {
  admin,
  auth,
  db,
};
