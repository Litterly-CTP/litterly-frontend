const express = require('express');
const { db } = require('../services/firestore.js');
const router = express.Router();

//this route is used to get all of the trash of the map
router.get('/', (req, res) => {
    let locations = [];
    db.collection("TaggedTrash").get()
        .then(docs => {
            docs.forEach(doc => {
                const trash = doc.data();
                if (trash.hasOwnProperty("lat") && trash.hasOwnProperty("lon") && trash.hasOwnProperty("trash_type")) {
                    const trash_data = {
                        lat: trash.lat,
                        lon: trash.lon,
                        trash_type: trash.trash_type,
                        is_meetup_scheduled: trash.is_meetup_scheduled
                    }
                    locations.push(trash_data)
                }
            })
            res.send(locations);
        })
        .catch(err => res.send(err));
})

module.exports = router;