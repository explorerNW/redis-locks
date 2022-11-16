import { client, uuid } from './redis';
import { switchMap, map, of, catchError, combineLatest } from 'rxjs';

function countingSemaphore(name, limit = 10, timeout = 10000) { //fastest, but if is a long time calculation operation, cause performace issue
  const identifier = uuid.v4();
  return of(true).pipe(
    switchMap(() => client.zremrangebyscore("lock:" + name, "-inf", Date.now() - timeout)),// remove timeout seconds datas before now
    switchMap(() => client.zadd("lock:" + name, Date.now(), identifier)),
    switchMap(() => client.zrank("lock:" + name, identifier)),
    map((data) => {
      if (data < limit) { // got the key
        return combineLatest([of(identifier), of(false)]);
      } else {
        return combineLatest([of(false), client.zrem("lock:" + name, identifier)]);
      }
    }),
    switchMap((next) => next),
    catchError((error) => { throw error })
  );
}

function releaseCountingSemaphore(name, sema) {
  return of(true).pipe(
    switchMap(()=> client.zrem("lock:" + name, sema)),
    catchError((error) => { throw error })
  );
}

export {
  countingSemaphore,
  releaseCountingSemaphore
}