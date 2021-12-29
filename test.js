const { acquireSemaphore, releaseSemaphore } = require("./acquire_semaphore");

const { countingSemaphore, releaseCountingSemaphore } = require('./countingSemaphore');

const { countingFairSemaphore, releaseFairSemaphore } = require('./countingFairSemaphore');

const { client } = require('./redis.js');
const { errorHandler } = require('./utils');


const count = 100;
const start = Date.now();
const operatoinCost = 10 || Math.random() * 10000;

let quit = 0;
function test() {
  acquireSemaphore("test")
    .then(data => {
      quit++;
      if (data) {
        client.incr("test", (err, response0) => {
          errorHandler(err);
          console.log(`AS: ${response0}`);
        });
        setTimeout(() => {
          releaseSemaphore("test", data);
        }, operatoinCost);
      }
      if (quit === count) {
        console.log('acquireSemaphore: %s s', (Date.now() - start) / 1000);
      }
    })
    .catch(err => {
      console.log(err);
    });
}

client.set('test', 0);
client.set('test1', 0);
client.set('test3', 0);

for (let i = 0; i < count; i++) {

  countingFairSemaphore("test3", count).then(data => {
    if (data) {
      setTimeout(() => {
        client.incr("test3", (err, response0) => {
          errorHandler(err);
          console.log("fairSemaphore: " + response0);
          releaseFairSemaphore("test3", data);
          if (response0 % count === 0) {
            client.set('lock:test3:counter', '0');
            console.log('countingFairSemaphore: %s s', (Date.now() - start) / 1000);
          }
        });
      }, operatoinCost);
    }
  });

  countingSemaphore("test1", count).then(data => {
    if (data) {
      setTimeout(() => {
        client.incr("test1", (err, response0) => {
          console.log(`CS:${response0}`);
          releaseCountingSemaphore("test1", data);
          if (response0 % count === 0) {
            console.log('countingSemaphore: %s s', (Date.now() - start) / 1000);
          }
        });
      }, operatoinCost);
    }
  });

  test();
}
