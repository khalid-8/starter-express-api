const admin = require("firebase-admin");
const { getFirestore } = require('firebase-admin/firestore');
const {getAuth} = require("firebase-admin/auth")

require('dotenv').config()

const key = process.env.DB_PRIVATE_KEY
? process.env.DB_PRIVATE_KEY.replace(/\\n/gm, "\n")
: undefined
const cred = {
  "type": process.env.DB_TYPE,
  "project_id": process.env.DB_PROJECT_ID,
  "private_key_id": process.env.DB_PRIVATE_KEY_ID,
  "private_key": key,
  "client_email": process.env.DB_CLIENT_EMAIL,
  "client_id": process.env.DB_CLIENT_ID,
  "auth_uri": process.env.DB_AUTH_URI,
  "token_uri": process.env.DB_TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.DB_AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.DB_CLIENT_X509_CERT_URL,
  "universe_domain" : process.env.DB_UNIVERSE_DOMAIN
}

console.log(cred)

admin.initializeApp({
    credential: admin.credential.cert(cred),
});


const auth = getAuth();
const db = getFirestore();

module.exports = {
  admin,
  auth,
  db,
};
