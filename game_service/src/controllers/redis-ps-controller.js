var redisClient = require('../adapters/redis-client');
class RedisPubSubController {
    constructor() {
        this.onUserJoin = this.onUserJoin.bind(this);
        this.onGetQuestion = this.onGetQuestion.bind(this);
        this.onAnswerQuestion = this.onAnswerQuestion.bind(this);

        this.redisClient = redisClient;
        this.subscriber = redisClient.duplicate();
        this.subscriber.connect();
        this.subscriber.subscribe('user_join', this.onUserJoin);
        this.subscriber.subscribe('get_question', this.onGetQuestion);
        this.subscriber.subscribe('answer_question', this.onAnswerQuestion);

    }

    onUserJoin = async (message) => {
        console.log("onUserJoin", message);
        let params = JSON.parse(message);
        let user_id = params.user_id;
        let game_id = params.game_id;
        let player_role = params.role;
        if (player_role !== 'player') {
            return;
        }
        let gameExist = await redisClient.hGet('game:' + game_id, "name");
        if (gameExist !== null) {
            // this.redisClient.sAdd('game:' + game_id + ':players', [user_id]);
            this.redisClient.zAdd('game:' + game_id + ':leaderboard', { score: 0, value: user_id });
            this.redisClient.publish('leaderboard_update', JSON.stringify({ game_id: game_id }));
        }
    }

    onGetQuestion = async (message) => {
        console.log("onGetQuestion", message);
        let params = JSON.parse(message);
        let user_id = params.user_id;
        let game_id = params.game_id;
        var current_question_no = params.current_question_no;
        current_question_no++;
        let totalQuestions = await redisClient.hGet('game:' + game_id, "no_questions");
        if (current_question_no >= totalQuestions) {
            this.redisClient.publish('end_question', JSON.stringify({ user_id: user_id, game_id: game_id}));
            return;
        }

        var question = await this.redisClient.lIndex('game:' + game_id + ':questions', current_question_no);
        question = JSON.parse(question);
        delete question.answer;
        this.redisClient.publish('send_question', JSON.stringify({ user_id: user_id, game_id: game_id, question_no: current_question_no, question: question }));
    }

    onAnswerQuestion = async (message) => {
        console.log("onAnswerQuestion", message);
        let params = JSON.parse(message);
        let user_id = params.user_id;
        let game_id = params.game_id;
        var current_question_no = params.current_question_no;
        var answer = params.answer;
        var question = await this.redisClient.lIndex('game:' + game_id + ':questions', JSON.stringify(current_question_no));
        question = JSON.parse(question);
        var awardScore = 0;
        if (question.answer === answer) {
            awardScore = 1;
            this.redisClient.zIncrBy('game:' + game_id + ':leaderboard', 1, user_id);
            this.redisClient.publish('leaderboard_update', JSON.stringify({ game_id: game_id }));
        }
        this.redisClient.publish('send_answer_result', JSON.stringify({ 
            user_id: user_id, 
            game_id: game_id, 
            question_no: current_question_no, 
            award_score: awardScore,
            correct_answer: question.answer 
        }));
    }
}
const redisPsCtrl = new RedisPubSubController();
module.exports = redisPsCtrl;