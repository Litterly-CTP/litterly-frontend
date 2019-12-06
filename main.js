const auth = require("firebase/auth"),
       express = require("express"),
       app = express(),
      { db } = require('./services/firestore');


// APP CONFIG
var engine = require('consolidate');
app.engine('html', engine.mustache);
app.set('view engine', 'html');
//.app.set('views', __dirname + '/public');

// app.set('view engine', 'html');
app.use(express.static(__dirname + '/public'));



app.get("/", (req, res) => 
{
    res.render('landing');
});

app.get("/profile", (req, res) => 
{
    res.render('profile');
});

app.get("/signin", (req, res) => 
{
    res.render('signin');
});

app.listen(5000, () => {
    console.log('and so its begun');
})
