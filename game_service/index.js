var bodyParser = require('body-parser')
  , express = require('express')
  , cors = require('cors')
  , APIs = require('./src/usecases/game-apis');
var configs = require('./config/configs.json');
var redisClient = require('./src/adapters/redis-client');
const RedisPubSubController = require('./src/controllers/redis-ps-controller');

async function startService() {
    console.log("STARTING GAME STATE SERVICE...");
    await redisClient.connect();
    var app = express();
    app.use(cors());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use("/api/v1", APIs);
    app.listen(configs.port, function () {
        console.log("GAME STATE SERVICE STARTED");
    });
}

startService();