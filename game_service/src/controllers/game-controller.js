var QuestionRepos = require('../repositories/QuestionRepos');
var Game = require('../models/game').Game;
var GameState = require('../models/game').GameState;
var redisClient = require('../adapters/redis-client');
const _ = require('lodash');

class GameController {
    constructor(configs) {
        this.configs = configs;
    }

    /**
     * 
     * @description Create a new game with game_name and no_questions
    */
    static async createGame(req, res) {
        var { game_name, no_questions } = req.body;
        if (!game_name || !no_questions || no_questions <= 0) {
            res.status(400).send('Bad Request');
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
            console.log('API new game, err', err);
            res.status(500).send('Internal Server Error');
        }
    }



    static async getGame(req, res) {
        var { game_id } = req.params;
        if (!game_id) {
            res.status(400).send('Bad Request');
            return;
        }
        try {
            var gameName = await redisClient.hGet('game:' + game_id, 'name');
            var noQuestions = await redisClient.hGet('game:' + game_id, 'no_questions');
            var state = await redisClient.hGet('game:' + game_id, 'state');
            // var questions = await redisClient.lRange('game:' + game_id + ':questions', 0, -1);
            if (gameName === null || noQuestions === null || state === null) {
                res.status(404).send('Not Found');
                return;
            }   
        }
        catch (err) {
            console.log('API get game, err', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).json({ 
            success: true,
            code: 1,
            data: {
                game_id: game_id,
                game_name: gameName,
                no_questions: noQuestions,
                state: state,
                // questions: questions
            }
        });
    }

    static async getLeaderboard(req, res) {
        var { game_id } = req.params;
        if (!game_id) {
            res.status(400).send('Bad Request');
            return;
        }
        try {
            var gameName = await redisClient.hGet('game:' + game_id, 'name');
            if (gameName === null) {
                res.status(404).send('Not Found');
                return;
            }
            var leaderboard = await redisClient.zRangeByScoreWithScores('game:' + game_id + ':leaderboard', 0, 10);
            leaderboard = _.reverse(leaderboard);
        } 
        catch (err) {
            console.log('API get game, err', err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).json({ 
            success: true,
            code: 1,
            data: {
                game_id: game_id,
                game_name: gameName,
                leaderboard: leaderboard
            }
        });
    }
}

module.exports = GameController