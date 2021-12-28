const { client, uuid } = require("./redis.js");
const { errorHandler } = require('./utils');

function countingSemaphore(name, limit = 10, timeout = 10000) { //fastest, but if is a long time calculation operation, cause performace issue
  const identifier = uuid.v4();
  return new Promise((resolve, reject) => {
    client.zremrangebyscore("lock:" + name, "-inf", Date.now() - timeout, (err, data) => {// remove timeout seconds datas before now
      client.zadd("lock:" + name, Date.now(), identifier, (err, data) => {
        errorHandler(err);
        client.zrank("lock:" + name, identifier, (err, data) => {
          if (data < limit) { // got the key
            resolve(identifier);
          } else {
            client.zrem("lock:" + name, identifier, () => { });
            resolve(false);
          }
        });
      });
    });
  });
}

function releaseCountingSemaphore(name, sema) {
  client.zrem("lock:" + name, sema, (err, data) => { });
}

module.exports = {
  countingSemaphore,
  releaseCountingSemaphore
}