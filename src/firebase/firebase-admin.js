const admin = require('firebase-admin')

const serviceAccount = require('service account key oyyy')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

module.exports = admin;