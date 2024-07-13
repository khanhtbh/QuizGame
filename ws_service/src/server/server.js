var WebSocket = require('../adapters/web_socket/web-socket');

class Server {
	constructor(configs, options) {
		this.serverInstance;
		if (configs.port) {
			this.port = configs.port;
		}
		else {
			this.port = 3000;
		}
		this.useWebSocket = options.webSocket;
        this.serverInstance = require('http').createServer(options.expressApp);
		if (this.serverInstance && options.webSocket) {
			this.webSocket = new WebSocket(this.serverInstance);
		}
		if (options.redisClient) {
			this.redisClient = options.redisClient;
		}

		this.start = this.start.bind(this);
	}
	start = (callback) => {
		if (this.serverInstance) {
			this.serverInstance.listen(this.port, callback);
		}
		if (this.redisClient) { 
			this.redisClient.connect();
		}
		console.log('Server started on port', this.port);
	}
}


module.exports = Server