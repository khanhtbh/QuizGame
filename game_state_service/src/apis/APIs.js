var express = require('express');
var GameController = require('../controllers/game-controller');
var Router = express.Router();

Router.route("/game")
    /**
     * 
     * @description Create a new game
    */
    .post(function(req, res) {
        GameController.createGame(req, res);
    })