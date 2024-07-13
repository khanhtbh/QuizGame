var Server = require('./src/server/server').Server
, configs 	= require('./config/configs.json');

let start_service = () => {
	console.log("STARTING WEB SOCKET SERVICE...");

	var server = new Server(configs, {
		webSocket: true
	});
	
	server.start(function() {
		console.log("WEB SOCKET SERVICE STARTED");
	});

}

start_service();
