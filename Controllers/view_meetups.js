const express = require('express');
const { db } = require('../services/firestore.js');
const router = express.Router();

//this is the route that is going to show on the google maps

async function view_meetups(type) {

    let meetup;
    let trashTypeArray = [];

    let returnedData = await db.collection('Meetups').get()
        .then(docs => {
            docs.forEach(doc => {
                meetup = doc.data();
                if (meetup["type_of_trash"] === type) {
                    trashTypeArray.push({
                        "address": meetup.meetup_address, "time": meetup.meetup_date_time
                    })
                }
            })
            return trashTypeArray;
        })

    return returnedData;


}

//when see every meet up for plastics
router.get("/plastics", async (req, res) => {
    let plastics = await view_meetups("plastic");
    res.send(plastics)
})



router.get("/metals", async (req, res) => {
    let metals = await view_meetups("metal");
    res.send(metals);
})


router.get("/organics", async (req, res) => {
    let organics = await view_meetups("organic");
    res.send(organics);
})



module.exports = router;






