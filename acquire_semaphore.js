const { client, uuid } = require("./redis.js");
const { errorHandler, Defer } = require("./utils");

function acquireSemaphore(name, timeout = 10000, keyTimeout = 10) {// big amount datas cause performance issue, if is a long time calculation operatoin could be the fastest. the operation cost more than 10s.
  const promise = new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      let identifier = uuid.v4();
      client.setnx("lock:" + name, identifier, (err, data) => {
        if (err) {
          reject(err);
          process.exit();
        }
        if (Date.now() - start > timeout) {// release the key
          client.del("lock:" + name);
        }
        if (data) {// got the key
          resolve(identifier);
          clearInterval(interval);
        }
      });
    }, 10);
  });

  return promise;
}

function releaseSemaphore(name, sema) {
  client.watch("lock:" + name);
  client.get("lock:" + name, (err, data) => {
    errorHandler(err);
    if (data === sema) {
      client.del("lock:" + name);
      client.unwatch();
    }
  });
}

module.exports = {
  acquireSemaphore,
  releaseSemaphore
};
