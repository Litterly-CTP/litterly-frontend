const express = require('express');
const { db } = require('../services/firestore.js');
const router = express.Router();

//get the lat, lon, date, time, email, and username from the client
//this route gets schedules the routes 
router.post("/", async (req, res) => {
    const data = req.body;
    let document = data.lat + data.lon + "marker";
    console.log(document);

    //updating the current taggedtrash meetup property to true
    db.collection("TaggedTrash").doc(document).update({ is_meetup_scheduled: true })
        .then(() => {
            console.log("This trash has been scheduled")
        }).catch(err => {
            console.log("Something went wrong:" + err);
        })

    //get the meetup information xs
    //TODO:refactor to get only the street adress and trashtype
    const meetup = await db.collection("TaggedTrash").doc(document).get()

    console.log(meetup.data().street_address);

    //make a new meetup doc
    const newMeetUp = {
        UTC_meetup_time_and_expiration_time: 0,
        author_display_name: data.username, //this is retireived from the user as the token
        author_id: data.email,
        confirmed_users: [{ user_id: data.email, user_pic_url: "https://" }],
        confirmed_users_ids: [data.email],
        marker_lat: data.lat,
        marker_lon: data.lon,
        meetup_address: meetup.data().street_address,
        meetup_date_time: data.date + " at " + data.time,
        meetup_day: new Date(data.date).getDay(),
        meetup_id: data.lat + data.lon + "meetup",
        meetup_timezone: "EST",
        parent_marker_id: data.lat + data.lon + "marker",
        type_of_trash: meetup.data().trash_type,
    }

    //creating a document for the meetup collection
    document = data.lat + data.lon + "meetup";

    //set the new meetup document
    db.collection("Meetups").doc(document).set(newMeetUp)
        .then(result => console.log(`meetup set: ${result}`))
        .catch(err => console.log(err));


    res.send("The meetup has been setup");
})

//TODO: update the meetup for different times


//TODO: delete the meetup


module.exports = router;