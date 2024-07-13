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

module.exports = router;