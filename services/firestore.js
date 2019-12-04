const admin = require('firebase-admin');
const { config } = require('./credentials.json');


admin.initializeApp(config);
const db = admin.firestore();


module.exports = {
    db
};