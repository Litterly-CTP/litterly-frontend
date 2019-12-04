const express = require('express');
const router = express.Router();
const { db } = require('../services/firestore/services.js');

//event_id is lon and lat
router.post('/join_meetup', (req, res) => {
    const { user_id, event_id, pic_url } = req.body;
    const event = db.collection("Meetups").doc(event_id);
    event.update({
        "confirmed_users": { user_id, user_pic_url }
    })
        .then(res => {
            res.send("User has been successfully added to meetup.");
        })
        .catch(err => {
            res.send("`ERROR: ${err}`");
        })
});



router.delete('/', (req, res) => {
    const { user_id_key, event_id } = req.body;
    const event = db.collection("Meetups").doc(event_id);
    event.update({
        ["confirmed_users" + user_id_key]: firebase.firestore.FieldValue.delete()
    })
        .then(res => {
            res.send("User has been successfully added to meetup.");
        })
        .catch(err => {
            res.send("`ERROR: ${err}`");
        })
});

module.exports = router;
