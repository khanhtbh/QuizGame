var WebSocket = require('../adapters/web_socket/web-socket');

class MessageController {
	redisClient = null;
	webSocket = null;
	constructor() {
		this.handleUserConnection = this.handleUserConnection.bind(this);
		this.parseConnectionParams = this.parseConnectionParams.bind(this);
		this.updateWebsocket = this.updateWebsocket.bind(this);
		this.updateRedisClient = this.updateRedisClient.bind(this);
		this.sendEventToClients = this.sendEventToClients.bind(this);

		this.onLeaderboardUpdate = this.onLeaderboardUpdate.bind(this);
		this.onSendQuestion = this.onSendQuestion.bind(this);
		this.onSendAnswerResult = this.onSendAnswerResult.bind(this);
		this.onUserEndQuiz = this.onUserEndQuiz.bind(this);

		this.handleGetQuestion = this.handleGetQuestion.bind(this);
		this.handleAnswerQuestion = this.handleAnswerQuestion.bind(this);
		this.handleEndGame = this.handleEndGame.bind(this);
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
		this.subscriber.subscribe('send_answer_result', this.onSendAnswerResult);
		this.subscriber.subscribe('user_end_quiz', this.onUserEndQuiz);
	}

	updateWebsocket = (_wss) => {
		this.webSocket = _wss;
		const me = this;
		this.webSocket.wss.on('connection', function connection(ws, incomingMsg) {

			let params = me.parseConnectionParams(incomingMsg);

			var user_id = params.user_id;
			var game_id = params.game_id;

			if (params.role == 'admin') { }
			else if (params.role == 'player') { }

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
					case 'answer_question':
						me.handleAnswerQuestion(commandData);
						break;
					case 'end_game':
						me.handleEndGame(commandData);
					default:
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

	handleAnswerQuestion = (commandData) => {
		console.log("handleAnswerQuestion", commandData);
		this.redisClient.publish('answer_question', JSON.stringify(commandData));
	}

	handleEndGame = (commandData) => {
		console.log("handleEndGame", commandData);
		let game_id = commandData.game_id;
		for (const [key, value] of Object.entries(this.clients)) {
			console.log("key-value", key, value);
			if (key.indexOf(game_id) !== -1) {
				value.send(JSON.stringify({
					game_event: "user_end_quiz"
				}));
				value.close();
			}
		}
		this.clients = {};
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
		this.sendEventToClients(game_id, user_id, 'receive_question', params);
	}

	onSendAnswerResult = (message) => {
		console.log("onSendAnswerResult", message);
		let params = JSON.parse(message);
		let game_id = params.game_id;
		let user_id = params.user_id;
		this.sendEventToClients(game_id, user_id, 'answer_result', params);
	}

	onUserEndQuiz = (message) => {
		console.log("onUserEndQuiz", message);	
		let params = JSON.parse(message);
		let game_id = params.game_id;
		let user_id = params.user_id;
		this.sendEventToClients(game_id, user_id, 'user_end_quiz', params);
	}

	sendEventToClients = (game_id, user_id, event, data) => {
		console.log("sendEventToClients", event, data);
		for (const [key, value] of Object.entries(this.clients)) {
			if (key.indexOf(`${game_id}:${user_id}`) !== -1) {
				value.send(JSON.stringify({
					game_event: event,
					data: data
				}));
			}
		}
	}

	parseConnectionParams = (ws) => {
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