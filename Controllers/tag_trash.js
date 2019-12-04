const express = require('express');
const { db } = require('../services/firestore.js');
const router = express.Router();



// The client should send a object in the name of data that has the following properties
// example => 
// data = {
//     email: "instanyc@gmail.com",
//     lat: 40.6788330078125
//     lon: - 73.94404551212828
//     street_address: "37 Brooklyn Ave, Brooklyn, NY 11216, USA"
//     timezone: "EST"
//     trash_type: "plastic"
// }

//fired when a user is tagging a trash on to the map
router.post("/", (req, res) => {
    //getting the data from the client
    const data = req.body;

    const taggedTrash = {
        author: data.author,
        expiration_date: Date.now(), //TODO:
        // g: " ",
        id: data.lat + data.lon + "marker",
        is_meetup_scheduled: false,
        // l: [data.lat, data.lon],
        lat: data.lat,
        lon: data.lon,
        street_address: data.street_address,
        timezone: data.timezone,
        trash_type: data.trash_type
    }

    const document = data.lat + data.lon + "marker";

    //setting
    db.collection("TaggedTrash").doc(document).set(taggedTrash)
        .then(result => {
            console.log(result.data())
            res.send("The tag has been saved");
        })
        .catch(err => {
            console.log(`something went wrong:  ${err}`);
            res.send(`something went wrong:  ${err}`);
        })

})


//the query has to be name email ==> ?email="sparky@gmail.com"
router.get("/get_users_trash", async (req, res) => {
    const { email } = req.query; //TODO: test this
    let user_tagged_trash = [];
    let data = {};

    try {
        data = await db.collection("TaggedTrash").get();
    } catch (err) {
        console.log("There was an error getting the data")
    }







})

module.exports = router;