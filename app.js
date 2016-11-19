var express = require('express');
var expressHandlebars = require('express-handlebars');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var request = require('request');


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, limit : '5mb' }))
// parse application/json
app.use(bodyParser.json())

app.use(express.static('public'));

//setup handlebars
app.engine('hbs', expressHandlebars());
app.set('view engine', 'hbs');

app.post('/upload', function(req, res){

    base64Data = req.body.img.replace(/^data:image\/png;base64,/,"");
    binaryData = new Buffer(base64Data, 'base64').toString('binary');

    require("fs").writeFile( './public/' +  (new Date()).getTime() + ".png", binaryData, "binary", function(err) {
        if (err)
            return res.send({status : 'error', error : err})

        res.json({status : "success"});
    });

});

app.post('/getFaceRectangle', function(req, res){

    console.log("Getting face rectangle");
    base64Data = req.body.img.replace(/^data:image\/png;base64,/,"");
    binaryData = new Buffer(base64Data, 'base64').toString('binary');

    request.post({
        body: binaryData,
        url: 'https://api.projectoxford.ai/vision/v1.0/analyze?visualFeatures=Faces&language=en',
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': '5ac294bfeee8467f8680e0f6f8b661c2',
            'Content-Type': 'application/octet-stream'
        },
        processData: false
    }, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body) 
        } else {
            console.log("error")
            console.log(error)
            console.log(response)
        }
    });

});

/** When Android app POSTs to trigger takephoto **/
// POST method route
app.post('/takePhoto', function (req, res) {
    // trigger takephoto
    res.send('POST request to the homepage')
})

var port = process.env.PORT || 3007;
http.listen(port, function(){
    console.log('running at port :' , port)
});
