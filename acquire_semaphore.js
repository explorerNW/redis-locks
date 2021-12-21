const { client, uuid } = require("./redis");

function timer(delay, callback) {
  let tick = setTimeout(() => {
    const result = callback();
    if (result) {
      clearTimeout(tick);
      process.exit();
    } else {
      tick = timer(delay, callback);
    }
  }, delay);
}

const Defer = (() => {
  function defer() {
    const _this = this;
    this.promise = new Promise((resolve, reject) => {
      _this.resolve = resolve;
      _this.reject = reject;
    });
  }
  return defer;
})();

const errorHandler = err => {
  if (err) {
    console.log(err);
    process.exit();
  }
};

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
            client.zrem("lock:" + name, identifier, () => {});
            resolve(false);
          }
        });
      });
    });
  });
}

function refreshFairSemaphore(name, sema) {
  const defer = new Defer();
  const lock = "lock:" + name;
  client.zadd(lock, sema, (err, response0) => {// sorted set
    errorHandler(err);
    if (response0) {
      client.zrem(lock, sema, (err, response1) => {
        errorHandler(err);
        defer.resolve(false);
      });
    } else {
      defer.resolve(true);
    }
  });
  return defer.promise;
}

function countingFairSemaphore(name, limit = 10, timeout = 100000) {
  const identifier = uuid.v4();
  const semaphore = "lock:" + name;
  const owner = semaphore + ":owner";
  const counter = semaphore + ":counter";
  const defer = new Defer();
  const now = Date.now();
  client.zremrangebyscore(semaphore, "-inf", Date.now() - timeout, (err, response0) => {
    client.zinterstore(owner, 2, owner, semaphore, "weights", 1, 0, (err, response1) => {
      errorHandler(err);
      client.incr(counter, (err, counterValue) => {
        errorHandler(err);
        client.zadd(semaphore, now, identifier, (err, response3) => {
          errorHandler(err);
          client.zadd(owner, counterValue, identifier, (err, response4) => {
            errorHandler(err);
            client.zrank(owner, identifier, (err, rank) => {
              errorHandler(err);
              if (rank < limit) {
                defer.resolve(identifier);
              } else {
                client.zrem(semaphore, identifier, (err, response5) => {
                  errorHandler(err);
                  client.zrem(owner, identifier, (err, response6) => {
                    errorHandler(err);
                    defer.resolve(false);
                  });
                });
              }
            });
          });
        });
      });
    });
  });
  return defer.promise;
}

function releaseCountingSemaphore(name, sema) {
  client.zrem("lock:" + name, sema, (err, data) => {});
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

function releaseFairSemaphore(name, sema) {
  const lock = "lock:" + name;
  const owner = lock + ":owner";
  client.zrem(owner, sema, (err, response0) => {
    errorHandler(err);
    client.zrem(lock, sema, (err, response1) => {
      errorHandler(err);
    });
  });
}

module.exports = {
  timer,
  Defer,
  errorHandler,
  acquireSemaphore,
  releaseSemaphore,
  refreshFairSemaphore,
  countingSemaphore,
  releaseCountingSemaphore,
  countingFairSemaphore,
  releaseFairSemaphore,
};
