class MessageController {
    redisClient = null;
    webSocket = null;
    constructor() {
        this.handleUserConnection = this.handleUserConnection.bind(this);
        this.handleAdminConnection = this.handleAdminConnection.bind(this);
		this.parseConnectionParams = this.parseConnectionParams.bind(this);
        this.updateWebsocket = this.updateWebsocket.bind(this);
        /**
		 * 
		 * @type {Object}
		 * @description index of connected clients. Content: { '[game_id]:[user_id]' : ws }
		 */
		this.clients = {};
    }

    updateWebsocket = (_wss) => {
        this.webSocket = _wss;
        const me = this;
		this.webSocket.wss.on('connection', function connection(ws, incomingMsg) {

			let params = me.parseConnectionParams(incomingMsg);

			if (params.role == 'admin') { }
			else if (params.role == 'player') {
				var user_id = params.user_id;
				var game_id = params.game;
				me.clients[`${game_id}:${user_id}`] = ws;
                me.handleUserConnection(params);
			}

			ws.on('message', function incoming(message) {

			});

			ws.on('close', function close() {
                for (const [key, value] of Object.entries(me.clients)) {
                    if (value === ws) {
                        delete me.clients[key];
                        break;
                    }
                }
			});

			ws.send(JSON.stringify({
				game_event: "connected"
			}));
		});
    }

    handleAdminConnection = () => {

    }

    handleUserConnection = (cnnParams) => {
        console.log("handleUserConnection", cnnParams);
        this.redisClient.publish('user_join', JSON.stringify(cnnParams));
    }

    parseConnectionParams =(ws) => {
		let cnnUrl = ws.url;
		let paramsStr = cnnUrl.split('?')[1].split('&');
		let params = {};

		for (let i = 0; i < paramsStr.length; i++) {
			let param = paramsStr[i].split('=');
			params[param[0]] = param[1];
		}
		return params;
	}
}

module.exports = MessageController;