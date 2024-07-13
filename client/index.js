var express = require('express');
var configs = require('./config/configs.json');
var fs = require('fs');

fs.writeFileSync('./src/views/res/configs.json', JSON.stringify(configs, null, 2));

var app = express();

app.use(express.static(__dirname + '/src/views'));

app.listen(configs.port, function() {
    console.log("CLIENT STARTED");
});