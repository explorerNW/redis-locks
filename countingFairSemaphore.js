const { client, uuid } = require("./redis.js");
const { Defer, errorHandler } = require('./utils');

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
    countingFairSemaphore,
    refreshFairSemaphore,
    releaseFairSemaphore
}