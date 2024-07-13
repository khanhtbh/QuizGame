var redis = require('redis');
var configs = require('../../../config/configs.json');
const redisClient = redis.createClient({ url: configs.redis_host });

module.exports = redisClient;