// Sticky fixed navbar. On scroll the bg color should turn opaque 

$(function () {
    $(document).scroll(function () {
        var $nav = $("#mainNavbar");
        $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
    });
});

$(document).ready(function(){
    $("a").on('click', function(event) {
        if (this.hash !== "") {
            event.preventDefault();

            var hash = this.hash;

            $('html, body').animate({
                scrollTop: $(hash).offset().top
            }, 800, function() {
                window.location.hash = hash;
            });
        }
    });
});


// export function render_impact(){
//     console.log("abcd");
// //$( document ).ready( () => {
//  //   const { db } = require('../services/firestore.js');
//    // const trash_reported = db.collection("Users").doc("exampleuser@gmail.com").data().reported_trash;
//    // console.log(trash_reported);
//     // $("#trashreported").html(trash_reported);

// }
//  });
// $( document ).ready( () => {
//     const { db } = require('../services/firestore.js');
//     const trash_reported = db.collection("Users").doc(exampleuser@gmail.com).data().reported_trash;
//     const meetups_attended = //Get shit from database;
//     const trees_saved = //Get shit from database;
//     $("#trashreported").html(trash_reported);
//     $("#meetups-attended").html(meetups_attended);
//     $("#trees-saved").html(trees_saved);

// }



// $( document ).ready( () => {
//     const { db } = require('../services/firestore.js');
//     const trash_reported = db.collection("Users").doc(exampleuser@gmail.com).data().reported_trash;
//     $("#trashreported").html(trash_reported);

// }
// function onSuccess(googleUser) {
//     console.log(‘Logged in as: ’ + googleUser.getBasicProfile().getName());

// }
// function onFailure(error) {
//     console.log(error);
// }

// function renderButton() {
//     gapi.signin2.render(‘my-signin2’, {
//         ‘scope’: ‘profile email’,
//         ‘width’: 240,
//         ‘height’: 50,
//         ‘longtitle’: true,
//         ‘theme’: ‘dark’,
//         ‘onsuccess’: onSuccess,
//         ‘onfailure’: onFailure
//     });
// }