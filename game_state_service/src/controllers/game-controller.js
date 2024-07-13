class GameController {
    constructor(configs) {
        this.configs = configs;
    }

    static createGame(req, res) {
        var numberOfQuestions = req.body.numberOfQuestions;
        var game = new Game(numberOfQuestions);

        //Send to redis
    }
}

module.exports = GameController