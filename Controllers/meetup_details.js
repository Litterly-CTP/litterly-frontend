const express = require('express');
const router = express.Router();
const { db } = require('../services/firestore/services.js');

router.get('/details', (req, res) => {
    const { lat, lon } = req.body;
    const event_name = lat + "-" + long + "meetup";
    const details = {
        address: db.collection("Meetups").doc(event_name).data().meetup_address,
        date_time: db.collection("Meetups").doc(event_name).data().date_time,
        participants: db.collection("Meetups").doc(event_name).data().confirmed_users_ids
    }
    res.send(details);
})

module.exports = router;