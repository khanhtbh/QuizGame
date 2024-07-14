var redisClient = require('../adapters/redis-client');
class RedisPubSubController {
    constructor() {
        this.onUserJoin = this.onUserJoin.bind(this);

        this.redisClient = redisClient;
        this.subscriber = redisClient.duplicate();
        this.subscriber.connect();
        this.subscriber.subscribe('user_join', this.onUserJoin);
    }

    onUserJoin = async (message) => {
        console.log("onUserJoin", message);
        let params = JSON.parse(message);
        let user_id = params.user_id;
        let game_id = params.game;
        let gameExist = await redisClient.hGet('game:' + game_id, "name");
        console.log("game exist", gameExist);
        if (gameExist !== null) {
            // this.redisClient.sAdd('game:' + game_id + ':players', [user_id]);
            this.redisClient.zAdd('game:' + game_id + ':leaderboard', {score: 0, value: user_id});
        }
        
    }
}
const redisPsCtrl = new RedisPubSubController();
module.exports = redisPsCtrl;