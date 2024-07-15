var redisClient = require('../adapters/redis-client');
class RedisPubSubController {
    constructor() {
        this.onUserJoin = this.onUserJoin.bind(this);
        this.onGetQuestion = this.onGetQuestion.bind(this);
        this.onAnswerQuestion = this.onAnswerQuestion.bind(this);
        this.onEndGame = this.onEndGame.bind(this);
        this.leaderElectionExecutor = this.leaderElectionExecutor.bind(this);
        this.leaderElectionKeyForMsg = this.leaderElectionKeyForMsg.bind(this);

        this.redisClient = redisClient;
        this.subscriber = redisClient.duplicate();
        this.subscriber.connect();
        this.subscriber.subscribe('user_join', this.onUserJoin);
        this.subscriber.subscribe('get_question', this.onGetQuestion);
        this.subscriber.subscribe('answer_question', this.onAnswerQuestion);
        this.subscriber.subscribe('end_game', this.onEndGame);

    }

    onUserJoin = async (message) => {
        console.log('onUserJoin', message);
        let key = this.leaderElectionKeyForMsg('onUserJoin', message);
        let me = this;
        this.leaderElectionExecutor(key, async () => {
            let params = JSON.parse(message);
            let user_id = params.user_id;
            let game_id = params.game_id;
            let player_role = params.role;
            if (player_role !== 'player') {
                return;
            }
            let gameExist = await redisClient.hGet('game:' + game_id, 'name');
            if (gameExist !== null) {
                me.redisClient.zAdd('game:' + game_id + ':leaderboard', { score: 0, value: user_id });
                me.redisClient.publish('leaderboard_update', JSON.stringify({ game_id: game_id }));
            }
        });

    }

    onGetQuestion = async (message) => {
        console.log('onGetQuestion', message);
        let key = this.leaderElectionKeyForMsg('onGetQuestion', message);
        let me = this;
        this.leaderElectionExecutor(key, async () => {
            let params = JSON.parse(message);
            let user_id = params.user_id;
            let game_id = params.game_id;
            var current_question_no = params.current_question_no;
            current_question_no++;
            let totalQuestions = await me.redisClient.hGet('game:' + game_id, 'no_questions');
            console.log('onAnswerQuestion', message);
            if (current_question_no >= totalQuestions) {
                me.redisClient.publish('user_end_quiz', JSON.stringify({ user_id: user_id, game_id: game_id }));
                return;
            }

            var question = await me.redisClient.lIndex('game:' + game_id + ':questions', current_question_no);
            question = JSON.parse(question);
            delete question.answer;
            me.redisClient.publish('send_question', JSON.stringify({
                user_id: user_id,
                game_id: game_id,
                question_no:
                    current_question_no,
                question: question
            }));
        });

    }

    onAnswerQuestion = async (message) => {
        console.log('onAnswerQuestion', message);
        let key = this.leaderElectionKeyForMsg('onAnswerQuestion', message);
        let me = this;
        this.leaderElectionExecutor(key, async () => {
            let params = JSON.parse(message);
            let user_id = params.user_id;
            let game_id = params.game_id;
            var current_question_no = params.current_question_no;
            var answer = params.answer;
            var question = await me.redisClient.lIndex('game:' + game_id + ':questions', JSON.stringify(current_question_no));
            question = JSON.parse(question);
            var awardScore = 0;
            if (question.answer === answer) {
                awardScore = 1;
                me.redisClient.zIncrBy('game:' + game_id + ':leaderboard', 1, user_id);
                me.redisClient.publish('leaderboard_update', JSON.stringify({ game_id: game_id }));
            }
            me.redisClient.publish('send_answer_result', JSON.stringify({
                user_id: user_id,
                game_id: game_id,
                question_no: current_question_no,
                award_score: awardScore,
                correct_answer: question.answer
            }));
        });
        
    }

    onEndGame = async (message) => {
        console.log('onEndGame', message);
        let key = this.leaderElectionKeyForMsg('onEndGame', message);
        let me = this;
        this.leaderElectionExecutor(key, async () => {
            let params = JSON.parse(message);
            let game_id = params.game_id;
            me.redisClient.publish('service_end_game', JSON.stringify({ game_id: game_id }));

            //Clear the game from redis
            setTimeout(() => {
                me.redisClient.hDel('game:' + game_id, 'name');
                me.redisClient.hDel('game:' + game_id, 'no_questions');
                me.redisClient.hDel('game:' + game_id, 'state');
                me.redisClient.del('game:' + game_id + ':questions');
                me.redisClient.del('game:' + game_id + ':leaderboard');
            }, 5000);
        });

    }

    leaderElectionKeyForMsg = (channel, message) => {
        let params = JSON.parse(message);
        var key = 'LOCK_' + channel;
        for (const [_, value] of Object.entries(params)) {
            key += '_' + value;
        }
        return key;
    }

    leaderElectionExecutor = async (key, fn) => {
        try {
            console.log('leaderElectionExecutor', key);
            const acquired = await this.redisClient.setNX(key, "1");
            if (acquired) {
                await fn();
                await this.redisClient.del(key);
            }
            else {
                console.log('Not leader for', key);
            }
        }
        catch (err) {
            console.log('leaderElectionExecutor', err);
        }
    }
}
const redisPsCtrl = new RedisPubSubController();
module.exports = redisPsCtrl;