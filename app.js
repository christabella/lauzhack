var express = require('express');
var expressHandlebars = require('express-handlebars');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, limit : '5mb' }))
// parse application/json
app.use(bodyParser.json())

app.use(express.static('public'));

//setup handlebars
app.engine('hbs', expressHandlebars({defaultLayout: 'main'}));
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

var port = process.env.port || 3007;
http.listen(port, function(){
    console.log('running at port :' , port)
});
