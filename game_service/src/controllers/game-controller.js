var QuestionRepos = require('../repositories/QuestionRepos');
var Game = require('../models/game').Game;
var GameState = require('../models/game').GameState;
var redisClient = require('../adapters/redis-client');
const _ = require('lodash');

class GameController {
    constructor(configs) {
        this.configs = configs;
    }

    static async createGame(req, res) {
        var { game_name, no_questions } = req.body;
        if (!game_name || !no_questions || no_questions <= 0) {
            res.status(400).send("Bad Request");
            return;
        }
        try {
            var questions = QuestionRepos.getRandomQuestions(no_questions);
            var gameId = (Math.round(Date.now())).toString(36);
            var game = new Game(gameId, game_name, questions);
            questions = _.map(questions, (item) => JSON.stringify(item));
            // Store game data in Redis
            await redisClient.hSet('game:' + game.id, 'name', game_name);
            await redisClient.hSet('game:' + game.id, 'no_questions', questions.length);
            await redisClient.hSet('game:' + game.id, 'state', 'ready');
            await redisClient.rPush('game:' + game.id + ':questions', questions);
            // await redisClient.sAdd('game:' + game.id + ':players', JSON.stringify([]));

            // Initialize leaderboard as an empty sorted set
            // await redisClient.zAdd('game:' + game.id + ':leaderboard', {score: 0, value: "dummy"});
            // Respond with game ID
            res.status(200).json({ 
                success: true,
                code: 1,
                data: {
                    game_id: game.id ,
                    game_name: game_name
                }
            });
        }
        catch (err) {
            console.log("API new game, err", err);
            res.status(500).send("Internal Server Error");
        }
    }
}

module.exports = GameController