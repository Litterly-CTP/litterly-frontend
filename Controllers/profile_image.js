const express = require('express');
const router = express.Router();
const { db } = require('../services/firestore/services.js');


// The client sends a user_id, desired pic_url,
// and a boolean pic_action which will set their 
// picture to the desired url if true and otherwise
// overwrite their picture url with a blank string

router.post('/profile_image', (req, res) => {
    const { user_id, pic_url, pic_action } = req.body;
    const new_url = "";
    if (pic_action === true) {
        new_url = pic_action;
    }
    db.collection("Users").doc(user_id).set({
        profile_pic_url: pic_url
    })
        .then(res => {
            res.send("User has successfully updated their profile pic");
        })

        .catch(err => {
            res.send("`ERROR: ${err}`");
        })
});



module.exports = router;