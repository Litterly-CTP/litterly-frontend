const auth = require("firebase/auth"),
       express = require("express"),
       app = express(),
      { db } = require('./services/firestore');


// APP CONFIG
var engine = require('consolidate');

app.set('views', __dirname + '/views');
app.engine('html', engine.mustache);
app.set('view engine', 'html');
// app.set('view engine', 'html');
// app.use(express.static(__dirname + '/public'));



app.get("/", (req, res) => 
{
    res.render('landing');
});


app.listen(5000, () => {
    console.log('and so its begun');
})
