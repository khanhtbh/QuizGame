const GameState = Object.freeze({
    ready: Symbol("ready"),
    started: Symbol("started"),
    ended: Symbol("ended")
});

class Game {
    id = "";
    name = "";
    questions = [];
    state = GameState.ready;
    constructor(id, name, questions) {
        this.id = id;
        this.name = name;
        this.questions = questions;
    }
}

module.exports = { GameState, Game }