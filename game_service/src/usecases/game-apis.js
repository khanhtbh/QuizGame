var express = require('express');
var GameController = require('../controllers/game-controller');
var router = express.Router();

router.route("/games")
    /**
     * 
     * @description Create a new game with game_name and no_questions
    */
    .post(function(req, res) {
        GameController.createGame(req, res);
    });

router.route("/games/:game_id")
    /**
     * 
     * @description Get the game info
     */
    .get(function(req, res) {
        GameController.getGame(req, res);
    });

router.route("/games/:game_id/leaderboard")
    /**
     * 
     * @description Get the leaderboard
     */
    .get(function(req, res) {
        GameController.getLeaderboard(req, res);
    });

module.exports = router;