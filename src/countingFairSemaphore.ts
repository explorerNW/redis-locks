import { client, uuid } from './redis';
import { map, catchError, switchMap, of, combineLatest, filter } from 'rxjs';

function countingFairSemaphore(name, limit = 10, timeout = 100000) {
    const identifier: string = uuid.v4();
    const semaphore = "lock:" + name;
    const owner = semaphore + ":owner";
    const counter = semaphore + ":counter";
    const now = Date.now();
    return of(true).pipe(
        switchMap(() => client.zremrangebyscore(semaphore, "-inf", Date.now() - timeout)),
        switchMap(() => client.zinterstore(owner, 2, owner, semaphore, "weights", 1, 0,)),
        switchMap(() => client.incr(counter)),
        switchMap((counterValue: number)=> combineLatest([client.zadd(semaphore, now, identifier), of(counterValue)])),
        switchMap(([, counterValue]) => client.zadd(owner, counterValue, identifier)),
        switchMap(() => client.zrank(owner, identifier)),
        map((rank: number)=>{
            if (rank < limit) {
                return identifier;
            } else {
                return false;
            }
        }),
        switchMap((res) => combineLatest([client.zrem(semaphore, identifier), of(res)])),
        switchMap(([, res1]) => combineLatest([client.zrem(owner, identifier), of(res1)])),
        catchError((error)=> { throw error })
    );
}

function refreshFairSemaphore(name, sema) {
    const lock = "lock:" + name;
    return of(true).pipe(
        switchMap(() => client.zadd(lock, sema)),
        switchMap((res) => {
            if (res) {
                return client.zrem(lock, sema);
            }
        }),
        map((res)=>res)
    );4
}

function releaseFairSemaphore(name, sema) {
    const lock = "lock:" + name;
    const owner = lock + ":owner";
    return of(true).pipe(
        switchMap(() => client.zrem(owner, sema)),
        switchMap(() => client.zrem(lock, sema))
    );
}

export {
    countingFairSemaphore,
    refreshFairSemaphore,
    releaseFairSemaphore
}