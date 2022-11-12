import { client, uuid } from './redis';
import { errorHandler } from './utils';

function acquireSemaphore(name, timeout = 10000, keyTimeout = 10) {// big amount datas cause performance issue, if is a long time calculation operatoin could be the fastest. the operation cost more than 10s.
  const promise = new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(async () => {
      let identifier = uuid.v4();
      const data = await client.setnx("lock:" + name, identifier);
      if (Date.now() - start > timeout) {// release the key
        client.del("lock:" + name);
      }
      if (data) {// got the key
        resolve(identifier);
        clearInterval(interval);
      }
    }, 10);
  });

  return promise;
}

async function releaseSemaphore(name, sema) {
  client.watch("lock:" + name);
  try {
    const data = await client.get("lock:" + name);
    if (data === sema) {
      client.del("lock:" + name);
      client.unwatch();
    }
  } catch(error) {
    errorHandler(error);
  }
}

export {
  acquireSemaphore,
  releaseSemaphore
};
