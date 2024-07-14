var WebSocket = require('../adapters/web_socket/web-socket');

class MessageController {
    redisClient = null;
    webSocket = null;
    constructor() {
        this.handleUserConnection = this.handleUserConnection.bind(this);
		this.parseConnectionParams = this.parseConnectionParams.bind(this);
        this.updateWebsocket = this.updateWebsocket.bind(this);
		this.updateRedisClient = this.updateRedisClient.bind(this);
		this.onLeaderboardUpdate = this.onLeaderboardUpdate.bind(this);
		this.onSendQuestion = this.onSendQuestion.bind(this);
        /**
		 * 
		 * @type {Object}
		 * @description index of connected clients. Content: { '[game_id]:[user_id]' : ws }
		 */
		this.clients = {};
    }

	updateRedisClient = (_redisClient) => {
		this.redisClient = _redisClient;
		this.subscriber = this.redisClient.duplicate();
		this.subscriber.connect();
		this.subscriber.subscribe('leaderboard_update', this.onLeaderboardUpdate);
		this.subscriber.subscribe('send_question', this.onSendQuestion);

	}

    updateWebsocket = (_wss) => {
        this.webSocket = _wss;
        const me = this;
		this.webSocket.wss.on('connection', function connection(ws, incomingMsg) {

			let params = me.parseConnectionParams(incomingMsg);

			var user_id = params.user_id;
			var game_id = params.game_id;

			if (params.role == 'admin') { }
			else if (params.role == 'player') {	}

			me.clients[`${game_id}:${user_id}`] = ws;
            me.handleUserConnection(params);

			ws.on('message', function incoming(message) {
				console.log('received: %s', message);
				let data = JSON.parse(message);
				let command = data['command'];
				let commandData = data['data'];
				switch (command) {
					case 'get_question':
						me.handleGetQuestion(commandData);
						break;
				}
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

    handleUserConnection = (cnnParams) => {
        console.log("handleUserConnection", cnnParams);
        this.redisClient.publish('user_join', JSON.stringify(cnnParams));
    }

	handleGetQuestion = (commandData) => {
		console.log("handleGetQuestion", commandData);
		this.redisClient.publish('get_question', JSON.stringify(commandData));
	}


	onLeaderboardUpdate = (message) => {
		console.log("onLeaderboardUpdate", message);
		let params = JSON.parse(message);
        let game_id = params.game_id;
		for (const [key, value] of Object.entries(this.clients)) {
			console.log("key-value", key, value);
			if (key.indexOf(game_id) !== -1) {
				value.send(JSON.stringify({
					game_event: "leaderboard_update"
				}));
			}
		}
	}

	onSendQuestion = (message) => {
		console.log("onSendQuestion", message);
		let params = JSON.parse(message);
		let game_id = params.game_id;
		let user_id = params.user_id;
		for (const [key, value] of Object.entries(this.clients)) {
			console.log("key-value", key, value);
			if (key.indexOf(`${game_id}:${user_id}`) !== -1) {
				value.send(JSON.stringify({
					game_event: "receive_question",
					data: {
						question: params.question,
						current_question_no: params.current_question_no
					}
				}));
			}
		}
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