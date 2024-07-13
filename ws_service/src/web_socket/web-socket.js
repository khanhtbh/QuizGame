var WebSocketServer = require("ws").Server;

class WebSocket {
	constructor(server) {
		
		/**
		 * 
		 * @type {Object}
		 * @description index of connected clients. Content: { '[game_id]:[user_id]' : ws }
		 */
		this.clients = {};
		
		this.wss = new WebSocketServer({ server: server });

		var me = this;
		this.wss.on('connection', function connection(ws, incomingMsg) {

			// TODO: Check connection url and add client

			console.log("Client Connected: ", incomingMsg);

			ws.on('message', function incoming(message) {
				
			});

			ws.on('close', function close() {
				
			});

			ws.send(JSON.stringify({
				"game-event": "connected"
			}));
		});
	}
}

module.exports = {
	WebSocket: WebSocket
}
