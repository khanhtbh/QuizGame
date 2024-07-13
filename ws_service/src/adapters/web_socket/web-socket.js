var WebSocketServer = require("ws").Server;
const MessageController = require('../../controller/message-controller');
class WebSocket {
	constructor(server) {
		this.wss = new WebSocketServer({ server: server });
	}
}

module.exports = WebSocket;
