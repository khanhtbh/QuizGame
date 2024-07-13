
var redisClient = require('./src/adapters/redis_client/redis-client')
, MessageController = require('./src/controller/message-controller')
, Server = require('./src/server/server')
, configs = require('./config/configs.json');

const messageController = new MessageController();

let start_service = () => {
	console.log("STARTING WEB SOCKET SERVICE...");

	var server = new Server(configs, {
		webSocket: true,
		redisClient: redisClient,
	});
		
	server.start(() => {
		console.log("WEB SOCKET SERVICE STARTED");
	});

	messageController.updateWebsocket(server.webSocket);
	messageController.redisClient = server.redisClient;

}

start_service();
