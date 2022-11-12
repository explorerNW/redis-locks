import { client, uuid } from './redis';
import { Subject, switchMap, map, of, catchError } from 'rxjs';

function countingSemaphore(name, limit = 10, timeout = 10000) { //fastest, but if is a long time calculation operation, cause performace issue
  const identifier = uuid.v4();
  const observer = new Subject();
  observer.pipe(
    switchMap(() => client.zremrangebyscore("lock:" + name, "-inf", Date.now() - timeout)),// remove timeout seconds datas before now
    switchMap(() => client.zadd("lock:" + name, Date.now(), identifier)),
    switchMap(() => client.zrank("lock:" + name, identifier)),
    map((data) => {
      if (Number(data) < limit) { // got the key
        return of(identifier)
      } else {
        return client.zrem("lock:" + name, identifier);
      }
    }),
    switchMap((next) => next),
    catchError((error) => { throw error })
  );
  return observer;
}

function releaseCountingSemaphore(name, sema) {
  const observer = new Subject();
  observer.pipe(
    switchMap(()=> client.zrem("lock:" + name, sema)),
    catchError((error) => { throw error })
  );
  
  return observer;
}

export {
  countingSemaphore,
  releaseCountingSemaphore
}